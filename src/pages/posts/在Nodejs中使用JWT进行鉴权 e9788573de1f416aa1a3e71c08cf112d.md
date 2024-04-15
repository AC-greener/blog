---
layout: ../../layouts/Blog.astro
title: "在Nodejs中使用JWT进行鉴权"
date: "20230808"
tags: ["nodejs", "jwt"]
---

## 什么是 JSON Web Token（JWT）？

JSON Web Token（JWT）是一种用于在web上传递信息的标准，它以JSON格式表示信息，通常用于身份验证和授权。

JWT由三个部分组成：Header（头部）、Payload（负载）和Signature（签名）。它们用点号分隔开，形成了一个JWT令牌。

## **JWT 的基本结构**

- Header

Header（头部）是JWT结构的第一部分，它是一个包含关于令牌的元数据的JSON对象。Header通常包含两个主要字段：**`alg`** 和 **`typ`**。

**`alg`（Algorithm）字段**：这个字段指定了用于签名JWT的加密算法。它可以是以下之一：

- **`HS256`**：HMAC-SHA256，使用密钥进行对称加密。
- **`RS256`**：RSA-SHA256，使用RSA密钥对进行非对称加密。
- **`ES256`**：ECDSA-SHA256，使用椭圆曲线数字签名算法进行非对称加密，等等。

**`typ`（Type）字段**：这个字段表示令牌的类型。对于JWT，这个字段的值通常是**`JWT`**，用于指示这是一个JSON Web Token。

一个简单的 JWT 头可以是下面这样：

```
{
    "typ":"JWT",
    "alg":"HS256"
 }
```

- Payload

Payload（负载）用于存储实际的用户数据和其他相关信息。Payload是一个包含键值对的JSON对象，它包含了有关JWT令牌的有用信息。

JWT 规定了7个官方字段：

```jsx
- iss (issuer)：签发人
- exp (expiration time)：过期时间
- sub (subject)：主题
- aud (audience)：受众
- nbf (Not Before)：生效时间
- iat (Issued At)：签发时间
- jti (JWT ID)：编号
```

除了官方字段，你还可以在这个部分定义私有字段，一个Payload如下所示：

```
 {
  "userId":"123",
  "iss": "your_app",
  "sub": "user123",
  "role": "admin",
  "exp": 1699999999
 }
```

- Signature

JWT的Signature（签名）是JWT令牌的第三个部分，用于确保令牌的完整性和来源验证。Signature是通过将Header和Payload的组合（不包括分隔符**`.`**）与一个密钥进行加密或哈希生成的值。

Signature生成方式：

`HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)`

## 一个JWT示例

```
Header:
{
  "alg" : "HS256",

  "typ" : "JWT"
}

Payload:
{
  "id" : 123,

  "name" : "test"
}

Secret: your_secret
```

Header（经过Base64编码）：

```
eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9
```

Payload（经过Base64编码）：

```
eyJpZCI6IDEyMywgIm5hbWUiOiAidGVzdCJ9
```

使用提供的Secret对原始的Header和原始的Payload进行加密生成Signature：

```scss
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  "your_secret"
)
```

完整的的token需要吧这三部分拼起来如下：

```jsx
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJuYW1lIjoidGVzdCJ9.oMyOEgY
iZosc0HYCkIjrqh_DH3CLlmIkIjOe-icpTg8
```

## 在Nodejs中使用JWT

### 1，环境配置

我们先来配置一下环境，首先初始化一个package.json文件存放我们用到的npm包：

`npm init -y`

然后安装jsonwebtoken和express：
`npm install express jsonwebtoken`

### 2，创建一个基础的服务器

```jsx
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT} ...`);
});
```

这里我们使用了`**express.json**`这个中间件，**`express.json()`** 是一个 Express 中间件函数，用于解析传入请求体中的 JSON 数据。当客户端向服务器发送带有 JSON 数据的 POST 请求时，**`express.json()`** 中间件将从请求体中解析出 JSON 数据，并将其添加到到 **`req.body`** 上。

### 3，在登录之后下发token

```jsx
// 用户数据
const users = [
    { id: 1, username: "user1", password: "password1" },
    { id: 2, username: "user2", password: "password2" }
];
const jwtSecretKey = "your_jwt_secret_key";

