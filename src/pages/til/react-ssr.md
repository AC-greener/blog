---
layout: ../../layouts/Blog.astro
title: "服务器端渲染（SSR）实战指南"
date: "20240630"
tags: ["react"]
---



## 客户端渲染的局限性

在了解服务端渲染（SSR）之前，我们先来看看客户端渲染（CSR）的一些局限性。

### SEO

在客户端渲染的应用程序中（通常使用 React  Vue等库或框架构建），服务器会发回一个空的 HTML 文件，HTML会去加载js。然后js 文件在浏览器中下载并执行，动态呈现页面内容。

这种方法提供了流畅的用户体验，类似于本机应用程序，但在搜索引擎优化 (SEO) 和性能方面有一个缺点：不会在第一次请求时下载任何对用户有用的内容，而是必须在页面加载后立即发出另一个请求，获取将为整个站点提供支持的 js。

而一些搜索引擎爬虫可能无法解析这些通过 j s 生成的内容，导致搜索引擎无法正确索引网站信息。

### CSR的性能问题

CSR的应用程序可能会遇到性能问题，尤其是在网络较差的设备上。在渲染内容之前需要下载、解析和执行 j s 可能会导致内容渲染的严重延迟。“交互时间TTI”是一个至关重要的指标，因为它直接影响用户参与度和跳出率。如果加载时间过长，用户可能会离开页面，这种行为可能会进一步对页面的 SEO 排名产生负面影响。

可以用这个图来理解两者的区别：

![image-20240702230220407](/Users/tongtong/code/blog/src/pages/til/assets/image-20240702230220407.png)



## Hydration

Hydration 的中文含义是“水合”，用于描述将事件侦听器和其他 js 功能添加到服务器上生成的静态 HTML 的过程。目的是是使服务器渲染的应用程序在加载到浏览器中后变得可以交互。

在 React 应用程序中，Hydration会发生这两步：

- 加载客户端 bundle：当浏览器渲染静态 HTML 时，它还会下载并解析包含app代码的 js 包。包括 React 组件以及app功能所需的任何其他代码。
- 添加事件侦听器：加载 js 包后，React 通过将事件侦听器添加到 DOM 元素来“水合”静态 HTML。通常是使用 `react-dom` 中的 `hydrateRoot` 函数完成的，将静态 HTML 转换为完全交互式的 React app。

Hydration带来的一个问题是：导致可交互时间变长

![image-20240702232834269](/Users/tongtong/code/blog/src/pages/til/assets/image-20240702232834269.png)

可以看出，SSR的页面，可以click的时间要比CSR的晚

## SSR示例



## React中的SSR API

### **`renderToString`**

将React组件转换为HTML字符串，适用于小型应用。

### **`renderToPipeableStream`**

React 18引入的新API，支持将React应用流式传输到Node.js流，适合大型应用。



## 使用框架简化SSR

框架如Next.js和Remix提供了SSR的内置支持，简化了异步数据获取、代码分割和生命周期事件管理。



## 总结

6. 

