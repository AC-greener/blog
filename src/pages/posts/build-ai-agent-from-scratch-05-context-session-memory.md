---
layout: ../../layouts/Blog.astro
title: "从零构建 AI Agent（5）：上下文、Session 与长期记忆"
date: "20260413"
tags: ["ai-agent", "typescript"]
---

> 上一篇解决了 Agent 怎样从外部资料中查找知识。这一篇继续解决另一个问题：一次任务结束以后，哪些信息应该保留，保存在哪里，又该在什么时候交给模型。

## 1. Agent 的“记忆”不是一个消息数组

假设用户第一次告诉 Agent：

```text
我叫 Alex，是一名产品经理，正在开发一个任务管理工具。
```

几轮之后，用户又问：

```text
我刚才提到的项目进展怎么样了？
```

Agent 要回答这个问题，至少需要保留前面的对话。如果用户关闭应用，第二天新建一次对话，又问“请按照我习惯的格式整理需求”，Agent 还需要从更长期的记录中找回用户偏好。

这两个场景都被称为“记忆”，底层需求却不同。把所有内容永久塞进同一个消息数组，会很快遇到三个问题：

- 内容不断增长，最终超过模型的上下文窗口。
- 旧的工具结果和无关对话持续消耗 token。
- 临时信息、会话记录和长期偏好混在一起，无法控制保存范围。

更清楚的做法，是按照用途和时间范围把记忆分层。

| 层次 | 保存什么 | 主要用途 | 生命周期 |
| --- | --- | --- | --- |
| `ExecutionContext` | 消息、工具调用、工具结果和状态 | 记录当前执行发生过什么 | 一次运行或绑定的 Session |
| 模型请求上下文 | 从事件历史中筛选出的内容 | 告诉模型这一轮需要知道什么 | 一次模型请求 |
| Session | 连续对话的事件和共享状态 | 让多次 `run()` 保持连续 | 一段会话 |
| 长期记忆 | 经过筛选的身份、偏好和重要事实 | 跨 Session 复用信息 | 直到更新或删除 |

这四层不是四种数据库，而是四种职责。关键问题不是“有没有保存”，而是“保存的内容是否应该进入下一次模型请求”。

## 2. `ExecutionContext` 是运行过程的事实记录

上一篇的 Agent Loop 已经会不断产生消息、工具调用和工具结果。`ExecutionContext` 把这些内容按时间顺序记录下来：

```ts
export class ExecutionContext {
  readonly events: Event[];
  readonly state: Record<string, unknown>;
  readonly session: Session | undefined;
  currentStep = 0;
  finalResult: unknown = undefined;

  constructor(options: ExecutionContextOptions = {}) {
    this.session = options.session;
    this.events = options.session?.events ?? options.events ?? [];
    this.state = options.session?.state ?? options.state ?? {};
  }

  addEvent(event: Event): void {
    this.events.push(event);
    if (this.session) {
      this.session.updatedAt = new Date();
    }
  }
}
```

其中，`events` 保存发生过的事实，`state` 保存运行时共享状态。例如：

- 用户发送了一条消息。
- 模型请求了 `search_web`。
- 搜索工具返回三条结果。
- 当前任务已经执行到第几步。
- 上一次摘要处理到哪个位置。

如果 `ExecutionContext` 绑定了 Session，`events` 和 `state` 会直接指向 Session 中的数组和对象。后面新增的事件也就自然进入这段会话。

这里需要建立一个重要边界：事件历史不等于每一轮都要完整发送给模型。

```text
ExecutionContext.events：完整事实记录
LlmRequest.contents：本轮准备给模型看的内容
```

前者应该尽量保持完整，后者可以按需要压缩、摘要或截断。这样，改变上下文策略时不会破坏原始执行记录。

## 3. 上下文管理的目标不是“尽量塞满”

模型的上下文窗口有限，但避免超限只是上下文管理的最低要求。内容即使没有达到上限，也可能带来额外成本、延迟和干扰。

一个实用的 Context Optimizer 应该回答三个问题：

1. 当前请求大约有多大？
2. 哪些内容可以缩短，但仍然保留关键信息？
3. 如果仍然过长，哪些旧内容可以退出本轮上下文？

`step6/context-optimizer.ts` 使用一条逐步收紧的处理链：

```text
计算 token
   ↓ 超过阈值
压缩低价值工具内容
   ↓ 仍然过长
摘要较早的历史
   ↓ 仍然过长
滑动窗口兜底
```

