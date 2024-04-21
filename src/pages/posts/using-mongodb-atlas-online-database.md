---
layout: ../../layouts/Blog.astro
title: "使用MongoDB Atlas在线数据库"
date: "20230821"
tags: ["MongoDB", "jwt"]
---

1，创建MongoDB Atlas 账号

访问 **[MongoDB Atlas 网站](https://www.mongodb.com/cloud/atlas)** 并创建一个帐户.这里可以使用google账号去创建

![Untitled](http://static.zhutongtong.cn/uPic/2024041522281617131912961713191296018zJg91Y.png)

2，创建一个项目，名字随便起就行

![Untitled](http://static.zhutongtong.cn/uPic/2024041522281717131912971713191297094eE8u8G.png)

3，在对应的项目下创建一个数据库服务

![Untitled](http://static.zhutongtong.cn/uPic/20240415222817171319129717131912978384YrdWx.png)

4，选择服务商

这里我们选免费的和aws提供商，直接创建就行

你也可以选择goole cloud或者微软的Azure提供商

![Untitled](http://static.zhutongtong.cn/uPic/2024041522281817131912981713191298596B1M7Je.png)

5，创建用户

输入用户名密码创建一个用户

![Untitled](http://static.zhutongtong.cn/uPic/2024041522281917131912991713191299381FiEiki.png)

这个用户名和密码会用来连接数据库，建议复制一下这个密码

6，选择连接数据库的环境

选择连接数据库的环境，因为我是在本地开发，所以选本地环境，注意，这里最好吧当前的Ip地址加一下，只有列表中的 IP 地址才能连接到数据库，当你换了wifi之后需要在吧对应的IP地址加入到这个名单

![Untitled](http://static.zhutongtong.cn/uPic/2024041522282017131913001713191300285GdomhA.png)

7，创建完成

![Untitled](http://static.zhutongtong.cn/uPic/2024041522282117131913011713191301241qrCEEp.png)

8，使用nodejs或者其他语言连接这个数据库

![Untitled](http://static.zhutongtong.cn/uPic/20240415222822171319130217131913027030AJzUc.png)

复制这个url连接到你的后端服务即可：

![Untitled](http://static.zhutongtong.cn/uPic/2024041522282417131913041713191304124q5TU1q.png)

9，完结🎉