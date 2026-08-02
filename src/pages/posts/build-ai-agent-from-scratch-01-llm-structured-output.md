---
layout: ../../layouts/Blog.astro
title: "从零构建 AI Agent（1）：从 LLM 调用到结构化输出"
date: "20260403"
tags: ["ai-agent", "typescript"]
---

> LLM 是 Agent 的判断中心，但它不会自动记住对话，也不能直接操作外部世界。要写出一个可用的 Agent，第一步是弄清楚三件事：请求怎样发出去、上下文怎样保留下来、输出怎样变得可控。

## 1. 先看一条最小调用链

下面是一次最简单的模型调用：

```ts
const response = await client.chat.completions.create({
  model,
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What is the capital of France?" },
  ],
});

const answer = response.choices[0]?.message.content;
console.log(answer);
```

这段代码只做了四件事：

1. 选择一个模型。
2. 把消息列表发送给模型。
3. 等待模型生成响应。
4. 从第一条候选结果中取出文本。

可以把整个过程记成一条很短的路径：

```text
messages → 模型 → assistant message
```

这里最重要的参数是 `messages`。它不是普通字符串，而是一组按顺序排列的消息。每条消息都有一个 `role`，表示这句话在对话中扮演什么角色。

- `system`：说明模型应该遵守的总体规则。
- `user`：表示用户当前提出的任务。
- `assistant`：表示模型此前生成的内容。
- `tool`：表示外部工具返回的结果，下一篇会详细介绍。

示例项目没有直接打印一个可能为空的值，而是通过 `requireMessageContent` 检查响应。真实应用还需要处理网络错误、限流、超时和内容为空等情况。模型调用是一项外部请求，不能假设它永远成功。

## 2. 模型为什么“忘记”了上一句话

初次接触 LLM API 时，一个常见误解是：既然它能聊天，应该会自动记住前文。

实际上，每次独立请求都只包含你这一次发送的内容。比如先后执行下面两个请求：

```ts
await client.chat.completions.create({
  model,
  messages: [{ role: "user", content: "My name is Jungjun." }],
});

await client.chat.completions.create({
  model,
  messages: [{ role: "user", content: "What is my name?" }],
});
```

第二次请求里没有第一句话，模型自然不知道名字是什么。

要让对话连贯，程序必须自己保存历史，并在下一次请求时重新发送：

```ts
const messages = [
  { role: "user", content: "My name is Jungjun." },
  { role: "assistant", content: "Nice to meet you, Jungjun." },
  { role: "user", content: "What is my name?" },
];
```

所以，模型并不是在服务器上替你维护了一段“记忆”。它只是根据本次收到的上下文继续生成内容。

这也带来一个直接问题：对话越长，重复发送的内容越多，成本和延迟通常也越高。后面的 Agent 还会把工具调用和工具结果写入消息历史，因此实际项目往往需要截断旧消息、生成摘要，或者把长期信息存入外部系统。

## 3. 提示词不是咒语，而是任务说明书

提示词的作用，不是寻找一句让模型突然变聪明的“神奇口令”，而是减少任务中的歧义。

例如，这句话很难得到稳定结果：

```text
帮我总结一下。
```

模型不知道要总结什么、写给谁看、写多长，也不知道能不能补充原文之外的信息。把这些条件说清楚，结果通常会稳定得多：

```text
你是一名技术编辑。

任务：将下面的内容总结成三句话。
读者：刚接触这个主题的开发者。
约束：只能使用原文信息，不得补充新事实。

原文：
<article>
{{text}}
</article>
```

一个实用的提示词通常包含以下几部分：

1. **任务**：到底要完成什么。
2. **上下文**：模型判断时可以使用哪些资料。
3. **输入**：这一次需要处理的具体内容。
4. **约束**：长度、语言、范围和禁止事项。
5. **输出格式**：结果要写成段落、列表还是固定结构。
6. **角色或读者**：只有在它确实影响表达方式时才需要加入。

不必机械地凑齐六项。任务简单时，一句清楚的指令就够了；任务复杂时，再补充必要的边界。

## 4. 用模板分开固定规则和动态输入

如果每次调用都在代码中拼接完整提示词，很快就会出现重复、漏项和格式不一致。更好的办法是把固定规则写成模板，只把本次输入作为参数传入。

```ts
function buildSummaryMessages(text: string) {
  return [
    {
      role: "system",
      content: "You summarize text accurately and concisely.",
    },
    {
      role: "user",
      content: [
        "Summarize the article in three sentences.",
        "Use only facts from the supplied article.",
        `<article>\n${text}\n</article>`,
      ].join("\n\n"),
    },
  ];
}
```

这样做有三个好处：

- 同一套规则可以处理不同输入。
- 修改提示词时，只需要改一个地方。
- 模板参数可以用 TypeScript 类型检查，减少遗漏。

分隔符也能让指令和数据更容易区分。不过，它只是帮助模型理解结构，不是安全边界。如果输入中含有恶意指令，真正的权限控制仍然必须放在程序中。

## 5. 四类常见任务，分别该说清楚什么

不同任务容易出错的地方不同，提示词也不应该套用同一份模板。

### 5.1 分类：先定义允许的答案