这条顺序体现了一个原则：先减少冗余，再概括旧信息，最后才丢弃内容。

## 4. 第一步：估算本轮请求的 token

上下文限制针对的是 token，不是字符数，也不是消息数量。一条工具结果可能只有一项，却包含整份文件。

项目先定义一个可替换的计数接口：

```ts
export interface TokenCounter {
  count(text: string, modelId?: string): number;
}
```

默认实现使用 `js-tiktoken`。遇到无法识别的自定义模型名时，代码回退到 `o200k_base` 编码：

```ts
export class TiktokenCounter implements TokenCounter {
  count(text: string, modelId = "gpt-4o"): number {
    try {
      return encodingForModel(modelId as TiktokenModel).encode(text).length;
    } catch {
      return getEncoding("o200k_base").encode(text).length;
    }
  }
}
```

计算请求大小时，不只要统计普通消息，还要把系统指令、工具调用、工具结果和工具定义算进去：

```ts
export function countRequestTokens(
  request: LlmRequest,
  counter: TokenCounter,
): number {
  let total = counter.count(request.instructions.join("\n"), request.modelId);

  for (const item of request.contents) {
    total += 4;
    total += counter.count(contentToText(item), request.modelId);
  }

  for (const tool of request.tools) {
    total += counter.count(JSON.stringify(tool.toolDefinition), request.modelId);
  }

  return total;
}
```

这里得到的是工程估算值，不是服务端账单的精确复刻。消息封装和不同 API 的计数方式可能带来差异，因此生产系统还应该预留安全余量，并记录实际用量用于校准。

## 5. 第二步：压缩已经失去价值的工具内容

Agent 上下文中最容易突然变大的，往往不是用户消息，而是工具参数和工具结果。

例如，`create_file` 已经把一大段内容写入磁盘。后续模型只需要知道文件已经保存，不必在每一轮继续携带完整正文。`read_file` 的结果处理完成后，也可以留下文件路径，必要时重新读取。

项目使用按工具名称配置的压缩规则：

```ts
export const DEFAULT_COMPACTION_RULES = {
  toolCallArguments: {
    create_file: "[Content saved to file]",
  },
  toolResultContent: {
    read_file: "File content from {file_path}. Re-read if needed.",
    search_web: "Search results processed. Query: {query}. Re-search if needed.",
    tavily_search: "Search results processed. Query: {query}. Re-search if needed.",
  },
};
```

压缩时，程序通过 `toolCallId` 找回原始参数，再把 `{file_path}` 或 `{query}` 写入替代文本。这样，模型虽然看不到完整结果，仍然知道内容来自哪里，以及怎样重新获取。

压缩不是免费的。它用更短的上下文换取了以后可能再次调用工具的成本。因此，适合压缩的通常是：

- 已经完成阶段性处理的结果。
- 可以低成本重新读取的数据。
- 对后续判断不再重要的大段内容。

权限决定、关键错误和无法重新获取的结果不应该被轻率替换。

## 6. 第三步：用摘要保留旧历史的结论

压缩只能处理已知工具。对话和推理步骤仍然可能不断累积。这时可以让 Summarizer 把较早的历史整理成一段短摘要，同时保留最近的若干项：

```ts
export interface Summarizer {
  (history: string): Promise<string>;
}
```

一份有用的执行摘要至少应该保留：

- 用户最初要完成什么。
- 已经完成了哪些工作。
- 找到了哪些重要事实。
- 做出了哪些不能随意改变的决定。
- 哪些任务仍未完成。
- 发生过哪些会影响后续步骤的错误。

项目把生成的摘要加入 `instructions`，并在 `context.state.lastSummaryIndex` 中记录摘要进度。下一次触发摘要时，就不必重复处理已经概括过的全部历史。

摘要最大的风险，是模型把细节概括错了，或者删掉后来才显得重要的信息。所以，摘要适合缩短模型上下文，不应该反过来覆盖原始事件。需要审计或恢复时，程序仍然可以读取完整 `events`。

## 7. 第四步：用滑动窗口兜底

如果压缩和摘要以后仍然超过阈值，最后的办法是只保留原始用户任务和最近内容：

