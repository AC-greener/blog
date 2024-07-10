---
layout: ../../layouts/Blog.astro
title: "React Server Actions简介"
date: "20240707"
tags: ["React"]
---


![Untitled](http://static.zhutongtong.cn/uPic/2024071012384917205863291720586329141Untitled.png)

## React Server Actions的简介

React Server Actions 是React 19中的一个新特性，能够在服务器上运行异步函数，可以在服务器组件和客户端组件中使用。

Server Actions 主要有如下优点：

- **简化数据获取逻辑**：直接在服务器端获取数据并传递给组件，简化了数据获取逻辑。不需要在客户端编写 API 请求逻辑。
- **渐进式增强表单**：Server Action 可以与 `useActionState` Hooks结合使用，支持渐进式增强表单功能。

## **使用Server actions处理表单的提交**

```jsx
'use server';

export async function updateName(formData) {
		const username = formData.get('username');
	  if (!username) {
	    return {error: 'username is required'};
	  }
	  await db.users.updateName(username);
	}
```

```jsx
// Server Component

import { updateName } from './actions'
export default App() {
  <form action={updateName}>
    <input type="text" name="username" />
    <button type="submit">Request</button>
  </form>
}
```

上面示例中， `requestUsername` 是传递给 `<form>` 的Server Action。当用户提交此表单时，会向服务端的 `requestUsername` 发起网络请求。当在表单中调用服务器操作时，React 将提供表单的 `FormData` 作为Server Action函数的第一个参数。

## **表单之外的Server Action**

当在表单之外使用**Server Action**时，可以在`startTransition`调用**Server Action**操作，可以根据`isPending`的状态显示loading或者其他效果。

以下是表单之外的服务器操作的示例：

```jsx
"use server";
import { sql } from '@vercel/postgres';

export async function incrementLike() {
  // 更新数据库
  const result = await sql`UPDATE likes SET like_count = like_count + 1 RETURNING like_count`;
  return result.rows[0].like_count;
}
```

```jsx

"use client";

import incrementLike from "./actions";
import { useState, useTransition } from "react";

function LikeButton() {
  const [isPending, startTransition] = useTransition();
  const [likeCount, setLikeCount] = useState(0);

  const onClick = () => {
    startTransition(async () => {
      // To read a server action return value, we await the promise returned.
      const currentCount = await incrementLike();
      setLikeCount(currentCount);
    });
  };

  return (
    <>
      <p>Total Likes: {likeCount}</p>
      <button onClick={onClick} disabled={isPending}>
         {isPending ? 'Liking...' : 'Like'}
      </button>;
    </>
  );
}
```

## **Server Action 和 useActionState**

对于只需要访问pending状态和response响应状态，可以使用 `useActionState` Hooks结合Server Action一起使用：

```jsx
"use client";
import { useActionState } from "react";
import {updateName} from './actions';

function UpdateName() {
  const [state, submitAction, isPending] = useActionState(updateName, {error: null});

  return (
    <form action={submitAction}>
      <input type="text" name="name" disabled={isPending}/>
      {state.error && <span>Failed: {state.error}</span>}
    </form>
  );
}
```