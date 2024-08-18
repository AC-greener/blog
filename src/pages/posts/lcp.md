---
layout: ../../layouts/Blog.astro
title: "深入理解LCP：提升网站性能的关键指标"
date: "20240818"
tags: ["javascript"]
---

本文示例代码在：[https://codepen.io/](https://codepen.io/sigajbtx-the-encoder/pen/vYqdLpB?editors=1001)

# **什么是 LCP**

LCP是"`Largest Contentful Paint`"的缩写，指的是在视口中**可见的最大图像或文本块**完成渲染的时间，它是衡量用户感知加载速度的一个重要指标。

比如在下面这个示例中，LCP就是拜登这张图片渲染完成的时候

![Untitled](http://static.zhutongtong.cn/uPic/20240818Stt5DJ.png)

常见的LCP的元素有：

- `<img>` 元素
- `<svg>` 元素内的 `<image>` 元素
- `<video>` 元素的封面
- 包含文本节点的块级元素。

# **LCP 几秒算合格？**

理想的LCP时间是在2.5S之内，2.5S-4S意味着需要提高，大于4S是比较差的

![Untitled](http://static.zhutongtong.cn/uPic/20240818CneFdI.png)

这个2.5S不是说访问你网站所有的用户需要达到，只需要75%的用户达到这个值就行，如下图：

![Untitled](http://static.zhutongtong.cn/uPic/20240818Ph2T0r.png)

# **在 JavaScript 中测量 LCP**

测量 LCP，可以使用 [Largest Contentful Paint API](https://wicg.github.io/largest-contentful-paint/)。

```jsx
   // 创建 PerformanceObserver 实例。
    const observer = new PerformanceObserver((list) => {
      // 获取所有被观察到的LCP候选元素
      const entries = list.getEntries();
      // LCP（Largest Contentful Paint）是一个随时间变化的指标。页面加载过程中，可能会有多个元素依次成为"最大内容元素"。最后一个通常代表了真正的 LCP 元素。
      const lastEntry = entries[entries.length - 1];
      // 打印LCP元素的信息
      console.log("startTime", lastEntry.startTime);
      console.log("element", lastEntry.element.tagName);
      console.log("size", lastEntry.size);
      console.log("lastEntry", lastEntry);
    });
    // 观察 "largest-contentful-paint" 类型的性能元素。
    observer.observe({
      type: "largest-contentful-paint",
      buffered: true
    });
```

![image.png](http://static.zhutongtong.cn/uPic/20240818rZOvDm.png)

# **如何改进 LCP？**

LCP的延迟由四部分组成，LCP真正渲染完毕是在第4个阶段结束，如下图：

![image.png](http://static.zhutongtong.cn/uPic/20240818A4Wpho.png)

分别是：

1. [首字节时间 (TTFB)](https://developer.mozilla.org/zh-CN/docs/Glossary/Time_to_first_byte)
从用户开始加载网页到浏览器加载网页之间的时间 接收 HTML 文档响应的第一个字节。
2. 资源加载延迟
从 TTFB 到浏览器开始加载 LCP 资源所用的时间。如果 LCP 元素不需要加载资源即可渲染（例如，如果 元素是以系统字体渲染的文本节点），此时为 0。
3. 资源加载时长
加载 LCP 资源本身所用的时长。如果 LCP 元素不需要加载资源即可渲染，此时为 0。
4. 元素渲染延迟
从资源加载完成到LCP元素实际渲染到屏幕上的时间。

下面我们来看看这四个步骤具体的优化思路：

### 优化TTFB

TTFB这个步骤前端一般控制不了，因为在后端传送第一个字节的内容之前，前端不会执行任何操作。

1. 使用内容分发网络（CDN），将静态资源部署到 CDN 上，减少主服务器的负载
2. DNS 优化，使用 DNS 预取（DNS prefetching）`<link rel="dns-prefetch" href="https://fonts.googleapis.com/" />`
3. 减少重定向，避免不必要的 URL 重定向，每次重定向都会增加 TTFB
4. 将html文档`流式传输`到浏览器，比如使用Nextjs等框架来进行流式渲染，虽然SSR本身是会增加TTFB的

### 优化资源加载延迟

这一步是确保 LCP 资源`尽早开始加载`

1. 延迟加载非关键 JavaScript：使用 `defer` 或 `async` 属性
2. 提高LCP元素的优先级，`<img fetchpriority="high" src="/example.png">`,比如LCP元素是首页的一个轮播图，也可以降低轮播图中除了第一张图片以外的元素优先级

```javascript
 <div v-for="(image, index) in images" :key="index" class="carousel-item">
      <img
        :src="image.src"
        :alt="image.alt"
        :fetchpriority="index === 0 ? 'high' : 'low'"
        :loading="index === 0 ? 'eager' : 'lazy'"
      />
    </div>
```

1. 如果图片的地址是写死的，可以直接进行预加载：
`<link rel="preload" fetchpriority="high" href="https://example.com/example.png" as="image">`

### 缩短资源加载时长

这一步的目标是`减少资源传输到用户设备所用的时间`，主要的思路有：

1. 使用CDN减少资源的地理延迟
2. 使用现代的图片格式，比如使用webp代替png，相同图片情况下webp格式图片体积更小
3. 使用tinypng等工具压缩图片
4. 为图片资源添加缓存，下次请求这些资源时将从缓存中提供这些资源，来降低*资源加载时长*

### 优化资源渲染延迟

LCP 元素在其资源完成加载后*无法*立即渲染的主要原因是`被其他资源的加载阻塞了`

1. 优化 JavaScript 执行，只加载当前页面需要的 JavaScript，使用Tree Shaking移除未使用的代码
2. 减少css体积以及移除未使用的css
3. 使用SSR，SSR的优势在于不需要额外 JavaScript 请求就可以得到html页面以及内容，但是缺点是需要额外的服务器处理时间，这可能会降低 TTFB

参考文章

[https://developer.mozilla.org/en-US/docs/Web/API/LargestContentfulPaint](https://developer.mozilla.org/en-US/docs/Web/API/LargestContentfulPaint)

[https://web.dev/articles/lcp](https://web.dev/articles/lcp?hl=zh-cn)

[https://web.dev/articles/optimize-lcp](https://web.dev/articles/optimize-lcp?hl=zh-cn)