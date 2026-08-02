---
layout: ../../layouts/Blog.astro
title: "从零构建 AI Agent（3）：用 ReAct 搭建可扩展执行架构"
date: "20260410"
tags: ["ai-agent", "typescript"]
---

> 本文介绍如何把上一篇中的 Tool Calling，进一步组织成可复用的 Agent 架构。

上一篇的程序已经能让模型调用工具：模型发出调用请求，程序执行工具，再把结果传回模型。但是，“能调用一次工具”还不等于一个完整的 Agent。

真正运行起来以后，我们还要回答一组工程问题：

- 多轮调用产生的消息和工具结果保存在哪里？
- 不同工具怎样接入同一套执行流程？
- Agent 如何摆脱对某个模型 SDK 的直接依赖？
- 模型什么时候应该继续调用工具，什么时候应该结束？
- 如果最终结果不是普通文本，而是一个需要校验的对象，应该怎样返回？

ReAct（Reasoning and Acting）循环解决“下一步做什么”的问题。本篇要做的，则是给这套循环补上清晰的架构边界。

最终的执行链路如下：

```text
用户输入
  ↓
Event → ExecutionContext
  ↓
准备 LLM 请求 → 模型响应
                 ├─ Message ───────────────→ 最终文本
                 └─ ToolCall → 执行工具
                                ↓
                           ToolResult
                                ↓
                       写回 ExecutionContext
                                ↓
                           进入下一轮
```

接下来，我们从这条链路的最小循环开始，再逐步拆出各个组件。

## 1. ReAct：让模型在行动与观察之间循环

上一篇的 Tool Calling 流程可以概括为：模型请求工具，程序执行工具，再把结果传回模型。ReAct 把这个过程变成循环：

```text
Think    根据当前任务和执行历史，决定下一步
Act      调用模型选择的工具
Observe  读取工具返回的结果，并写回上下文
Repeat   继续循环，直到得到最终答案
```

这里的 “Think” 不表示程序必须展示模型的内部思维过程。它只表示模型根据当前上下文生成下一步响应。这个响应可能是普通文本，也可能包含一个或多个工具调用。

如果把请求模型、执行工具、保存历史和判断结束全部写进一个长函数，短期内也能运行。但是，后续加入日志、状态、结构化输出或新工具时，这个函数会迅速变得难以维护。

因此，我们需要把 ReAct 循环拆成几个职责明确的组件。

## 2. 先看清 Agent 的组件边界

本篇会用到六个核心组件。

| 组件 | 负责什么 | 不负责什么 |
| --- | --- | --- |
| `Message`、`ToolCall`、`ToolResult` | 表示一次交互中的具体内容 | 不保存完整执行历史 |
| `Event` | 把同一时刻产生的一组内容记录为事件 | 不决定下一步行动 |
| `ExecutionContext` | 保存一次执行的事件、步数和业务状态 | 不调用模型或工具 |
| `BaseTool`、`FunctionTool` | 统一工具描述和执行方式 | 不管理 Agent 循环 |
| `LlmModel`、`LlmClient` | 隔离模型请求和供应商格式转换 | 不决定工具如何执行 |
| `Agent` | 组织 `run`、`step`、`think` 和 `act` | 不承载具体工具业务逻辑 |

这套拆分的核心原则是：数据对象负责描述发生了什么，执行组件负责推动下一步。先把两者分开，后续扩展才不会互相牵连。

## 3. 用统一类型表示消息、调用和结果

Agent 处理的不只是普通文本。一轮模型响应可能同时包含文字和工具调用，工具执行后还会产生成功或失败的结果。因此，我们先定义三种内容对象：

```ts
class Message {
  constructor(
    readonly role: "system" | "user" | "assistant",
    readonly content: string,
  ) {}
}

class ToolCall {
  constructor(
    readonly toolCallId: string,
    readonly name: string,
    readonly arguments_: Record<string, unknown>,
  ) {}
}

class ToolResult {
  constructor(
    readonly toolCallId: string,
    readonly name: string,
    readonly status: "success" | "error",
    readonly content: unknown[],
  ) {}
}

type ContentItem = Message | ToolCall | ToolResult;
```

