---
layout: ../../layouts/Blog.astro
title: "Solidity学习笔记：import"
date: "20240602"
tags: ["Solidity"]
---

可以使用`import`在 Solidity 中导入本地和外部的合约文件

SimpleStorage.sol

```solidity
// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

contract SimpleStorage {
    uint256 myFavoriteNumber;

    function store(uint256 _favoriteNumber) public {
        myFavoriteNumber = _favoriteNumber;
    }

    function retrieve() public view returns (uint256) {
        return myFavoriteNumber;
    }
}

contract SimpleStorage2 {}

```

Test.sol

```solidity
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

// 仅仅导入SimpleStorage合约
import {SimpleStorage} from "./SimpleStorage.sol";
// import {SimpleStorage, SimpleStorage2} from "./SimpleStorage.sol";

contract Test {
    // 使用导入的SimpleStorage作为类型
    SimpleStorage public s;

    function create() public {
        s = new SimpleStorage();
    }

    function store(uint256 _favoriteNumber) public  {
        s.store(_favoriteNumber);
    }

    function get() public view returns (uint256) {
        return s.retrieve();
    }
}
```



从github导入一个外部合约：

```solidity
// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.5/contracts/utils/cryptography/ECDSA.sol
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.5/contracts/utils/cryptography/ECDSA.sol";
```

