---
layout: ../../layouts/Blog.astro
title: "Solidity学习笔记：数组、结构体和Mapping"
date: "20240526"
tags: ["Solidity"]
---



```solidity

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ArrayDemo {
	// 数组可以在声明时指定长度，也可以动态调整大小
    // 定义一个长度为2的数组
    string[2] public fruit = ["apple", "mango"];

    // int类型数组
    uint[2] public numbers = [1, 2];
    
    // 不指定长度，定义变长数组
    string[] public  list = ["a", "b", "c"];
    function add(string memory name) public{
        list.push(name);
    }
}

contract StructDemo {
    // 定义一个包含两个属性的结构体Person。
    struct Person {
        string name;
        int256 favoriteNumber;
    }
    // 初始化
    Person public rita = Person("rita", 3);

    // 结构体数组
    Person[] public listOfPeople;
}


contract MappingDemo {
    // Mapping也就是映射，可以理解为Javascribt中的Object
    mapping (string name => int256 age) public nameToAge;
    // 也可以写成 mapping (string  => int256 ) public nameToAge;

    function setAge(string memory _name, int256 _age) public {
        nameToAge[_name] = _age;
    }

    function getAge(string memory _name) public view returns(int256)  {
        return nameToAge[_name];
    }
}
```





