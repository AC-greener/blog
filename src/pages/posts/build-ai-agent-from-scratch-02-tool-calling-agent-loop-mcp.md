---
layout: ../../layouts/Blog.astro
title: "从零构建 AI Agent（2）：从工具调用到 Agent Loop 与 MCP"
date: "20260409"
tags: ["ai-agent", "typescript"]
---

> 上一篇中，模型只能生成文字或结构化数据。这一篇再向前一步：让模型判断何时需要工具，由程序执行工具，并把结果交回模型继续回答。

## 1. “调用工具”的其实不是模型

假设用户问：

```text
1234 × 5678 等于多少？
```

模型可以尝试直接计算，但更可靠的做法是使用计算器。问题在于，模型无法直接运行项目中的 TypeScript 函数。它能做的，只是返回一项结构化请求：

```text
请调用 calculator，参数是 multiply、1234 和 5678。
```

程序收到请求后，才会找到对应函数、检查参数并真正执行。

因此，Tool Calling 的职责边界可以概括为：

```text
模型：决定要不要调用、调用哪个、传什么参数
程序：决定允不允许调用、怎样执行、结果能不能继续使用
```

这一区分非常重要。模型给出的工具名称和参数都属于外部输入，不能因为它们来自模型就跳过校验。

## 2. 一个工具有两副面孔

以 Calculator 为例，程序首先需要一个真正执行计算的函数：

```ts
type CalculatorArguments = {
  operator: "add" | "subtract" | "multiply" | "divide";
  first_number: number;
  second_number: number;
};

function calculator({ operator, first_number, second_number }: CalculatorArguments) {
  if (operator === "add") return first_number + second_number;
  if (operator === "multiply") return first_number * second_number;
  if (operator === "subtract") return first_number - second_number;
  if (second_number === 0) throw new Error("Cannot divide by zero.");
  return first_number / second_number;
}
```

但是，模型看不到这个函数的 TypeScript 类型和实现。我们还要提供一份工具定义，告诉它工具的名称、用途和参数格式：

```ts
const calculatorToolDefinition = {
  type: "function",
  function: {
    name: "calculator",
    description: "Perform basic arithmetic operations.",
    parameters: {
      type: "object",
      properties: {
        operator: {
          type: "string",
          enum: ["add", "subtract", "multiply", "divide"],
        },
        first_number: { type: "number" },
        second_number: { type: "number" },
      },
      required: ["operator", "first_number", "second_number"],
      additionalProperties: false,
    },
  },
};
```

所以，一个工具有两副面孔：

- **工具实现**给程序使用，负责实际工作。
- **工具定义**给模型阅读，说明什么时候调用以及参数长什么样。

TypeScript 类型只在开发和编译阶段帮助我们检查代码；传给模型的参数说明则使用 JSON Schema。两者表达的规则相似，却不是同一个东西。

## 3. 模型返回的是请求，不是结果

把工具定义放进 `tools` 后，模型可以在“直接回答”和“请求工具”之间选择：

```ts
const response = await client.chat.completions.create({
  model,
  messages: [{ role: "user", content: "What is 1234 x 5678?" }],
  tools: [calculatorToolDefinition],
});

const assistantMessage = response.choices[0]?.message;
const toolCalls = assistantMessage?.tool_calls ?? [];
```

如果问题是“韩国的首都是哪里”，模型通常可以直接返回文字。如果问题需要精确计算，它可能在 `tool_calls` 中返回 `calculator`。

工具参数位于 `toolCall.function.arguments`，其传输形式是 JSON 字符串。程序需要先解析，再检查工具名称和参数：

```ts
for (const toolCall of toolCalls) {
  if (toolCall.type !== "function") continue;
  if (toolCall.function.name !== "calculator") continue;

  const args = JSON.parse(toolCall.function.arguments);
  const result = calculator(args);
  console.log(result);
}
```

这段示例展示了最小流程，但生产代码不能止步于 `JSON.parse`。至少还要处理以下情况：

