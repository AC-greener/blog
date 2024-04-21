---
layout: ../../layouts/Blog.astro
title: "在nodejs中使用express和express-session管理会话"
date: "20230825"
tags: ["expressss", "nodejs"]
---


## 什么是session

web是基于 HTTP 协议的， 而HTTP 是一种无状态协议，也就是说在每个请求和响应结束时，客户端和服务器不知道对方是谁。

这就是session的用处，session也叫做会话。允许服务器在多个请求之间维护用户的数据和状态，从而实现用户身份验证、保持登录状态、存储用户信息等功能。

## session的工作机制

1. 客户端（浏览器）发送首次请求到服务器。
2. 服务器收到请求，发现客户端没有提供会话ID（缺少一个值为 **`session-id`** 的cookie）。
3. 服务器创建一个新的会话，生成一个唯一的会话ID，并将其存储在 **`session-id`** cookie 中，并将会话数据保存在后端存储中（例如内存、数据库等）。
4. 服务器将会话ID作为响应的 **`Set-Cookie`** 头部发送回客户端，客户端浏览器会存储这个会话ID。
5. 从此以后，客户端的每个请求都会附带这个会话ID的 **`session-id`** cookie。
6. 服务器根据收到的会话ID，从后端存储中查找相应的会话数据，以恢复用户的会话状态。

## session和cookie的区别

cookie 是存储在浏览器中的键值对。浏览器会吧对应域名下面的 cookie 附加到发送到服务器的每个 HTTP 请求。

在 cookie 中，无法存储大量数据，cookie的大小通常受到浏览器对单个cookie大小和每个域名的cookie总数的限制，一般较小。最好不要吧敏感的数据比如用户信息存在cookie中。

session数据存储在服务器端，一般会放在数据库里面。因此，它可以容纳更大量的数据。session是通过在客户端cookie中存储会话ID，服务器使用这个ID查找对应的会话数据来实现。

## 开发环境设置

初始化package.json

`$ npm init –y`

安装express-session

在nodejs中管理session（会话），需要使用**express-session**这个中间件，可以使用下面的命令安装这个模块：

`$ npm i express-session`

安装express

要在 Node.js 中使用 express-session 模块设置会话，还需要安装 Express 模块：

`$ npm i express`

## 使用**express-session**

```jsx
//app.js
const express = require('express')
const session = require('express-session')
const app = express()
     
app.use(session({
	secret: 'Your_Secret_Key',
	resave: false,
}))
app.get('/',(req,res) => {
    res.send("hello");
});
app.listen(3000, () => {
	console.log('Server is running at port 3000')
})
```

使用`app.use(session(options))`就可以使用这个中间件，其中：

**`secret`** 是一个密钥，用来签名**`session-id`**

**`resave`** bool类型，默认为true，用于指定是否在每次请求时重新保存会话，即使会话在请求过程中从未被修改过。比如客户端向服务器发出两个并行请求，当第二请求结束时，对第一请求的会话所做的修改可能会被覆盖。

执行`$node app.js`之后，我们使用curl命令来测试这个程序

`$ curl -i localhost:3000`

