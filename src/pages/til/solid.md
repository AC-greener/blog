---
layout: ../../layouts/Blog.astro
title: "Solidity学习笔记：变量与函数"
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



## 函数



```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Simple {
    uint256 x = 256;
    //public关键字表示函数可以被任何人调用，包括外部账户和其他合约。
    function store(uint256 _x) public {
        x = _x;
    }
 		// 是一个 view 函数，表示它不会修改区块链上的数据，返回一个 uint256 类型的值。
    function retrieve() public view returns (uint256) {
        return x;
    }
}

```

### 函数的可见性

在 Solidity 中，函数的可见性（或访问控制）可以通过关键字来指定。这些关键字定义了谁可以调用或访问函数。

Solidity 提供了以下几种函数可见性修饰符：

1. **`public`**：函数可以被任何人调用，包括外部账户和其他合约。
2. **`internal`**：函数只能在合约内部或继承该合约的子合约中调用。
3. **`private`**：函数只能在合约内部调用，不能被继承的子合约调用。
4. **`external`**：函数只能通过外部调用，即只能通过消息调用（`call`）来访问，不能通过内部函数调用来访问。

### 函数的状态修饰符

状态修饰符是来指示函数与区块链交互方式的关键字。

主要的状态修饰符包括 `view`、`pure` 和 `payable`。

`view` 表示这个函数不会修改区块链上的任何状态。具体来说，`view` 修饰符意味着：

- 函数可以读取状态变量，但不能修改它们。
- 函数不能产生任何状态更改的副作用。
- 调用 `view` 函数不会消耗 gas（如果调用是从外部帐户进行的），但如果从另一个合约内部调用，则会消耗少量 gas。



`pure` 修饰符表示函数既不会修改区块链上的状态，也不会读取状态变量。

```solidity
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }
```



`payable` 修饰符表示函数可以接收以太币。只有标记为 `payable` 的函数才能在调用时接收以太币。

```solidity
    function deposit() public payable {
        // 函数体可以为空
    }
```

