---
layout: ../../layouts/Blog.astro
title: "Solidity学习笔记：使用Foundry框架搭建本地智能合约开发环境"
date: "20240617"
tags: ["Solidity"]
---



Foundry 是一个以太坊应用开发框架，使用 Rust 编写。它由以下组件组成：

1. **Forge**：以太坊测试框架，类似于 Truffle、Hardhat 和 DappTools。
2. **Cast**：用于与 EVM 智能合约交互的多功能工具，可以发送交易和获取链数据。
3. **Anvil**：本地以太坊节点，类似于 Ganache、Hardhat Network。
4. **Chisel**：快速、实用且详细的 Solidity REPL。

### 安装 Foundry

首先安装Foundry 工具集：

`curl -L https://foundry.paradigm.xyz | bash`

执行之后产生的输出类似这样

```bash
Detected your preferred shell is bashrc and added Foundry to Path run:source /home/user/.bashrcStart
a new terminal session to use Foundry
```

然后执行：`foundryup`来安装 Foundry 

运行`forge --version`

![image-20240617222828775](http://nodejsbyexample.cn/uPic/2024061722283217186345121718634512233nCarjd.png)

看到版本号就说明安装成功了

### 初始化一个Foundry项目

`forge init`

运行之后得到的目录结构如：

![image-20240617223911534](http://nodejsbyexample.cn/uPic/2024061722391317186351531718635153522bhLHT6.png)

其中src目录包含一个示例的Counter智能合约



### 编译合约

可以使用`forge build`或者`forge compile`编译合约

编译完成之后会产生一个output文件夹，output里面会包含合约的ABI等信息

![image-20240616211838851](http://nodejsbyexample.cn/uPic/2024061621184317185439231718543923061Y10jSO.png)



### 启动anvil环境

Foundry内置的anvil可以创建一个本地节点用于部署智能合约

启动 Anvil 区块链：

`anvil`

启动之后会给我们几个账户和私钥：

![image-20240616212429963](http://nodejsbyexample.cn/uPic/2024061621254517185443451718544345236ABw4Bp.png)

在启动anvil之后可以看到rpc-url和private-key，下一步会用到：

接下来我们在本地部署智能合约

部署的命令如下：

`forge create < name-of-your-contract > add < rpc-url > --interactive`

比如：

`forge create Counter add http://127.0.0.1:8545 --interactive`

然后输入密钥即可部署成功

### 使用cast与智能合约进行交互

部署完成之后可以使用forge内置的cast命令与合约进行交互

命令的格式是：`cast send <address> store(uint256) <values> --private-key your_key`

我们使用setNumber设置一下number：

![image-20240616223721190](http://nodejsbyexample.cn/uPic/2024061622462317185491831718549183545Z4s8wD.png)

获取number:

![image-20240616224625776](http://nodejsbyexample.cn/uPic/2024061622462717185491871718549187468vqtaJP.png)