// 登录之后生成 JWT token
app.post("/user/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            return res.status(401).json({ error: "用户名或密码错误" });
        }

        const payload = {
            userId: user.id,
        };
        //生成token 设置过期时间为 1 小时
        const token = await jwt.sign(payload, jwtSecretKey, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: "登录失败" });
    }
});
```

为了演示，我们的用户数据是写死的

/user/login路由会在用户名和密码通过校验之后，使用jwt.sign生成一个token，并且设置过期时间为一个小时

**`jwt.sign`** 函数用于创建一个 JWT 令牌，它接受一个payload，并使用给定的密钥将其签名生成一个令牌字符串。

以下是 **`jwt.sign`** 的基本用法以及其参数：

```jsx
jwt.sign(payload, secretOrPrivateKey, [options, callback])
```

- **`payload`**：要存储在token中的数据，通常是一个 JavaScript 对象，可以包含任意信息。
- **`secretOrPrivateKey`**：用于对令牌进行签名的密钥。
- **`options`**（可选）：一个包含选项的对象，用于配置生成的 JWT。常见的选项包括 **`expiresIn`**（过期时间）和 **`algorithm`**（签名算法）等。
- **`callback`**（可选）：一个回调函数，用于异步生成 JWT。

然后使用curl请求该路由，响应内容如下：

![Untitled](http://nodejsbyexample.cn/uPic/2024041522241317131910531713191053749unnvGS.png)

### 4，创建isLogin中间件

```jsx
async function isLogin(req, res, next) {
    const tokenHeaderKey = 'Authorization';
    const token = req.header(tokenHeaderKey)

    if (!token) {
        return res.status(401).json({ error: "用户未登录" });
    }

    const verified = await jwt.verify(token, jwtSecretKey);
    if (verified) {
        next()
    } else {
        return res.status(401).json({ error: "无效的token" });
    }
}
```

**`isLogin`** 是一个用于验证用户是否已登录的中间件。它首先从请求头中获取 **`Authorization`** 字段的值，该值应该是 JWT 令牌。然后使用 **`jwt.verify`** 函数验证令牌的有效性。如果验证通过，将调用 **`next()`**，表示用户已登录，然后继续执行后续的路由处理程序。如果验证失败，返回 401 状态码，表示令牌无效。

### 5，创建需要身份验证的路由

```jsx
// 获取用户信息
app.get("/user/:username", isLogin, async (req, res) => {
    const username = req.params.username;
    const user = users.find(u => u.username === username).map(u => ({ id: u.id, username: u.username}));
    res.json(user);
});
```

**`/user/:username`**是一个用于获取用户信息的路由。路由中的 **`:username`** 表示参数，表示用户的用户名。

我们在这个路由中添加了两个中间件，首先通过 **`isLogin`** 中间件验证用户是否已登录。如果用户已登录，才会进入到下一个中间件，然后根据用户名从 **`users`** 数组中查找用户信息并作为响应。

然后使用curl请求该路由，就能拿到用户信息：

![Untitled](http://nodejsbyexample.cn/uPic/2024041522241517131910551713191055007sJ1Ok3.png)

### 6，使用axios携带token请求用户信息

```jsx
import axios from "axios";
const token = localStorage.getItem("token");
const url = "http://localhost:3000/user/your_username"
const headers = {
    "Authorization": token,
    "Content-Type": "application/json",
    "Accept": "application/json",
};
const getUserInfo = () => {
    axios.get(url, { headers: headers })
        .then((response) => {
            console.log(response);
        })
        .catch((error) => {
            console.log(error);
        });
}
```

在前端我们一般会使用axios来发起请求，只要把token的值放在http header中的Authorization字段即可。当然除了放在Authorization之外，也可以放在其他header字段中，不过后端也需要从对应的header字段取token。

完整代码：

```jsx
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is up and running on ${PORT} ...`);
});

// 用户数据
const users = [
    { id: 1, username: "user1", password: "password1" },
    { id: 2, username: "user2", password: "password2" }
];
const jwtSecretKey = "your_jwt_secret_key";

// 登录之后生成 JWT token
app.post("/user/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            return res.status(401).json({ error: "用户名或密码错误" });
        }

        const payload = {
            userId: user.id,
        };
        //生成token 设置过期时间为 1 小时
        const token = await jwt.sign(payload, jwtSecretKey, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: "登录失败" });
    }
});

async function isLogin(req, res, next) {
    const tokenHeaderKey = 'Authorization';
    const token = req.header(tokenHeaderKey)

    if (!token) {
        return res.status(401).json({ error: "用户未登录" });
    }

    const verified = await jwt.verify(token, jwtSecretKey);
    if (verified) {
        next()
    } else {
        return res.status(401).json({ error: "无效的token" });
    }
}
// 获取用户信息
app.get("/user/:username", isLogin, async (req, res) => {
    const username = req.params.username;
    const user = users.map(u => ({ id: u.id, username: u.username})).find(u => u.username === username)
    res.json(user);
});
```

## **总结**

这篇文章我们介绍了JWT原理以及在nodejs中使用JWT 进行鉴权，除了JWT之外还可以使用session管理用户状态，感兴趣的可以👇这里：[https://juejin.cn/post/7270916734138957824](https://juejin.cn/post/7270916734138957824)

参考文章：

[https://github.com/auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

[https://www.ruanyifeng.com/blog/2018/07/json_web_token-tutorial.html](https://www.ruanyifeng.com/blog/2018/07/json_web_token-tutorial.html)