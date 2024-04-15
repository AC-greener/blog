---
layout: ../../layouts/Blog.astro
title: "NodeJS Cluster模块基础教程"
date: "20230314"
tags: ["nodejs", "jwt"]
---

# Cluster简介

默认情况下，Node.js不会利用所有的CPU，即使机器有多个CPU。一旦这个进程崩掉，那么整个 web 服务就崩掉了。

应用部署到多核服务器时，为了充分利用多核 `CPU` 资源一般启动多个 NodeJS 进程提供服务，这时就会使用到 NodeJS 内置的 `Cluster` 模块了。Cluster模块可以创建同时运行的子进程（Worker进程），同时共享同一个端口。每个子进程都有自己的`事件循环`、`内存`和`V8实例`。

`NodeJS Cluster`是基于`Master-Worker`模型的，`Master`负责监控`Worker`的状态并分配工作任务，Worker则负责执行具体的任务。Master和Worker之间通过`IPC`（进程间通信）传递消息，**进程之间没有共享内存**。

> 主进程也做叫Master进程，子进程也叫做Worker进程，下面会混用这两种叫法
> 

# HTTP服务器和Cluster

使用NodeJS构建http服务器非常简单，代码如下：

```jsx
//app.js
const http = require("http");
const pid = process.pid;
http
  .createServer((req, res) => {
    for (let i = 1e7; i > 0; i--) {}
    console.log(`Handling request from ${pid}`);
    res.end(`Hello from ${pid}\n`);
  })
  .listen(8081, () => {
    console.log(`Started ${pid}`);
  });
****
```

为了模拟一些实际的CPU工作，我们执行了1000万次空循环，启动服务之后，可以使用浏览
器或`curl`向http://localhost:8080发送请求

`curl localhost:8081`

返回如下：

Hello from 33720

## 使用autocannon压测服务器

安装autocannon：

`npm i -g autocannon`

使用autocannon：

`autocannon -c 200 -d 10 http://localhost:8081`

上面的命令将在10秒内为服务器发起200个并发连接

运行结果如下：

```jsx
┌─────────┬────────┬────────┬─────────┬─────────┬───────────┬───────────┬─────────┐
│ Stat    │ 2.5%   │ 50%    │ 97.5%   │ 99%     │ Avg       │ Stdev     │ Max     │
├─────────┼────────┼────────┼─────────┼─────────┼───────────┼───────────┼─────────┤
│ Latency │ 453 ms │ 651 ms │ 1003 ms │ 1829 ms │ 750.95 ms │ 208.08 ms │ 1968 ms │
└─────────┴────────┴────────┴─────────┴─────────┴───────────┴───────────┴─────────┘

3k requests in 10.02s

```

Latency表示延迟，可以看到平均延迟是`750ms`，最慢的响应延迟接近2S，在10S服务器一共接受了`3000`请求

## 使用Cluster模块进行扩展

```jsx
const cluster = require("node:cluster");
const http = require("node:http");
const numCPUs = require("node:os").cpus().length;
const process = require("node:process");
if (cluster.isMaster) {
  //处理主进程逻辑
  masterProcess();
} else {
  //处理子进程逻辑
  childProcess();
}
function masterProcess() {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
}
function childProcess() {
  http
    .createServer((req, res) => {
      for (let i = 1e7; i > 0; i--) {}
      console.log(`Handling request from ${pid}`);
      res.end(`Hello from ${pid}\n`);
    })
    .listen(8081, () => {
      console.log(`Started ${pid}`);
    });
}
```

将代码保存在 `app.js` 文件中并运行执行：   `$node app.js` 。输出类似于下面这样：

```jsx
Master 33931 is running
Worker Started 33932
Worker Started 33935
Worker Started 33936
Worker Started 33934
Worker Started 33939
Worker Started 33933
Worker Started 33937
Worker Started 33938
```

通过 isMaster 属性，可以判断是否为 Master 进程，Master进程中执行 `cluster.fork()`创建与CPU核心数相同的子进程。

`fork()` 是创建一个新的NodeJS进程，就像通过命令行使用 `$node app.js` 运行一样，会有很多进程运行 `app.js` 程序。

子进程创建和执行时，和master一样，导入cluster模块，执行 `if` 语句。但子进程的 `cluster.isMaster`的值为 `false` 