三者分别表示：

- `Message`：用户、系统或模型产生的文本。
- `ToolCall`：模型希望程序执行的行动。
- `ToolResult`：程序执行工具后得到的结果。

`toolCallId` 把一次调用和对应结果连接起来。即使模型一次请求多个工具，LLM 层也能知道每个结果属于哪次调用。

统一成 `ContentItem` 以后，后面的事件流和 LLM 层只需要处理一组内部类型，不必在各处直接操作供应商 SDK 的零散对象。

## 4. Event：把内容放进执行时间线

内容对象描述“是什么”，`Event` 则记录“何时由谁产生”。用户输入是一条事件，模型响应是一条事件，工具执行结果也可以组成一条事件。

```ts
class Event {
  readonly id = crypto.randomUUID();
  readonly timestamp = Date.now() / 1000;

  constructor(
    readonly executionId: string,
    readonly author: string,
    readonly content: ContentItem[] = [],
  ) {}
}
```

一个事件可以包含多个 `ContentItem`。例如，模型可能在同一次响应中返回一段文本和两个 `ToolCall`；Agent 也可以把多个工具的执行结果集中记录为一个事件。

事件流有三个直接用途：

1. 保留完整的执行轨迹。
2. 在下一轮请求中还原模型需要的上下文。
3. 为日志、调试和未来的持久化提供统一数据结构。

如果没有 `Event`，消息和工具结果只能散落在多个数组或局部变量中。随着循环变长，我们会越来越难回答“上一轮模型说了什么”“这个结果对应哪个调用”之类的问题。

## 5. ExecutionContext：集中保存一次执行的状态

有了事件，还需要一个容器保存完整执行过程。`ExecutionContext` 就是一次 Agent 运行的状态中心。

| 字段 | 作用 |
| --- | --- |
| `executionId` | 标识一次独立的 Agent 执行 |
| `events` | 按时间顺序保存用户、模型和工具事件 |
| `currentStep` | 记录已经完成的 think-act 轮数 |
| `state` | 保存工具和业务逻辑需要的可扩展状态 |
| `finalResult` | 保存最终文本或结构化结果 |

```ts
class ExecutionContext<
  TState extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly executionId = crypto.randomUUID();
  readonly events: Event[] = [];
  currentStep = 0;
  readonly state: TState;
  finalResult: unknown = null;

  constructor(state?: TState) {
    this.state = state ?? ({} as TState);
  }

  addEvent(event: Event) {
    this.events.push(event);
  }

  incrementStep() {
    this.currentStep += 1;
  }
}
```

这里最容易混淆的是 `events` 和 `state`。

`events` 是执行历史，回答“发生过什么”。它应该按照时间顺序保留用户输入、模型响应和工具结果。`state` 是业务状态，保存工具需要读写的数据，例如用户 ID、临时文件路径或中间计算结果。`finalResult` 则是 Agent 的完成信号和最终输出。

把这些状态集中到上下文还有一个好处：`Agent.run()` 既可以创建新上下文，也可以接收外部传入的上下文。这样，未来要复用会话或恢复执行时，不必改写 Agent 的核心循环。

## 6. 用 BaseTool 统一工具的调用方式

不同工具的业务逻辑可能完全不同，但 Agent 不应该为每个工具写一套调用代码。对 Agent 来说，一个工具只需要提供名称、描述、输入定义和统一的执行入口。

省略构造函数和工具定义转换等细节后，`BaseTool` 的核心执行边界如下：

```ts
abstract class BaseTool {
  abstract readonly name: string;
  abstract readonly description: string;

  abstract execute(
    context: ExecutionContext,
    arguments_: Record<string, unknown>,
  ): Promise<unknown>;

  async call(
    context: ExecutionContext,
    arguments_: Record<string, unknown>,
  ) {
    return this.execute(context, arguments_);
  }
}
```

