# 高效实现React服务器端渲染：从renderToString到renderToPipeableStream

Published: July 12, 2024
AI summary: 本文介绍了React服务器端渲染（SSR）的概念和优势。客户端渲染（CSR）存在一些局限性，如SEO和性能问题。然后介绍了SSR的概念和示例，以及使用renderToPipeableStream进行非阻塞渲染的优势。最后提到了使用框架如Next.js或Nuxt.js可以更方便地进行服务器端渲染。

```
layout: ../../layouts/Blog.astro
title: "高效实现React服务器端渲染：从renderToString到renderToPipeableStream"
date: "202406713"
tags: ["react"]

```

## **客户端渲染的局限性**

在了解服务端渲染（SSR）之前，我们先来看看客户端渲染（CSR）的一些局限性。

### **SEO**

在客户端渲染的应用程序中（通常使用 React  Vue等库或框架构建），服务器会发回一个空的 HTML 文件，HTML会去加载js。然后js 文件在浏览器中下载并执行，动态呈现页面内容。

这种方法提供了流畅的用户体验，但在搜索引擎优化 (SEO) 和性能方面有一个缺点：不会在第一次请求时下载任何对用户有用的内容，而是必须在页面加载后立即发出另一个请求，获取将为整个站点提供支持的 js。

而一些搜索引擎爬虫可能无法解析这些通过 js 生成的内容，导致搜索引擎无法正确索引网站信息。

### **CSR的性能问题**

CSR的应用程序可能会遇到性能问题，尤其是在网络较差的设备上。在渲染内容之前需要下载、解析和执行 js 可能会导致内容渲染的严重延迟。如果加载时间过长，用户可能会离开页面。

可以用这个图来理解两者的区别：

