---
layout: ../../layouts/Blog.astro
title: "Solidity学习笔记：变量、Constant和Immutable"
date: "20240525"
tags: ["Solidity"]
---


## 变量

```solidity
// Solidity文件的开头一般是许可证声明，用于指明合约的许可证类型
// SPDX-License-Identifier: MIT

// 合约所使用的 Solidity 编译器版本。^0.8.19 表示这个合约可以使用 0.8.19 及其以上的版本，但不包括 0.9.0。
pragma solidity ^0.8.19;  

// 定义了一个名为 Simple 的合约
contract Simple {
    bool flag = true;
    int256 number = -256;
    uint256 x = 256;
    string y = "hello";
    // 变长字节数组，用于存储任意长度的二进制数据。
    bytes z = "cat";
    // 定长字节数组，bytes1, bytes2, bytes3, ..., bytes32 代表了从1到32的字节序列。
    bytes32 i = "cat2"
    // 地址类型，是一个可以发送以太币的地址。可以是你的智能合约账户。
    address add = 0x6be8C472C200D89b06C56013F3BCbD2FE91b966e;
}

```



## Constant和Immutable



Constant和Immutable都可以声明不可变的变量

Constant变量必须在初始化的时候进行赋值

Immutable变量和Constant类似，但是还可以在构造函数内设置，之后不能修改。

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.4;

uint constant X = 32**22 + 8;

contract C {
    string constant TEXT = "abc";
		
    uint256 public immutable MY_UINT;
    address immutable OWNER = msg.sender;

    constructor(uint256 _myUint) {
        MY_ADDRESS = msg.sender;
        MY_UINT = _myUint;
    }
}
```





