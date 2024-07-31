---
layout: ../../layouts/Blog.astro
title: "30行代码从零实现useState和useEffect"
date: "20240728"
tags: ["react"]

---

本文完整示例代码在：[codesandbox.io](https://codesandbox.io/p/devbox/react-hooks-imp-tsp6sv?file=%2Fsrc%2Findex.html%3A3%2C9&layout=%257B%2522sidebarPanel%2522%253A%2522EXPLORER%2522%252C%2522rootPanelGroup%2522%253A%257B%2522direction%2522%253A%2522horizontal%2522%252C%2522contentType%2522%253A%2522UNKNOWN%2522%252C%2522type%2522%253A%2522PANEL_GROUP%2522%252C%2522id%2522%253A%2522ROOT_LAYOUT%2522%252C%2522panels%2522%253A%255B%257B%2522type%2522%253A%2522PANEL_GROUP%2522%252C%2522contentType%2522%253A%2522UNKNOWN%2522%252C%2522direction%2522%253A%2522vertical%2522%252C%2522id%2522%253A%2522clz71827s00093b6mq2m9ytzj%2522%252C%2522sizes%2522%253A%255B100%252C0%255D%252C%2522panels%2522%253A%255B%257B%2522type%2522%253A%2522PANEL_GROUP%2522%252C%2522contentType%2522%253A%2522EDITOR%2522%252C%2522direction%2522%253A%2522horizontal%2522%252C%2522id%2522%253A%2522EDITOR%2522%252C%2522panels%2522%253A%255B%257B%2522type%2522%253A%2522PANEL%2522%252C%2522contentType%2522%253A%2522EDITOR%2522%252C%2522id%2522%253A%2522clz71827s00023b6mjrba42ll%2522%257D%255D%257D%252C%257B%2522type%2522%253A%2522PANEL_GROUP%2522%252C%2522contentType%2522%253A%2522SHELLS%2522%252C%2522direction%2522%253A%2522horizontal%2522%252C%2522id%2522%253A%2522SHELLS%2522%252C%2522panels%2522%253A%255B%257B%2522type%2522%253A%2522PANEL%2522%252C%2522contentType%2522%253A%2522SHELLS%2522%252C%2522id%2522%253A%2522clz71827s00063b6msr6ukl9g%2522%257D%255D%252C%2522sizes%2522%253A%255B100%255D%257D%255D%257D%252C%257B%2522type%2522%253A%2522PANEL_GROUP%2522%252C%2522contentType%2522%253A%2522DEVTOOLS%2522%252C%2522direction%2522%253A%2522vertical%2522%252C%2522id%2522%253A%2522DEVTOOLS%2522%252C%2522panels%2522%253A%255B%257B%2522type%2522%253A%2522PANEL%2522%252C%2522contentType%2522%253A%2522DEVTOOLS%2522%252C%2522id%2522%253A%2522clz71827s00083b6m8jyjueqv%2522%257D%255D%252C%2522sizes%2522%253A%255B100%255D%257D%255D%252C%2522sizes%2522%253A%255B50.70074271428311%252C49.29925728571689%255D%257D%252C%2522tabbedPanels%2522%253A%257B%2522clz71827s00023b6mjrba42ll%2522%253A%257B%2522tabs%2522%253A%255B%257B%2522id%2522%253A%2522clz71827s00013b6minprba91%2522%252C%2522mode%2522%253A%2522permanent%2522%252C%2522type%2522%253A%2522FILE%2522%252C%2522filepath%2522%253A%2522%252Fsrc%252Findex.html%2522%252C%2522state%2522%253A%2522IDLE%2522%252C%2522initialSelections%2522%253A%255B%257B%2522startLineNumber%2522%253A3%252C%2522startColumn%2522%253A9%252C%2522endLineNumber%2522%253A3%252C%2522endColumn%2522%253A9%257D%255D%257D%252C%257B%2522id%2522%253A%2522clz8iv1tk00023b6lwj0c9vua%2522%252C%2522mode%2522%253A%2522permanent%2522%252C%2522type%2522%253A%2522FILE%2522%252C%2522initialSelections%2522%253A%255B%257B%2522startLineNumber%2522%253A24%252C%2522startColumn%2522%253A27%252C%2522endLineNumber%2522%253A24%252C%2522endColumn%2522%253A27%257D%255D%252C%2522filepath%2522%253A%2522%252Fsrc%252Findex.mjs%2522%252C%2522state%2522%253A%2522IDLE%2522%257D%252C%257B%2522id%2522%253A%2522clz8kcb9e00023b6lhnadspyu%2522%252C%2522mode%2522%253A%2522permanent%2522%252C%2522type%2522%253A%2522FILE%2522%252C%2522initialSelections%2522%253A%255B%257B%2522startLineNumber%2522%253A45%252C%2522startColumn%2522%253A26%252C%2522endLineNumber%2522%253A45%252C%2522endColumn%2522%253A26%257D%255D%252C%2522filepath%2522%253A%2522%252Fsrc%252Fstep4.js%2522%252C%2522state%2522%253A%2522IDLE%2522%257D%255D%252C%2522id%2522%253A%2522clz71827s00023b6mjrba42ll%2522%252C%2522activeTabId%2522%253A%2522clz71827s00013b6minprba91%2522%257D%252C%2522clz71827s00083b6m8jyjueqv%2522%253A%257B%2522tabs%2522%253A%255B%257B%2522id%2522%253A%2522clz71827s00073b6mkuif34g9%2522%252C%2522mode%2522%253A%2522permanent%2522%252C%2522type%2522%253A%2522TASK_PORT%2522%252C%2522taskId%2522%253A%2522start%2522%252C%2522port%2522%253A1234%252C%2522path%2522%253A%2522%252F%2522%257D%255D%252C%2522id%2522%253A%2522clz71827s00083b6m8jyjueqv%2522%252C%2522activeTabId%2522%253A%2522clz71827s00073b6mkuif34g9%2522%257D%252C%2522clz71827s00063b6msr6ukl9g%2522%253A%257B%2522tabs%2522%253A%255B%257B%2522id%2522%253A%2522clz71827s00033b6m263qt2ho%2522%252C%2522mode%2522%253A%2522permanent%2522%252C%2522type%2522%253A%2522TASK_LOG%2522%252C%2522taskId%2522%253A%2522start%2522%257D%252C%257B%2522id%2522%253A%2522clz71827s00043b6m1xvt67yg%2522%252C%2522mode%2522%253A%2522permanent%2522%252C%2522type%2522%253A%2522TERMINAL%2522%252C%2522shellId%2522%253A%2522clz6xan2200k4diecdxa8bfxl%2522%257D%252C%257B%2522id%2522%253A%2522clz71827s00053b6m1iq7i0r8%2522%252C%2522mode%2522%253A%2522permanent%2522%252C%2522type%2522%253A%2522TERMINAL%2522%252C%2522shellId%2522%253A%2522clz6xtfv700lediec6az131eg%2522%257D%255D%252C%2522id%2522%253A%2522clz71827s00063b6msr6ukl9g%2522%252C%2522activeTabId%2522%253A%2522clz71827s00033b6m263qt2ho%2522%257D%257D%252C%2522showDevtools%2522%253Atrue%252C%2522showShells%2522%253Afalse%252C%2522showSidebar%2522%253Atrue%252C%2522sidebarPanelSize%2522%253A15%257D)

# 实现一个最基础的useState

让我们从最简单的useState实现开始:

```jsx
function useState(initVal) {
  let _val = initVal
  let state = () => _val;
  const setState = (data) => {
    _val = data;
  };
  return [state, setState];
}
const [a, setA] = useState(0);
console.log(a()); // 0
setA(1);
console.log(a()); // 1
```

上线代码虽然可以实现state的初始化和更新，但是不足是：我们使用的是一个函数来获取state的，而React里面使用的是变量获取的。

我们来一步步优化代码。

# **重构：模拟 React 的工作方式**

useState使用React模块导出的，我们也来实现一下：

```jsx
const React = (function () {
    let _val;
    function useState(initVal) {
    // 注意：state的值优先从_val读取
      let state = _val || initVal;
      const setState = (data) => {
        _val = data;
      };
      return [state, setState];
    }
    return {
      useState,
    };
  })();
```

### 使用useState

React是在组件内使用useState，组件如下：

```jsx
function Component() {
  const [count, setCount] = React.useState(0);

  return {
    render: () => console.log(count),
    updateCount: () => setCount(count + 1),
  };
}
```

Component的render方法就是打印当前a变量，而click则会重新设置a

### 添加render方法

我们需要在React模块内增加一个render方法来渲染上面的Component：

```jsx
const React = (function () {
  // ...
  function render() {
    let c = Component();
    c.render();
    return c;
  }
  return {
    useState,
    render,
  };
})();

function Component() {
  // ...
}
```

接下来执行上面的代码，可以看到每一次点击，我们都会重新渲染组件，得到正确的state值

```jsx
// 渲染组件
var app = React.render(Component); // 0
app.updateCount();
var app = React.render(Component); // 1
app.updateCount();
var app = React.render(Component); // 2
```

![Untitled](https://static.zhutongtong.cn/uPic/2024073111300617223966061722396606366Untitled.png)

不过现在上面这个实现不支持多个state，我们继续完善

# 支持多个state

为了支持多个 state，我们需要对实现进行进一步改进。

完整实现如下：

```jsx
const React = (function () {
  let hooks = [];
  let index = 0;
  function useState(initVal) {
    let state = hooks[index] || initVal;
    // 使用_index保存index， 否则setState调用的时候里面的index有bug
    let _index = index;
    const setState = (data) => {
      hooks[_index] = data;
    };
    index++;
    return [state, setState];
  }
  function render() {
    // 每次重新渲染必须要hooks index
    index = 0;
    let c = Component();
    c.render();
    return c;
  }
  return {
    useState,
    render,
  };
})();
function Component() {
  const [count, setCount] = React.useState(0);
  const [fruit, setFruit] = React.useState("apple");
  return {
    render: () => console.log(count, fruit),
    updateCount: () => setCount(count + 1),
    updateFruit: (fruit) => setFruit(fruit),
  };
}

var app = React.render(Component);
app.updateCount();
var app = React.render(Component);
app.updateFruit("banana");
var app = React.render(Component);

```

![Untitled](https://static.zhutongtong.cn/uPic/2024073111302017223966201722396620426Untitled%201.png)

这里有一些关键点需要注意：

- useState里面的index不能直接使用index，因为当你调用setState时index已经变化了，下面是错误的示范

```jsx
function useState(initVal) {
  let state = hooks[index] || initVal;
  const setState = (data) => {
    hooks[index] = data;
  };
  index++;
  return [state, setState];
}
```

- 每次调用React.render的时候，需要重置index，重新渲染的时候才能获取到最新的state

```jsx
  function render() {
    // 每次重新渲染必须要hooks index
    index = 0;
    ...
  }
```

# hooks可以用在条件语句吗？

面试的时候我们经常会遇到这个问题，结合我们上面的实现可以看出，Hooks 不能在条件语句中使用。这是因为：

1. Hooks 的工作原理依赖于它们被调用的顺序。
2. 在我们的实现中，我们使用了一个全局的 `index` 来跟踪当前正在处理的 Hook。每次调用 Hook 时，`index` 都会递增。
3. 如果我们在条件语句中使用 Hook，那么在某些渲染中，这个 Hook 可能不会被调用，这会导致 `index` 的不一致。
4. 不一致的 `index` 会导致 Hooks 的状态混乱，可能会把一个 Hook 的状态赋给另一个 Hook。

举个例子：

```jsx
function Component() {
  const [count, setCount] = React.useState(0);

  if (count > 5) {
    const [name, setName] = React.useState("John");
  }
}
```

在这个例子中，当 `count <= 5` 时，`name` 这个 state 不会被创建。但是当 `count > 5` 时，突然多了一个 state。这会导致后面的 Hooks 的 `index` 发生错位，从而引起错误。

# 实现useEffect

让我们来实现 `useEffect` Hook。`useEffect` 用于处理副作用，它接受两个参数：一个回调函数和一个依赖数组。

`useEffect`实现的核心思路是：我们需要吧effect的依赖存在hooks数组，里面然后去对比新旧依赖

1. `useEffect` 函数首先检查是否存在旧的依赖数组。
2. 如果存在旧的依赖数组，它会比较新旧依赖是否有变化。我们使用数组 `some` 方法进行比较
3. 如果依赖发生了变化（或者是第一次运行），就执行回调函数。
4. 最后，保存新的依赖数组，并增加 index。

代码如下：

```jsx
const React = (function () {
  let hooks = [];
  let index = 0;
  function useState(initVal) {
    // ... 之前的 useState 实现 ...
  }
  function render() {
    // ... 之前的 render 实现 ...
  }
  function useEffect(cb, depArray) {
    const oldDeps = hooks[index];
    let hasChanged = true;
    if (oldDeps) {
      if (!depArray.some((dep, i) => dep !== oldDeps[i])) {
        hasChanged = false;
      }
    }
    if (hasChanged) {
      cb();
    }
    hooks[index] = depArray;
    index++;
  }
  return {
    useState,
    render,
    useEffect,
  };
})();

function Component() {
  const [a, setA] = React.useState(0);
  const [fruit, setFruit] = React.useState("apple");
  React.useEffect(() => {
    console.log("hello");
  }, [a]);
  return {
    render: () => console.log(a, fruit),
    updateCount: () => setA(a + 1),
    updateFruit: (fruit) => setFruit(fruit),
  };
}

var app = React.render(Component);
app.updateCount();
var app = React.render(Component);
app.updateFruit("banana");
var app = React.render(Component);

```

控制台的输出顺序如下：第一行先执行了副作用也就是console，当我们`updateCount`之后，又会执行一次副作用的console

![Untitled](https://static.zhutongtong.cn/uPic/2024073111302517223966251722396625968Untitled%202.png)

在effect的依赖树组里面再加一个`fruit`变量，也可以正常运行

![Untitled](https://static.zhutongtong.cn/uPic/2024073111303517223966351722396635735Untitled%203.png)

完。