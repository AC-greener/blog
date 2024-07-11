

## 理解React Element

先来看一个React组件Greeting

```javascript
function Greeting() {
  return (
    <div className="greeting">
      Hello
    </div>
  );
}
```

JSX其实就是createElement的语法糖，使用createElement可以这样描述这个组件：

```javascript
function Greeting() {
  return createElement(
    'div',
    { className: 'greeting' },
    'Hello'
  );
}
```

那么什么是React element呢？

React element是用户界面的一部分的轻量级描述。例如， `<Greeting />` 和 `createElement(Greeting)` 都会生成如下对象：

```javascript
//简化版
const ReactElement = {
  type: 'div',
  props: {
    className: 'greeting',
    children: 'Hello'
  },
  key: null,
  ref: null
};
```



这里重点关注type属性，type可以是其他html标签比如a、p、main

当type属性是一个函数时表示这个是一个函数式组件，而当函数前面加上了async 时，就是一个React Server Component

```
type: async () => 'div',
```



## Server Side Render服务端渲染



```javascript
// server.js
const express = require("express");
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const App = require("./src/App");

const app = express();

app.use(express.static(path.join(__dirname, "build")));

app.get("*", async (req, res) => {
  // This is the secret sauce
  const rscTree = await turnServerComponentsIntoTreeOfElements(<App />);
  // This is the secret sauce

  // Render the awaited server components to a string
  const html = ReactDOMServer.renderToString(rscTree);

  // Send it
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>My React App</title>
      </head>
      <body>
        <div id="root">${html}</div>
        <script src="/static/js/main.js"></script>
      </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
```







## SRC

