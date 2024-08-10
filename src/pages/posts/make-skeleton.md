---
layout: ../../layouts/Blog.astro
title: "实现一个简单的骨架屏"
date: "20240606"
tags: ["css"]
---



完整示例代码在：[codepen](https://codepen.io/ac-greener/pen/YzoQpbm)

先来写一个骨架屏基本的DOM结构：

```jsx
<!DOCTYPE html>
<html lang="zh">
<body>
    <div class="skeleton-card">
        <div class="skeleton-header">
            <div class="skeleton skeleton-avatar"></div>
            <div class="skeleton skeleton-title"></div>
        </div>
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
    </div>
</body>
</html>
```

加一些样式：

```jsx
        body {
           padding: 30px;
	         background:#e2e9e6c2;
        }

        .skeleton-card {
            width: 300px;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .skeleton {
            background-color: #e2e5e7;
            border-radius: 4px;
            margin-bottom: 12px;
            position: relative;
            overflow: hidden;
        }

        .skeleton-header {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
        }

        .skeleton-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 12px;
        }

        .skeleton-title {
            flex-grow: 1;
            height: 20px;
        }

        .skeleton-text {
            height: 14px;
        }

        .skeleton-text.short {
            width: 60%;
        }

        .skeleton-image {
            width: 100%;
            height: 150px;
            margin-bottom: 16px;
        }
```

现的的效果如下：

![Untitled](http://static.zhutongtong.cn/uPic/20240810htWhqv.png)

骨架屏一般会有一个加载的效果，可以使用[线性渐变](https://developer.mozilla.org/zh-CN/docs/Web/CSS/gradient/linear-gradient)来实现，

给`skeleton`添加伪元素：

```jsx
.skeleton::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, red, transparent);
}
```

使用`linear-gradient`  实现一个从左到右的线性渐变，效果是透明-红色-透明

为了突出这个渐变，先加了一个红色，后面会换成正常的渐变颜色，效果如下：

![Untitled](http://static.zhutongtong.cn/uPic/20240810TYhXjP.png)

然后我们添加动画让这个渐变元素动起来：

```jsx
 @keyframes skeleton-loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
```

动画的开始帧为`translateX(-100%)` ，向左移动-100%，结束帧为`translateX(100%)`，向右移动100%，效果如下：

![skeleton2.gif](http://static.zhutongtong.cn/uPic/20240810DzLG9R.gif)

最后我们修改渐变颜色：

```
background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
```

最终效果如下

![skeleton3.gif](http://static.zhutongtong.cn/uPic/20240810Bd2hbj.gif)