```ts
export function applySlidingWindow(
  request: LlmRequest,
  windowSize: number,
): LlmRequest {
  const firstUserIndex = request.contents.findIndex(
    (item) => isMessage(item) && item.role === "user",
  );

  if (firstUserIndex < 0) {
    return cloneRequest(request);
  }

  const prefix = request.contents.slice(0, firstUserIndex + 1);
  const remaining = request.contents.slice(firstUserIndex + 1);
  const recent = remaining.length > windowSize
    ? remaining.slice(-windowSize)
    : remaining;

  return {
    ...cloneRequest(request),
    contents: [...prefix, ...recent],
  };
}
```

保留第一条用户消息，是为了避免窗口移动以后丢失最初任务。最近内容则帮助模型继续当前步骤。

滑动窗口简单、可预测，但它按内容项数量截取，而不是按信息价值判断。某个很早的约束可能被移出窗口，一条很长的工具结果也可能独占大部分空间。因此，它更适合作为最后一道兜底，而不是唯一策略。

## 8. `ContextOptimizer` 如何组织四个步骤

单独理解计数、压缩、摘要和窗口还不够，真正重要的是它们以什么顺序执行。

```ts
async optimize(
  request: LlmRequest,
  context: ExecutionContext,
): Promise<LlmRequest> {
  let optimized = cloneRequest(request);

  if (this.#tokenCount(optimized) < this.#options.tokenThreshold) {
    return optimized;
  }

  if (this.#options.enableCompaction) {
    optimized = applyCompaction(optimized, this.#rules);
    if (this.#tokenCount(optimized) < this.#options.tokenThreshold) {
      return optimized;
    }
  }

  if (this.#options.enableSummarization && this.#summarizer) {
    optimized = await applySummarization(/* ... */);
    if (this.#tokenCount(optimized) < this.#options.tokenThreshold) {
      return optimized;
    }
  }

  return applySlidingWindow(optimized, this.#options.slidingWindowSize);
}
```

`optimize()` 先克隆请求，不会原地改写调用方传入的数据。这使 `ExecutionContext.events` 可以继续承担事实记录，优化器只负责生成本轮模型请求的精简版本。

默认阈值和窗口大小只是示例配置。真实项目需要根据模型上下文、预留输出空间、工具定义大小、延迟目标和任务类型共同决定。

## 9. Session 解决多次 `run()` 之间的连续性

`ExecutionContext` 记录一次运行过程，但用户的一段对话通常包含多次 `run()`。Session 的作用，是为这些运行提供共同的事件历史和状态。

```ts
export interface Session {
  readonly sessionId: string;
  readonly userId?: string;
  readonly events: Event[];
  readonly state: Record<string, unknown>;
  readonly createdAt: Date;
  updatedAt: Date;
}
```

Session 本身只描述数据，`SessionManager` 负责创建、读取和保存：

```ts
export interface SessionManager {
  create(sessionId: string, userId?: string): Promise<Session>;
  get(sessionId: string): Promise<Session | undefined>;
  save(session: Session): Promise<void>;
  getOrCreate(sessionId: string, userId?: string): Promise<Session>;
}
```

运行 Agent 前，程序根据 `sessionId` 读取或创建 Session，再用它生成执行上下文：

```ts
export async function createExecutionContext(
  manager: SessionManager,
  sessionId: string,
  userId?: string,
): Promise<ExecutionContext> {
  const session = await manager.getOrCreate(sessionId, userId);
  return new ExecutionContext({ session });
}
```

项目中的 `InMemorySessionManager` 使用 `Map` 保存数据，适合本地演示和测试。它只能在当前进程中维持会话；进程退出，数据就消失。生产环境可以在相同接口后接入数据库或缓存，并补充过期策略、并发控制、身份验证和数据隔离。

Session 也不应该被误解为长期记忆。它保存的是一段会话的完整过程，而不是经过筛选后值得长期保留的用户知识。

## 10. 工具确认为什么也需要保存状态

删除文件、发送邮件和修改生产数据等工具，不应该仅凭模型请求就自动执行。程序需要暂停 Agent，把工具名称和参数交给用户确认。

暂停之后，HTTP 请求或命令行进程可能已经结束。用户稍后批准时，系统必须知道当时等待确认的是哪一次调用。这也是一种状态连续性问题。

项目用 `PendingToolCall` 保存待确认请求：

```ts
export interface PendingToolCall {
  readonly toolCall: ToolCall;
  readonly confirmationMessage: string;
}
```

用户返回决定时，通过 `toolCallId` 与原调用关联：