- JSON 无法解析。
- 工具名称不在允许列表中。
- 字段缺失、类型不符或数值越界。
- 工具执行超时或抛出异常。
- 调用涉及高风险操作，需要额外授权。

工具定义能帮助模型生成合适参数，却不能代替程序端校验。

## 4. 为什么还要再调用一次模型

计算器执行完以后，我们已经得到 `7006652`，但用户需要的通常是完整回答，而不是一段孤立的工具输出。

程序需要把两样东西写回消息历史：模型刚才提出的调用，以及工具刚刚返回的结果。

```ts
messages.push({
  role: "assistant",
  content: assistantMessage.content,
  tool_calls: assistantMessage.tool_calls,
});

messages.push({
  role: "tool",
  tool_call_id: toolCall.id,
  content: String(calculator(arguments_)),
});
```

然后再请求一次模型：

```ts
const finalResponse = await client.chat.completions.create({
  model,
  messages,
});
```

`tool_call_id` 的作用，是说明这条工具结果对应哪一次调用。如果模型一轮提出多个工具请求，这个关联就尤其重要。

完整流程如下：

```text
用户问题
   ↓
模型返回 tool_calls
   ↓
程序验证并执行工具
   ↓
工具结果写入 messages
   ↓
模型生成最终回答
```

因此，一次完整的 Tool Calling 通常不只是一趟模型请求。第一次让模型决定是否使用工具，后续请求让模型读取工具结果并继续完成任务。

## 5. 从固定流程到 Agent Loop

如果永远只调用一次 Calculator，把两次模型请求写死在代码里也能工作。但真实任务可能是：

1. 先搜索最新资料。
2. 再根据资料继续搜索。
3. 最后整理答案。

程序无法提前知道模型需要几轮工具。于是，我们把“请求模型—执行工具—返回结果”放进循环：

```ts
for (let iteration = 0; iteration < maxIterations; iteration += 1) {
  const response = await client.chat.completions.create({
    model,
    messages,
    tools: toolDefinitions,
  });

  const assistantMessage = response.choices[0]?.message;
  if (!assistantMessage) {
    throw new Error("The model returned no assistant message.");
  }

  if (!assistantMessage.tool_calls?.length) {
    return requireMessageContent(assistantMessage.content);
  }

  messages.push({
    role: "assistant",
    content: assistantMessage.content,
    tool_calls: assistantMessage.tool_calls,
  });

  for (const toolCall of assistantMessage.tool_calls) {
    const result = await toolExecution(toolBox, toolCall);
    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(result),
    });
  }
}
```

循环里只有两个出口：

- 模型不再请求工具，说明它准备返回最终答案。
- 达到最大迭代次数，程序主动终止。

第二个出口不能省略。如果模型不断请求工具，或者几个工具形成反复调用，没有上限的循环就可能一直运行，持续消耗时间和费用。

成熟的 Agent Loop 通常还需要请求超时、总耗时限制、调用次数限制、错误分类和日志记录。它们并不负责让模型“更聪明”，而是让整个系统可以控制和排查。

## 6. 工具箱：用名称连接描述和实现

工具多起来以后，可以把实现放进一个工具箱：

```ts
const toolBox = {
  calculator: calculatorToolImplementation,
  search_web: searchToolImplementation,
};
```

模型看到的是 `toolDefinitions`，程序执行时查询的是 `toolBox`。双方通过相同的工具名称连接。

TypeScript 的类型信息编译后不会自动变成模型可以读取的工具说明，因此项目中把名称、描述、输入 Schema 和执行函数放在同一份元数据中：

```ts
const searchTool = {
  name: "search_web",
  description: "Search the web for current information.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
    },
    required: ["query"],
    additionalProperties: false,
  },
  execute: executeSearchTool,
};
```

这样可以从同一份元数据生成模型需要的工具定义，也可以在执行阶段找到真正的函数，减少“定义写的是一套、实现接受的是另一套”的风险。