普通函数则可以由 `FunctionTool` 包装。包装器把函数名称、描述、JSON Schema 和真正的业务函数放进同一个工具对象，并把同步或异步返回统一成 `call()` 接口。

```ts
const calculator = new FunctionTool({
  name: "calculator",
  description: "Perform basic arithmetic.",
  inputSchema: {
    type: "object",
    properties: {
      a: { type: "number" },
      b: { type: "number" },
    },
    required: ["a", "b"],
  },
  func: ({ a, b }) => Number(a) + Number(b),
});
```

这里其实有两个接口：模型通过名称、描述和 Schema 了解“怎样调用工具”；程序通过 `call()` 执行真正的函数。`FunctionTool` 把这两部分放在一起，Agent 不需要了解工具内部的业务实现。

## 7. 用 LLM 层隔离供应商 API

如果 Agent 直接操作 OpenAI SDK 的消息和响应类型，核心循环就会与某个供应商绑定。更稳妥的做法是让 Agent 只依赖自己的请求、响应和模型接口。

```ts
interface LlmRequest {
  instructions: string[];
  contents: ContentItem[];
  tools: BaseTool[];
  toolChoice: "auto" | "none" | "required" | null;
}

interface LlmResponse {
  content: ContentItem[];
  errorMessage?: string;
  usageMetadata: Record<string, unknown>;
}

interface LlmModel {
  generate(request: LlmRequest): Promise<LlmResponse>;
}
```

`LlmClient` 是 `LlmModel` 的一个具体实现。它负责两个方向的转换：

1. 把内部的 `Message`、`ToolCall` 和 `ToolResult` 转成供应商要求的消息格式。
2. 把供应商响应重新解析成 Agent 能理解的 `ContentItem`。

这样，Agent 的核心逻辑只依赖 `generate()`。以后要接入另一个模型服务、使用 Mock 模型编写测试，或者更换底层 API，只需要提供新的 `LlmModel` 实现，不必修改 think-act 循环。

## 8. Agent：组织完整生命周期

上下文、工具和 LLM 层准备好以后，`Agent` 只需要负责推动执行过程。

### 8.1 `run()` 控制循环

`run()` 先把用户输入写入事件流，然后不断执行 `step()`，直到得到最终结果或达到最大步数。

```ts
async run(input: string, context = new ExecutionContext()) {
  context.addEvent(
    new Event(context.executionId, "user", [
      new Message("user", input),
    ]),
  );

  while (
    context.finalResult === null &&
    context.currentStep < this.maxSteps
  ) {
    await this.step(context);

    const lastEvent = context.events.at(-1);
    if (lastEvent && this.isFinalResponse(lastEvent)) {
      context.finalResult = this.extractFinalResult(lastEvent);
    }
  }

  return { output: context.finalResult, context };
}
```

每轮结束后，`isFinalResponse()` 都会检查最新事件。普通输出以“模型返回文本且没有请求工具”为结束信号；结构化输出则以 `final_answer` 成功执行为结束信号。`extractFinalResult()` 再从这个事件中取出最终结果。

`maxSteps` 是必要的安全边界。它不仅防止模型陷入无限循环，也限制一次任务可以消耗的模型请求和工具调用次数。如果达到上限时仍未产生完成信号，调用方应该把它视为未完成，而不是一个正常答案。

### 8.2 `step()` 完成一轮 think-act

一轮执行可以拆成五个动作：

1. `prepareLlmRequest`：把事件流展开成 LLM 请求。
2. `think`：调用 LLM，得到文本或工具调用。
3. 把模型响应记录为事件。
4. `act`：执行工具，并把结果写回事件流。
5. 增加 `currentStep`。