```ts
export interface ToolConfirmation {
  readonly toolCallId: string;
  readonly approved: boolean;
  readonly modifiedArguments?: Record<string, unknown>;
  readonly reason?: string;
}
```

结果不只有批准和拒绝，还包括没有收到有效决定：

```ts
export type ConfirmationStatus = "approved" | "rejected" | "missing";
```

`resolveConfirmations()` 只把待确认调用和用户回复转换成决策，不直接执行工具。只有状态为 `approved` 的结果，才应该交给执行层。

这种纯状态转换有两个好处：UI、CLI 和服务端可以复用同一套规则；确认逻辑也不会因为顺手调用了工具而绕过 Agent 的权限边界。

如果允许用户修改参数，修改后的内容仍然要重新经过参数校验和权限检查。用户批准的是一次具体操作，不是给工具永久放行。

## 11. 长期记忆只保存“以后仍然有用”的信息

Session 结束后，完整对话未必还需要继续进入模型上下文。但其中可能存在值得跨 Session 使用的信息，例如：

- 用户的身份和长期偏好。
- 一个持续数周的项目及其关键决定。
- 用户明确要求 Agent 以后记住的规则。

一次天气查询、临时文件路径或已经过期的搜索结果，通常不适合自动保存为长期记忆。

长期记忆可以设计成以下流程：

```text
会话内容
   ↓
提取候选事实
   ↓
检查价值、权限、重复和冲突
   ↓
保存结构化记忆
   ↓
新 Session 中按需检索
```

例如，可以先定义一个最小数据接口：

```ts
type TaskMemory = {
  userId: string;
  content: string;
  category: "profile" | "preference" | "project";
  sourceSessionId: string;
};

interface MemoryManager {
  save(memory: TaskMemory): Promise<void>;
  search(userId: string, query: string): Promise<TaskMemory[]>;
}
```

这段代码是设计示意，不是当前 `step6` 已实现的模块。项目现有代码覆盖了上下文优化、Session 和工具确认，长期记忆仍需要后续接入存储、提取和检索逻辑。

上一篇介绍的 RAG 可以用于检索长期记忆：保存时生成 Embedding，并附上用户 ID、类别、来源 Session 和更新时间；新对话开始时，再根据当前问题查找相关记忆。不过，向量相似并不代表内容仍然正确，系统还需要处理更新、冲突和过期。

长期记忆尤其需要用户控制。一个更稳妥的系统应该支持：

- 明确说明哪些信息会被保存。
- 让用户查看、修改和删除记忆。
- 按用户或租户隔离数据。
- 避免默认保存敏感信息。
- 记录记忆来源和更新时间。
- 新事实与旧记忆冲突时，不静默覆盖。

## 12. 把四层记忆串成一次完整运行

一个支持连续对话的 Agent，可以按下面的流程工作：

```text
收到 sessionId 和用户输入
          ↓
加载 Session
          ↓
创建绑定 Session 的 ExecutionContext
          ↓
把完整事件转换成 LlmRequest
          ↓
ContextOptimizer 生成精简请求
          ↓
模型回答或请求工具
          ↓
高风险工具需要确认 ──→ 保存 pending 状态并暂停
          ↓                         ↓
记录新事件                 用户决定后恢复执行
          ↓
保存 Session
          ↓
按策略提取长期记忆（规划能力）
```

这条流程中有四份信息不能混为一谈：

1. 完整事件回答“发生过什么”。
2. 优化后的请求回答“模型这一轮需要看到什么”。
3. Session 回答“这段连续对话属于谁”。
4. 长期记忆回答“哪些信息值得以后继续使用”。

职责分开以后，系统才能在不破坏历史的前提下更换上下文策略，也能避免把所有对话内容永久保存。

## 总结

给 Agent 加记忆，不是无限追加历史消息，而是分层管理不同时间范围的信息。

`ExecutionContext` 保存当前运行的完整事件；Context Optimizer 根据 token 预算依次尝试工具结果压缩、历史摘要和滑动窗口；Session 让多次 `run()` 共享事件与状态；工具确认保存暂停点，使高风险调用可以等待用户决定后再恢复。

长期记忆位于这些能力之上，只保存经过筛选、以后仍然有用的信息。它可以借助上一篇的 RAG 完成检索，但必须同时处理隐私、冲突、过期和用户删除。

当“完整历史、模型上下文、连续会话和长期知识”各自拥有清晰边界时，Agent 才能从完成一次任务的程序，变成可以持续协作的助手。