```text
将评论分为 positive、negative 或 neutral。
只返回其中一个标签。

评论：{{text}}
```

分类任务的关键是明确类别集合和边界。如果 `neutral` 指“没有明显情绪”，就应该把定义写出来，而不是让模型自己猜。

### 5.2 摘要：说明长度、读者和事实范围

```text
将文章总结成不超过 80 个汉字的一段话。
读者是初学者。
只能使用文章中的信息；资料不足时不要补写。

文章：{{text}}
```

“简短一点”没有可执行的尺度，“不超过 80 个汉字”则更容易测试。

### 5.3 问答：说明答案只能来自哪里

```text
只根据下面的资料回答问题。
如果资料不足，请明确回答“现有资料无法确定”。

资料：{{context}}
问题：{{question}}
```

这能减少模型用常识补齐空白，但不能保证答案一定正确。重要结论仍然要和原始资料核对。

### 5.4 复杂任务：把过程拆成可检查的阶段

遇到多个条件时，可以让模型先提取事实，再按照规则判断，最后输出结论。与其要求一大段不可验证的推理，不如让它返回简短依据、检查清单或结构化字段。

例如，审核报销申请时，可以要求模型输出“金额是否超限”“凭证是否缺失”“建议结果”三个字段。这样，程序可以逐项检查，而不是从一段长文字中猜结论。

## 6. 零样本和少样本：什么时候需要示例

只给任务说明、不提供示例，叫作零样本提示。它适合规则清楚、模型已经熟悉的任务，优点是短，维护成本也低。

如果任务有特殊格式或容易混淆的边界，可以增加少量输入输出示例，也就是少样本提示：

```text
输入：The package arrived early.
输出：positive

输入：The product stopped working after one day.
输出：negative

输入：{{review}}
输出：
```

示例的价值不在于数量，而在于代表性。正常情况、边界情况和容易误判的情况，往往比堆叠许多重复例子更有用。示例越多，上下文也越长，因此应该通过测试决定是否值得保留。

## 7. 程序需要数据时，使用结构化输出

自然语言适合人阅读，程序更喜欢固定字段。假设我们要从一句话中提取姓名、邮箱和电话，可以给模型一份 JSON Schema：

```ts
const response = await client.chat.completions.create({
  model,
  messages: [
    {
      role: "user",
      content:
        "My name is John Smith, my email is john@example.com, and my phone is 555-1234.",
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "extracted_info",
      strict: true,
      schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: ["string", "null"] },
        },
        required: ["name", "email", "phone"],
        additionalProperties: false,
      },
    },
  },
});
```

这里的 `strict: true` 要求输出遵守所提供的 Schema。得到文本后，程序再把它解析成对象：

```ts
const content = requireMessageContent(response.choices[0]?.message.content);
const result = JSON.parse(content) as ExtractedInfo;
```

结构化输出解决的是“结果长什么样”，不是“结果一定正确”。字段可以完全符合 Schema，内容却仍然提取错了。因此，邮箱格式、电话号码规则和业务约束仍然需要由程序验证。

TypeScript 的 `as ExtractedInfo` 也只是编译期断言，不会在运行时检查数据。对于外部输入，生产代码通常还会增加运行时校验。

## 8. 提示词也需要测试

提示词修改后看起来更清楚，不等于实际效果更好。可以像测试代码一样，准备一组固定样例：

- 正常输入：验证主要任务是否完成。
- 边界输入：验证空内容、超长内容和模糊表达。
- 对抗输入：验证输入中含有冲突指令时会发生什么。
- 格式错误：验证程序能否处理缺字段或无法解析的结果。

比较提示词版本时，最好固定测试集和判定标准。否则，每次随手换一个问题，很难判断究竟是提示词变好了，还是样例恰好更简单。

提示词安全也遵循同一个原则：模型负责理解，程序负责授权。涉及文件、数据库、支付或外部请求时，不能用一句“请勿执行危险操作”代替白名单、参数校验和权限控制。

## 9. 从生成文字到请求行动

到目前为止，模型只能返回文本或结构化数据。即使它生成下面这段 JSON，也不会真的查询天气：

```json
{
  "tool": "get_weather",
  "arguments": { "city": "Shanghai" }
}
```

真正执行网络请求的必须是我们的程序。完整流程是：

1. 程序把可用工具告诉模型。
2. 模型判断是否需要工具，并返回工具名称和参数。
3. 程序检查参数并执行工具。
4. 程序把结果交还给模型。
5. 模型根据结果生成最终回答。

这就是下一篇要实现的 Tool Calling。提示词让模型知道该做什么，工具则让 Agent 有能力影响外部世界。

## 总结

一次 LLM 调用的核心，是把当前任务和必要上下文放进消息列表。API 不会替应用保存独立请求之间的对话历史；记忆、裁剪和长期存储都需要程序负责。

提示词的本质是一份任务说明书。目标、资料、约束和输出格式越清楚，结果越容易测试。需要给程序继续处理的数据时，可以用 JSON Schema 约束输出结构，但业务正确性仍然要单独验证。

理解了“请求、上下文和输出”这三层，下一步就可以让模型不只生成答案，还能提出工具调用请求。