![image-20240702230220407.png](http://static.zhutongtong.cn/uPic/20240713CGanr1.png)

## **Hydration**

Hydration 的中文含义是“水合”，用于描述将事件侦听器和其他 js 功能添加到服务器上生成的静态 HTML 的过程。目的是是使服务器渲染的应用程序在加载到浏览器中后变得可以交互。

在 React 应用程序中，Hydration会发生这两步：

- 加载客户端 bundle：当浏览器渲染静态 HTML 时，它还会下载并解析包含app代码的 js 包。包括 React 组件以及app功能所需的任何其他代码。
- 添加事件侦听器：加载 js 包后，React 通过将事件侦听器添加到 DOM 元素来“水合”静态 HTML。通常是使用 `react-dom` 中的 `hydrateRoot` 函数完成的，将静态 HTML 转换为完全交互式的 React app。

Hydration带来的一个问题是：导致可交互时间变长

![image-20240702232834269.png](http://static.zhutongtong.cn/uPic/20240713yGqwA7.png)

可以看到，在SSR的页面中可以click的时间是要比CSR晚的，因为SSR多了一些在服务端进行渲染的逻辑。

## **SSR示例**

App.jsx内容如下：

```jsx
// App.jsx
import React from "react";
function App() {
  return (
    <div>
    <h1 onClick={() => console.log('clicked')}>
      <button>Click it</button>
    </h1>
    <p>This is a simple React app.</p>
  </div>
  );
}

export default App;
```

server.js

```jsx
require("@babel/register")({
    presets: ["@babel/preset-env", "@babel/preset-react"]
  });
import App from "./App";
import express from "express";
import React from "react";
import path from "path";    
import ReactDOMServer from "react-dom/server";

const app = express();
app.use(express.static(path.join(__dirname, "client/dist/assets")));
console.log(path.join(__dirname, "static"));
app.get("*", (req, res) => {
  const html = ReactDOMServer.renderToString(<App />);

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>My React App</title>
      </head>
      <body>
        <!-- Injecting the rendered App component -->
        <div id="root">${html}</div>
      </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
```

现在我们的APP组件已经可以在页面上渲染出来了：

![Untitled](http://static.zhutongtong.cn/uPic/20240713UWZFKJ.png)

但这时候我们点击按钮是没有任何反应的。

接下来我们需要在客户端对组件进行Hydration，代码如下：

```jsx
/client/src/main.js

import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from '../../App.jsx'
console.log("Hello from main.js");
hydrateRoot(document, <App />);
```

client端的代码，可以使用任意的打包工具进行处理，打包完成之后会产生一个 `/client/dist/assets/main.js`

我们吧这个文件添加到server.js中：

```jsx
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>My React App</title>
      </head>
      <body>
        <!-- Injecting the rendered App component -->
        <div id="root">${html}</div>
        <!-- 这里是打包过的js文件 -->
        <script type="module" src="/main.js"></script>
      </body>
    </html>
  `);
```

刷新页面，然后能看到点击按钮有了日志：

![Untitled](http://static.zhutongtong.cn/uPic/20240713Jt8tGE.png)

至此我们就完成了一个最小的ssr的应用。

完整的示例代码可以在github找到：

[https://github.com/AC-greener/react-rsc-demo](https://github.com/AC-greener/react-rsc-demo)

## 深入理解**renderToString**

`renderToString` 是 React 提供的服务器端渲染 API，使您能够将 React 组件渲染为服务器上的 HTML 字符串。此 API 是同步的，并返回 HTML 字符串，然后可以将其作为响应发送到客户端。 

下面是使用 `renderToString` 渲染简单 React 组件的示例：

```jsx
import React from "react";
import { renderToString } from "react-dom/server";

function App() {
  return (
    <div>
      <h1>Hello, world!</h1>
      <p>This is a simple React app.</p>
    </div>
  );
}

const html = renderToString(<App />);
console.log(html);
```

我们先回顾一下`React.createElement` API，在 React 中， `<div>Hello, world!</div>` 被转换为：`React.createElement("div", {}, "Hello, world!")`

`React.createElement` 又会返回这样的js对象：

```jsx
{
  type: "div",
  props: {},
  children: ["Hello, world!"]
}
```

总的来说JSX 通过以下流程转换为 HTML：

**`JSX -> React.createElement -> React element -> renderToString(React element) -> HTML`**

就下面这段代码来说：

```jsx
React.createElement(
  "section",
  { id: "list" },
  React.createElement("h1", {}, "This is my list!"),
  React.createElement(
    "ul",
    {},
    amazingThings.map((t) => React.createElement("li", { key: t.id }, t.label))
  )
);
```

`renderToString`会转换为：

```jsx
<section id="list">
  <h1>This is my list!</h1>
  <p>Isn't my list amazing? It contains amazing things!</p>
  <ul>
    <li>Thing 1</li>
    <li>Thing 2</li>
    <li>Thing 3</li>
  </ul>
</section>
```

### renderToString的缺点

- `renderToString` 的主要缺点之一是对于大型 React 应用程序来说它可能很慢。因为它是同步的，所以它会阻塞事件循环并使服务器无法进行响应。
- 由于`renderToString` 返回完整的 HTML 字符串。可能会导致服务器上的内存使用量增加。
- `renderToString` 不支持流式传输，这意味着必须生成整个 HTML 字符串才能将其发送到客户端。这可能会导致第一个字节 (TTFB) 的时间变慢。

## **使用renderToPipeableStream**

为了解决这些问题renderToString的问题，React 18引入的新API`renderToPipeableStream` 。

### `renderToPipeableStream` 的优点

1. **非阻塞渲染**：`renderToPipeableStream` 使用流的方式将 HTML 发送到客户端，因此不需要等待整个应用渲染完成。减少了服务器负载，客户端能够更快地接收并显示内容。
2. **支持并发特性**：支持 React 18 的并发特性，包括 Suspense，可以更好地处理异步数据获取。对于需要等待数据加载的部分，可以用Loading状态渲染，等其余部分渲染完成后再进行替换。
3. **减少 TTFB**：由于采用流式传输，`renderToPipeableStream` 可以更快地将第一个字节发送到客户端，减少首字节时间 (TTFB)，提升页面加载速度和用户体验。

使用`renderToPipeableStream` 重写我们之前的SSR示例：

```jsx
require("@babel/register")({
  presets: ["@babel/preset-env", "@babel/preset-react"],
});

// server.js
import express from "express";
import React from "react";
import path from "path";
import { renderToPipeableStream } from "react-dom/server";
import App from "./App.jsx";

const app = express();

app.use(express.static(path.join(__dirname, "client/dist/assets")));
app.get("/", async (req, res) => {
  const htmlStart = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>React Suspense with renderToPipeableStream</title>
      </head>
      <body>
        <div id="root">
  `;

  const htmlEnd = `
        </div>
        <!-- 这里是打包过的js文件 -->
        <script type="module" src="/main.js"></script>
      </body>
    </html>
  `;

  // 将起始的HTML写入响应
  res.write(htmlStart);

  // 调用renderToPipeableStream，传入React App组件
  // 和一个选项对象以处理shell的准备情况
  const { pipe } = renderToPipeableStream(<App />, {
    onShellReady: () => {
      // 当shell准备就绪时，将渲染的输出流传输到响应
      pipe(res);
    },
    onAllReady: () => {
      // 当所有内容准备就绪时，将结束的HTML写入响应
      res.write(htmlEnd);
      res.end();
    },
  });
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
```

`enderToPipeableStream` 方法，会将 React 组件渲染为流。此方法接受两个参数：要渲染的 React 组件和一个包含回调函数的选项对象。

- `onShellReady` ：当基本的 HTML shell 准备好时调用，此时可以开始将初始的 HTML 内容传输到客户端。
- `onAllReady` ：当所有组件都准备好并渲染完成时调用，此时可以将 HTML 文档的结尾部分写入响应，并结束响应。
- `onError` ：如果渲染过程中出现错误，将调用`onError`，可以在此处理错误并向客户端发送适当的错误响应。

`renderToPipeableStream` 的实现原理和Nodejs的stream相关，感兴趣的可以点击这里：

[nodejs-stream-module-basic-tutorial](https://www.zhutongtong.cn/posts/nodejs-stream-module-basic-tutorial)

## **DRY**

从零创建一个服务器渲染还是比较复杂的，虽然 React 提供了一些服务器渲染的 API，但从头构建可能会遇到各种问题。这也是我们选择 Next.js 或者 Nuxt.js 等框架的原因，通过利用这些框架，节省开发时间，也为我们提供了一些最佳实践。

## **总结**

本文介绍了React服务器端渲染（SSR）的概念和优势。客户端渲染（CSR）存在一些局限性，如SEO和性能问题。然后介绍了SSR的概念和示例，以及使用`renderToPipeableStream`进行非阻塞渲染的优势。最后提到了使用框架如Next.js或Nuxt.js可以更方便地进行服务器端渲染。

完整代码github地址：[https://github.com/AC-greener/react-rsc-demo](https://github.com/AC-greener/react-rsc-demo)