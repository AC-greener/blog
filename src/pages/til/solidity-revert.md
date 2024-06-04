---
layout: ../../layouts/Blog.astro
title: "Solidity学习笔记：require和revert"
date: "20240604"
tags: ["Solidity"]
---



```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Test {
  
uint256 public constant MINIMUM_USD = 5 * 10 ** 18;
   function sendMoney() public payable {
        require(msg.value >= 1e18);  
    }
}

```

`msg.value`表示交易的金额，单位是Wei，Wei在以太坊中是最小的单位，1Eth = 1000000000000000000 Wei。

`require`表示至少需要1个以太币。

还可以添加错误消息：

`require(msg.value >= 5 * 10e18, "You need to spend more ETH!");`

![image-20240604163058130](https://static.zhutongtong.cn/uPic/2024060416310117174898611717489861438image-20240604163058130.png)



当require的条件没有被满足时，solidity会进行revert撤消之前的操作，举例来说：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Test {
    uint256 public value = 1;

    function sendMoney() public payable {
        value += 1;
        require(msg.value >= 1e18, "You need to spend more ETH!");
    }
}

```



执行sendMoney函数时，value会加1变成2，发送的金额不足一个以太币时，revert操作会恢复value为初始值1

![image-20240604163758476](https://static.zhutongtong.cn/uPic/2024060416380117174902811717490281027image-20240604163758476.png)