fork的过程如下：

![Untitled](http://nodejsbyexample.cn/uPic/2024041522262417131911841713191184709Zk0pPZ.png)

## 压测Cluster

`autocannon -c 200 -d 10 [http://localhost:8081](http://localhost:8081/)`

输出结果如下：

```jsx
┌─────────┬────────┬────────┬────────┬────────┬───────────┬──────────┬────────┐
│ Stat    │ 2.5%   │ 50%    │ 97.5%  │ 99%    │ Avg       │ Stdev    │ Max    │
├─────────┼────────┼────────┼────────┼────────┼───────────┼──────────┼────────┤
│ Latency │ 109 ms │ 136 ms │ 260 ms │ 282 ms │ 142.75 ms │ 32.09 ms │ 397 ms │
└─────────┴────────┴────────┴────────┴────────┴───────────┴──────────┴────────┘

14k requests in 10.02s
```

可以看到平均延迟为`142ms`，最大的延迟为397ms，服务器在10S内一共处理了`14000`个请求

使用Cluster之后性能提升大约4倍（ `14000次/10s` 对比 `3000次/10s`）

# 测试Cluster模块的可用性

为了测试服务的可用性，我们会在子进程中使用setTimeout抛出一些错误

对`masterProcess`方法和`childProcess`进行修改：

```jsx
function masterProcess() {
  //...
  //监听子进程的退出事件
  cluster.on("exit", (worker, code) => {
    //子进程异常退出
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log(
        `Worker ${worker.process.pid} crashed. ` + "Starting a new worker"
      );
      cluster.fork();
    }
  });
}
function childProcess() {
  // 随机的1到3秒内等待一段时间，然后抛出一个名为"Ooops"的错误
  setTimeout(() => {
    throw new Error("Ooops");
  }, Math.ceil(Math.random() * 3) * 1000);
  //...
}
```

在这段代码中，一旦主进程接收到“退出”事件。我们检查`code`状态码和
`worker.exitedAfterDisconnect`标记，来判断进程是否为异常退出，然后启动一个新的Worker进程。当终止的Worker进程重新启动时，其他工作进程仍然可以服务请求，从而不会影响应用程序的可用性。

`code`是用于检查进程的退出码，`code`为 0，则表示正常退出，如果不是，则表示进程非正常退出。

`worker.exitedAfterDisconnect`是NodeJS中cluster模块Worker对象的一个属性，用于指示工作进程是否在主进程调用其disconnect()方法后退出。

如果Worker进程成功地完成了disconnect过程并正常退出，则`worker.exitedAfterDisconnect`将被设置为`true`。否则，该属性将保持为`false`，表示该进程已经以其他方式退出。

使用`autocannon`进行压测`autocannon -c 200 -d 10 [http://localhost:8081](http://localhost:8081/)`

结果如下：

```jsx
┌─────────┬────────┬────────┬─────────┬─────────┬───────────┬───────────┬─────────┐
│ Stat    │ 2.5%   │ 50%    │ 97.5%   │ 99%     │ Avg       │ Stdev     │ Max     │
├─────────┼────────┼────────┼─────────┼─────────┼───────────┼───────────┼─────────┤
│ Latency │ 101 ms │ 398 ms │ 1301 ms │ 1498 ms │ 466.99 ms │ 301.07 ms │ 2405 ms │
└─────────┴────────┴────────┴─────────┴─────────┴───────────┴───────────┴─────────┘

14k requests in 10.03s
1k errors (0 timeouts)
```

在`14000`个请求中，有`1000`个出现错误，服务的可用性大约为`92%`，对于一个经常崩溃的应用程序来说，它的可用性也不差

# **主进程和子进程通信**

稍微更新一下之前的代码，就能允许Master进程向Worker进程发送和接收消息，Wordker进程也可以从Master进程接收和发送消息：

```jsx
function childProcess() {
  console.log(`Worker ${process.pid} started`);
  //监听主进程的消息
  process.on("message", function (message) {
    console.log(
      `Worker ${process.pid} recevies message '${JSON.stringify(message)}'`
    );
  });
  console.log(`Worker ${process.pid} sends message to master...`);
  //给主进程发消息
  process.send({ msg: `Message from worker ${process.pid}` });
}
```

在子进程中，使用 `process.on('message', handler)`方法注册一个监听器，当主进程给这个子进程发送消息的时候，会执行`handler`回调，然后使用 `process.send()`向主进程发送消息

```jsx
function masterProcess() {
  console.log(`Master ${process.pid} is running`);
  let workers = [];
  // fork 子进程
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    workers.push(worker);

    // 监听子进程的消息
    worker.on("message", function (message) {
      console.log(
        `Master ${process.pid} recevies message '${JSON.stringify(
          message
        )}' from worker ${worker.process.pid}`
      );
    });
  }

  // 给每个子进程发送消息
  workers.forEach(function (worker) {
    console.log(
      `Master ${process.pid} sends message to worker ${worker.process.pid}...`
    );
    worker.send({ msg: `Message from master ${process.pid}` });
  }, this);

}
```

我们先监听子进程的`message`事件，最后在`Master`进程给每个  `Worker`进程发送消息

输出会类似于下面这样：

```jsx
Master 88498 is running
Master 88498 sends message to worker 88500...
Master 88498 sends message to worker 88501...
Worker 88501 started
Worker 88501 sends message to master...
Master 88498 recevies message '{"msg":"Message from worker 88501"}' from worker 88501
Worker 88501 recevies message '{"msg":"Message from master 88498"}'
Worker 88500 started
Worker 88500 sends message to master...
Master 88498 recevies message '{"msg":"Message from worker 88500"}' from worker 88500
Worker 88500 recevies message '{"msg":"Message from master 88498"}'
```

# 使用Cluster进行优雅的重启

当我们更新代码的时候，可能需要重新启动NodeJS。重新启动应用程序时，会出现一个小的空窗期：在我们重启单进程的NodeJS过程中，服务器会无法处理用户的请求

使用Cluster可以解决这个问题，具体做法如下：一次重新启动一个Worker，剩下的Worker可以继续运行处理用户的请求。

在上面代码的基础上对`masterProcess`和`childProcess`进行修改：

```jsx
function masterProcess() {
  console.log(`Master ${process.pid} is running`);
  let workers = [];
  // fork 子进程
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    workers.push(worker);
  }
  process.on("SIGUSR2", async () => {
    restartWorker(0);
    function restartWorker(i) {
      if (i >= workers.length) return;
      const worker = workers[i];
      console.log(`Stopping worker: ${worker.process.pid}`);

      worker.disconnect(); 
			//监听子进程的退出事件
      worker.on("exit", () => {
				//判断子进程是否完成disconnect过程并正常退出
        if (!worker.exitedAfterDisconnect) return;
        const newWorker = cluster.fork(); //[4]
        newWorker.on("listening", () => {
          //当新的子进程开始监听端口
          //重启下一个子进程
          restartWorker(i + 1);
        });
      });
    }
  });
}
function childProcess() {
  http.createServer((req, res) => {
      console.log("Worker :>> ", `Worker ${process.pid}`);
      res.writeHead(200);
      res.end("hello world\n");
    })
    .listen(8000);
  console.log(`Worker ${process.pid} started`);
}
```

`masterProcess`方法新增了`process.on("SIGUSR2", callback)`, `SIGUSR2`是一种信号，通常用于向一个进程发送自定义的指令，比如要求应用程序执行某些操作（如重启、重新加载配置文件等）。

当主进程接收到`SIGUSR2`信号时，它会遍历所有`Workder`进程并调用`disconnect`方法，然后监听子进程的退出事件。

`Workder`进程退出之后，Master进程就会重新创建新的`Workder`进程，并等待其开始监听端口。然后重启下一个`Workder`进程。

`childProcess` 方法则是启动了一个Http服务器。

通过这种方式，整个应用程序可以在不中断服务的情况下进行平滑重启，从而实现无缝升级和维护。

在生产环境中，我们一般会使用PM2来进行进程管理，，PM2基于cluster，提供负载均衡、过程监控、零停机重启和其他功能。

# 总结

本文介绍了使用NodeJS Cluster模块进行多进程处理的方法，包括如何创建子进程、压测Cluster、主进程和子进程通信、以及如何使用Cluster进行优雅的重启。

在生产环境中，我们一般会使用`PM2`来进行进程管理，PM2基于cluster，提供负载均衡、过程监控、零停机重启和其他功能。下篇文章会介绍一下PM2，敬请期待吧！