```ts
async step(context: ExecutionContext) {
  const request = this.prepareLlmRequest(context);
  const response = await this.think(request);

  context.addEvent(
    new Event(context.executionId, this.name, response.content),
  );

  const calls = response.content.filter(
    (item): item is ToolCall => item instanceof ToolCall,
  );
  if (calls.length > 0) {
    await this.act(context, calls);
  }

  context.incrementStep();
}
```

如果模型返回工具调用，`act()` 会按名称找到对应工具，执行后生成 `ToolResult`，再把结果追加到上下文。下一轮 `prepareLlmRequest()` 会读取完整事件流，因此模型既能看到自己的调用，也能看到工具的返回结果。

如果模型没有调用工具，普通文本就可以成为最终回答。结构化输出则需要一个更明确的完成协议。

## 9. 用 `final_answer` 建立结构化完成协议

假设我们希望 Agent 返回情感分类结果，而不是一段自由文本。可以先定义结果的 Schema 和解析函数：

```ts
const sentimentOutput = {
  schema: {
    type: "object",
    properties: {
      sentiment: {
        type: "string",
        enum: ["positive", "negative", "neutral"],
      },
      confidence: { type: "number" },
    },
    required: ["sentiment", "confidence"],
  },
  parse: (value: unknown) => validateSentiment(value),
};
```

Agent 初始化时，把这份输出定义包装成一个特殊工具 `final_answer`。这个工具接收一个 `output` 字段，字段内容必须符合上面的 Schema。

```ts
const finalTool = new FunctionTool({
  name: "final_answer",
  description: "Return the final structured answer.",
  inputSchema: {
    type: "object",
    properties: {
      output: sentimentOutput.schema,
    },
    required: ["output"],
    additionalProperties: false,
  },
  func: (arguments_) => sentimentOutput.parse(arguments_.output),
});
```

模型完成任务时，不再随意返回一段 JSON 文本，而是调用：

```ts
final_answer({
  output: {
    sentiment: "positive",
    confidence: 0.92,
  },
});
```

工具执行时，`parse()` 会校验 `output`。校验成功后，结果写入 `context.finalResult`，Agent 才结束循环；校验失败则返回工具错误，模型可以根据错误信息继续修正。

这样做有三个好处：

1. 输出格式由 Schema 明确规定。
2. 解析和验证集中在一个位置。
3. Agent 可以复用工具结果机制判断任务是否完成。

所以，结构化输出不只是“要求模型返回 JSON”，而是 Agent 与模型之间的一份可验证完成协议。

## 10. MCP 只扩展工具层

当工具来自外部 MCP Server 时，Agent 的核心流程不需要改变。MCP Client 负责发现工具，再把名称、描述和输入 Schema 转成内部工具或模型可以识别的工具定义。

```ts
const tools = await mcpClient.listTools();
const modelTools = tools.map((tool) =>
  formatToolDefinition(
    tool.name,
    tool.description,
    tool.inputSchema,
  ),
);
```

MCP 解决的是工具发现和连接标准化问题。`ExecutionContext`、LLM 层和 Agent 循环仍然负责记录事件、发送请求、执行调用和判断结束条件。

换句话说，MCP 是工具层的扩展，不是对 ReAct 循环的替代。

## 总结

一个能调用工具的模型，还缺少执行历史、状态管理、组件边界和结束协议。本篇用六组对象补齐了这些能力：

- `Message`、`ToolCall` 和 `ToolResult` 统一表示交互内容。
- `Event` 把内容组织成可追踪的执行时间线。
- `ExecutionContext` 保存事件、步数、业务状态和最终结果。
- `BaseTool` 与 `FunctionTool` 隐藏具体工具的执行差异。
- `LlmModel` 与 `LlmClient` 隔离 Agent 和供应商 API。
- `Agent` 组织 `run`、`step`、`think` 和 `act`，推动 ReAct 循环。

最后，`final_answer` 把结构化结果变成经过 Schema 校验的完成协议。至此，程序才从“能调用工具的模型”变成一个可扩展、可观察、可验证的 Agent 组件。