## 7. 接入 Web Search 后，Agent 才能读取新信息

Calculator 的结果来自本地代码，Web Search 则要访问外部服务。对 Agent Loop 来说，两者没有本质区别：都是接收参数、执行操作、返回结果的工具。

```ts
interface SearchArguments extends SearchOptions {
  query: string;
}

function executeSearchTool({
  query,
  maxResults,
  topic,
  timeRange,
  country,
}: SearchArguments) {
  const options: SearchOptions = {};
  if (maxResults !== undefined) options.maxResults = maxResults;
  if (topic !== undefined) options.topic = topic;
  if (timeRange !== undefined) options.timeRange = timeRange;
  if (country !== undefined) options.country = country;
  return searchWeb(query, options);
}
```

加入搜索工具后，模型可以根据问题决定是否查询最新资料，再依据返回结果组织答案。

不过，搜索结果来自外部网页，应该被视为不可信数据。网页中的文字可能过时、错误，甚至故意包含面向 Agent 的恶意指令。程序不应把搜索结果提升为系统指令，也不应允许它绕过工具权限。

搜索工具本身还要限制空查询、结果数量和请求时间，并处理网络失败。模型可以决定“想搜什么”，程序仍然负责“允许搜什么”和“结果怎样进入后续流程”。

## 8. MCP 解决的是工具怎样接进来

直接编写工具定义适合少量本地工具。工具来源越来越多时，每个 Agent 都手动适配一遍，就会产生大量重复代码。

MCP（Model Context Protocol）把工具发现和调用过程标准化。基本流程是：

1. MCP Client 连接 MCP Server。
2. Client 请求可用工具列表。
3. Server 返回名称、描述和输入 Schema。
4. Client 把这些信息转换为当前模型 API 能使用的格式。
5. 需要执行时，Client 把调用请求发送给 Server。

项目中的示例先连接 Tavily MCP Server，再发现工具：

```ts
const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "tavily-mcp@latest"],
  env: {
    ...process.env,
    TAVILY_API_KEY: requireTavilyApiKey(),
  },
});

await client.connect(transport);
const toolsResult = await client.listTools();
```

接着，把 MCP 工具转换成模型能识别的函数工具定义：

```ts
const modelTools = toolsResult.tools.map((tool) => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description ?? "",
    parameters: tool.inputSchema,
  },
}));
```

实际调用也通过 Client 发给 Server：

```ts
const result = await client.callTool({
  name: "tavily-search",
  arguments: { query: "2025 Nobel Physics" },
});
```

MCP 并没有取代 Agent Loop。它主要统一了“有哪些工具”和“怎样连接工具”；是否调用、参数是否允许、结果怎样处理，仍然由模型与宿主程序共同完成。

## 9. 把整篇压缩成一张流程图

```text
用户问题 + 消息历史 + 工具定义
                ↓
              模型
          ↙            ↘
   返回最终文本       返回工具请求
                         ↓
                校验名称和参数
                         ↓
                  执行本地工具
                    或 MCP 工具
                         ↓
                 写回工具结果
                         ↓
                     再问模型
```

无论接入 Calculator、Web Search 还是 MCP Server，Agent 的核心循环都没有变化。变化的只是工具从哪里来，以及执行工具时需要哪些安全边界。

## 总结

Tool Calling 并不是让模型直接运行函数，而是让模型生成结构化的调用请求。程序根据白名单和参数规则决定是否执行，再把结果以 `tool` 消息交还给模型。

当工具可能连续调用时，这套流程就需要 Agent Loop。循环负责保存消息历史、分发工具、回传结果，并在得到最终回答或触发限制时结束。

MCP 进一步标准化了工具的发现和连接方式，但它没有改变 Agent 的基本职责分工：模型负责判断，程序负责执行与控制。下一篇将在这个循环上加入更明确的 Thought、Action 和 Observation 结构，进入 ReAct Agent。
