---
layout: ../../layouts/Blog.astro
title: "Solidity学习笔记：数据存储位置"
date: "20240602"
tags: ["Solidity"]
---

### 数据存储位置

Solidity 中有三种主要的数据存储位置：

1. **storage**：默认情况下，变量存储在区块链的中，数据会永久保存在区块链上。
2. **memory**：存储在内存中的数据在函数调用时是临时的。函数执行完毕后，这些数据会被销毁。可用于函数声明参数以及函数逻辑内
3. **calldata**：和Memory类似，但值是无法修改的。

下面是一个例子：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestContract {
    // x 的数据存储位置是 storage。这是唯一可以省略数据位置的地方。
    uint256 public x;

    function memoryTest(string memory _exampleString) public pure returns (string memory) {
        // 可以修改memory的变量
        _exampleString = "example";  
        return _exampleString;
    }

    function calldataTest(string calldata _exampleString) public pure  returns (string memory) {
        // 不可以修改
        return _exampleString;
    }
}

```

