---
layout: ../../layouts/Blog.astro
title: "Solidity学习笔记：require、revert和函数修饰符"
date: "20240604"
tags: ["Solidity"]
---
### require

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

![image-20240604163058130](http://static.zhutongtong.cn/uPic/2024060416310117174898611717489861438image-20240604163058130.png)

### revert

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

![image-20240604163758476](http://static.zhutongtong.cn/uPic/2024060416380117174902811717490281027image-20240604163758476.png)

### 函数修饰符 Function Modifier 

要想调用下面合约中的withdraw方法必须是合约的拥有者

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Simple {
    uint256 public amount;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function withdraw() public {
        require(msg.sender == owner, "must be owner");
        amount += 1;
    }
}
```

如果我们其他的一些方法也必须是合约的拥有者才能调用，如何实现呢？可以每个方法都加上一个require条件，也可以使用修饰符：

```solidity
// 定义修饰符
modifier onlyOwner {
    require(msg.sender == owner, "Sender is not owner");
    _;
}
```

修饰符中的下划线表示函数的其余代码将执行的位置（对于这个例子来说就是amount += 1的执行位置）。将其放在 `require` 语句之后，当满足 `require` 条件时，函数的逻辑才会运行。

修改后的withdraw如下：

```solidity
function withdraw(uint amount) public onlyOwner {
	amount += 1;
}
```

当调用 `withdraw` 时，智能合约会先检查 `onlyOwner` 修饰符。如果修饰符中的 `require` 语句通过，则执行函数代码的其余部分。

