---
layout: ../../layouts/Blog.astro
title: "Solidity学习笔记：函数"
date: "20240605"
tags: ["Solidity"]
---

### 函数基础

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Simple {
    uint256 public x  = 256;

    // public关键字表示函数可以被任何人调用，包括外部账户和其他合约。
    function add() public {
        x += 1;
    }

    // 接受一个参数
    function add2(uint256 number) public {
        x += number;
    }
 	// 返回一个 uint256 类型的值。
    function retrieve() public view returns (uint256) {
        return x;
    }
    
    // 返回多个值的函数
    function returnMany() public pure returns (uint256, bool, uint256) {
        return (1, true, 2);
    }

    // 对返回的参数进行命名
    function named() public pure returns (uint256 a, bool b, uint256 c) {
        return (1, true, 2);
    }
}
```

### 函数的状态修饰符

上面例子中我们用到了状态修饰符，状态修饰符表示函数与区块链交互方式。

状态修饰符包括 `view`、`pure` 和 `payable`。

`view` 表示这个函数不会修改区块链上的任何状态。

```solidity
    uint256 public x = 1;
    function addToX(uint256 y) public view returns (uint256) {
        return x + y;
    }

```

`pure` 修饰符表示函数既不会修改区块链上的状态，也不会读取状态变量。

```solidity
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }
```

`payable` 修饰符表示函数可以接收以太币。只有标记为 `payable` 的函数才能在调用时接收以太币。

```solidity
    function payMe() public payable {
        // 函数体可以为空
    }
```

### 函数的可见性修饰符

在 Solidity 中，函数或者的可见性可以通过这些关键字来指定

1. **`public`**：可以被任何人调用，包括外部账户和其他合约。
2. **`internal`**：只能在合约内部或继承该合约的子合约中调用。
3. **`private`**：只能在合约内部调用，不能被继承的子合约调用。
4. **`external`**：只能通过外部调用，不能通过内部函数调用来访问。