![Untitled](http://static.zhutongtong.cn/uPic/xCfZXkUntitled.png)

## 设置cookie的属性

上面例子可以看到session中间件帮我们设置了一个cookie，cookie的默认key为：connect.sid，

可以使用name字段设置cookie的key

```jsx
app.use(session({
	secret: 'Your_Secret_Key',
	resave: false,
	name: 'mycookie'
}))
```

![Untitled](http://static.zhutongtong.cn/uPic/qPLqtCUntitled%201.png)

还可以配置cookie的其他属性，如maxAge，secure等

```jsx
//过期时间为一天
const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
	secret: 'Your_Secret_Key',
	resave: false,
	cookie: { maxAge: oneDay, HttpOnly: true, secure: false},
	name: 'mycookie'
}))
```

![Untitled](http://static.zhutongtong.cn/uPic/hbfdUAUntitled%202.png)

## 使用session记录页面访问次数

上面的例子没有什么用处，这里我们来实现一个记录用户访问页面次数的例子：

```jsx
app.get('/', function (req, res, next) {
	if (req.session.views) {
		req.session.views++
		res.send('views: ' + req.session.views)
	} else {
		req.session.views = 1
		res.end('welcome to the session demo. please curl again!')
	}
})
```

当客户端第一次请求时，我们会给req.session写入一个views属性，当客户端再次发起请求时，会吧views加1，然后返回给客户端

使用curl请求：

 `$ curl -i localhost:3000`

![Untitled](http://static.zhutongtong.cn/uPic/GfzN26Untitled%203.png)

可以看到，响应的是'welcome to the session demo. please curl again!'

使用curl携带上一次的cookie再次请求：

`$ curl -i -b "mycookie=s%3A_lsIhF-wH-IwuiUBeKcpqq_KIv1JVfFW.PVY28Bj0DhABROPOZM9h%2BY4gcbb7MVEyYqMu8lH73LI" localhost:3000`

![Untitled](http://static.zhutongtong.cn/uPic/pwcMbTUntitled%204.png)

再次请求之后会响应用户访问的次数

## 使用session实现登陆退出功能

### 实现登录页面

登录页面是这样的：

![Untitled](http://static.zhutongtong.cn/uPic/JVmXrYUntitled%205.png)

login.html代码如下：

```jsx
<!DOCTYPE html>
<html>
<head>
    <title>Login</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f2f2f2;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .login-container {
            background-color: #fff;
            border-radius: 5px;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            width: 300px;
        }

        .login-container h1 {
            text-align: center;
            margin-bottom: 20px;
        }

        .login-form label {
            display: block;
            margin-bottom: 10px;
        }

        .login-form input[type="text"],
        .login-form input[type="password"] {
            width: 100%;
            border: 1px solid #ccc;
            border-radius: 3px;
        }

        .login-form input[type="submit"] {
            background-color: #007bff;
            color: #fff;
            border: none;
            padding: 10px;
            border-radius: 3px;
            width: 100%;
            cursor: pointer;
        }

        .login-form input[type="submit"]:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>Login Form</h1>
        <form class="login-form" method="POST" action="/login">
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required><br><br>
            
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required><br><br>
            
            <input type="submit" value="Login">
        </form>
    </div>
</body>
</html>
```

这个HTML登录表单，会使用POST方法将用户名和密码提交到服务器上的/login路由

### 处理根路由请求

```jsx

app.get('/', function (req, res, next) {
    if (req.session.userid) {
        res.send("欢迎 <a href=\'/logout'>点击退出</a>");
    } else {
        res.sendFile('./login.html', { root: __dirname })
    }
})
```

跟路由请求会判断session里面是否有userid，如果有，则显示退出，否则显示登录页面

### 处理/login登录请求

```jsx

//使用urlencoded中间件解析post请求
app.use(express.urlencoded());

const myusername = 'admin';
const mypassword = 'admin';
app.post('/login', (req, res) => {
    if (req.body.username === myusername && req.body.password === mypassword) {
        **req.session.userid = req.body.username;**
        console.log(req.session)
        res.send(`登录成功 <a href=\'/logout'>点击退出</a>`);
    } else {
        res.send('不合理的 username 或 password');
    }
})
```

这里我们用到了express.urlencoded中间件，这个中间件可以帮我们解析POST请求，并吧请求体的字段放在req.body里面

然后我们处理login请求，为了演示我们吧用户名和密码写死，用户名密码匹配之后，我们会吧username写入session

运行一下程序：

`node app.js`

然后访问：[http://localhost:3000/](http://localhost:3000/)

输入用户名和密码登录之后可以看到登录成功，并且有了cookie，再次刷新页面，还会显示登录成功的页面，因为用户的信息已经被放在session里面

![Untitled](http://static.zhutongtong.cn/uPic/OpvyGnUntitled%206.png)

然后会到命令行可以看到打印的session如下：

![Untitled](http://static.zhutongtong.cn/uPic/N1KOsqUntitled%207.png)

### 实现/logout退出接口

```jsx
app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});
```

我们直接调用session的destroy方法就可以实现退出

res.redirect是重定向功能，通过它会向用户返回一个 302 状态，通知
浏览器转向相应页面。

点击退出登录，我们就会回到首页，并且显示了登录页面

### 问题

可以看出登入和登出仅仅是 req.session.userid 变量的标记，非常简单。但这会不会有安全性问题呢？是不会的，因为这个变量只有服务端才能访问到，只要不是黑客攻破了整个服务器，无法从外部改动

完整代码地址：

[https://github.com/AC-greener/nodejs-session](https://github.com/AC-greener/nodejs-session)

## 总结

这篇文章我们学会了使用session来管理会话，但是还有一些不足，我们的session是存在服务器内存的，当重启服务器时，session就没了，或着当有多台服务器时，会话状态也会出现不同步，所以一般会使用MongoDB或者Redis来存储会话，下一篇文章我们会使用到MongoDB～