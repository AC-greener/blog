---
layout: ../../layouts/MarkdownPostLayout.astro
title: "TypeScript常见面试题"
date: "20230509"
tags: ["blogging"]
---

# **TypeScript 相对于 JavaScript 的优势是什么？**

TypeScript 是一种由 Microsoft 开发的编程语言，它在 JavaScript 的基础上添加了静态类型和其他一些特性，包括类、接口、枚举等。相比于 JavaScript，TypeScript 有以下几个优势：

1. 更好的类型检查：TypeScript 提供了静态类型检查，可以在编译时检查代码的类型错误，减少了在运行时出现类型错误的可能性，使代码更加可靠、稳定。
2. 更好的 IDE 支持：TypeScript 提供了更丰富的类型信息，可以帮助 IDE 更好地提示和补全代码，提高了开发效率。
3. 更好的可维护性：TypeScript 强制规定变量和函数的类型，可以让代码更加易于理解和维护，尤其是在大型项目中。
4. 更好的可读性：TypeScript 的类型注解可以让代码更加易于理解和阅读，代码更具可读性。
5. 更好的语言特性支持：TypeScript 提供了更多的语言特性，如类、接口、枚举等，可以让开发者更加便捷地进行面向对象编程，同时也有助于代码重构和优化。

### inteface vs type类型别名

type表示类型别名，interface是接口

1，两者都可以用来描述一个对象的形状或一个函数签名。但语法不同。

interface：

```jsx
interface Point {
  x: number;
  y: number;
}

interface SetPoint {
  (x: number, y: number): void;
}
```

type：

```jsx
type Point = {
  x: number;
  y: number;
};

type SetPoint = (x: number, y: number) => void;
```

2，都可以扩展，但扩展方式不同：

interface可以可以使用interface扩展，interface还可以extend type；type 使用 & 交叉类型来进行扩展

```jsx
type BirdType = {
  wings: 2;
};

interface BirdInterface {
  wings: 2;
}
type Owl = { nocturnal: true } & BirdType;

interface Chicken extends BirdInterface {
  colourful: false;
  flies: false;
}

// interface还可以extend type
interface Peacock extends BirdType {
  colourful: true;
  flies: false;
}
```

3，声明合并：

两个相同的interface会被合并，相同的type会报错，因为类型在创建后不能被改变。

```jsx
interface User {
  name: string
  age: number
}

interface User {
  sex: string
}

/*
User 接口为 {
name: string
age: number
sex: string
}
*/

// Duplicate identifier 'Puppy'.
type Puppy = {
  color: string;
};

type Puppy = {
  toys: number;
};

```

4，type可以使用可用于其他类型，如原始类型、联合类型和元组。interface无法实现

```jsx
// primitive
type Name = string;

// union
type PartialPoint = PartialPointX | PartialPointY;

// tuple
type Data = [number, string];
```

详细讨论：[https://stackoverflow.com/questions/37233735/interfaces-vs-types-in-typescript/52682220#52682220](https://stackoverflow.com/questions/37233735/interfaces-vs-types-in-typescript/52682220#52682220)

### 交叉类型和联合类型

交叉类型和联合类型是 TypeScript 中的两种不同类型。

**交叉类型**（Intersection Types）是将多个类型合并为一个类型，表示一个对象同时具有这些类型的属性和方法。

例如，以下代码将 A 和 B 两个类型合并为一个新的类型：

```jsx
type A = { propA: string };
type B = { propB: number };
type C = A & B;

const obj: C = { propA: "hello", propB: 42 };
```

在上面的代码中，C 是由 A 和 B 两个类型合并而成的交叉类型。因此，obj 对象具有 propA 和 propB 两个属性。

**联合类型**（Union Types）是将多个类型作为可选项组合在一起，表示一个对象具有这些类型中任何一种类型的属性和方法。

例如，以下代码将 A 和 B 两个类型作为联合类型：

```jsx
type A = { propA: string };
type B = { propB: number };
type C = A | B;

const obj1: C = { propA: "hello" };
const obj2: C = { propB: 42 };
```

在上面的代码中，C 是由 A 和 B 两个类型组合成的联合类型。因此，obj1 对象具有 propA 属性，而 obj2 对象具有 propB 属性。

举例一个联合类型的错误用法：

```jsx
type Point = {
  x: number;
  y: number;
};
type Point2 = {
  a: number;
  b: number;
};

// Exactly the same as the earlier example
function printCoord(pt: Point | Point2) {
}

printCoord({ x: 100, a: 100 });//会报错
// Argument of type '{ x: number; a: number; }' is not assignable to parameter of type 'Point | Point2'.
//   Property 'b' is missing in type '{ x: number; a: number; }' but required in type 'Point2'.(2345)

```

问题在于传入的对象 **{ x: 100, a: 100 }** 不符合 **printCoord** 函数的参数类型声明 **pt: Point | Point2**。

根据 **pt** 的类型声明，传入的参数必须是一个 **Point** 或者 **Point2** 类型的对象，而且这个对象必须包含 **x** 和 **y** 属性（如果是 **Point** 类型），或者包含 **a** 和 **b** 属性（如果是 **Point2** 类型）。

但是，传入的对象 **{ x: 100, a: 100 }** 同时包含了 **x** 和 **a** 属性，这个对象既不是 **Point** 类型，也不是 **Point2** 类型。因此，在 TypeScript 中会报错，提示传入的参数类型不符合预期。

**区别：**

交叉类型将多个类型合并为一个类型，表示一个对象同时具有这些类型的属性和方法；

联合类型将多个类型作为可选项组合在一起，表示一个对象具有这些类型中任何一种类型的属性和方法。

### 什么是泛型

泛型（Generics）是指在定义函数、接口或类的时候，不预先指定具体的类型，而在使用的时候再指定类型的一种特性。

泛型在 TypeScript 中的主要应用场景是编写通用代码，可以在不同的数据类型上进行操作，从而提高代码的可重用性和灵活性。

一个使用TypeScript 泛型函数例子是实现一个通用的查找函数，可以在不同类型的数组中查找指定的元素，并返回元素的索引。以下是一个示例实现：

```jsx
function findIndex<T>(arr: T[], item: T): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === item) {
      return i;
    }
  }

  return -1;
}

```

调用该函数时，可以传入不同类型的数组和元素，只要它们的类型相同，就可以进行查找：

```jsx
const arr1 = [1, 2, 3];
const arr2 = ["a", "b", "c"];
const index1 = findIndex(arr1, 2); // 1
const index2 = findIndex(arr2, "b"); // 1

```

如果不使用泛型，则需要编写针对每个数据类型的重复代码，如下所示：

```jsx
function findIndexInt(arr: number[], item: number): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === item) {
      return i;
    }
  }
  return -1;
}

function findIndexStr(arr: string[], item: string): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === item) {
      return i;
    }
  }
  return -1;
}

```

### const 和 readonly 的区别

const 变量的值不能被重新分配，且必须在声明时被初始化，而 readonly 变量可以在声明时不进行初始化，readonly 变量是属性不能被改变。

```jsx
const arr = [1, 2, 3];
arr.push(4); // OK

class Person {
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
}

const person = new Person('Alice');
person.name = 'Bob'; // Error: Cannot assign to 'name' because it is a read-only property.

```

**TypeScript 中 any、never、unknown、null & undefined 和 void 有什么区别？**

any: 动态的变量类型（失去了类型检查的作用）。never: 永不存在的值的类型。例如：never 类型是那些总是会抛出异常或根本就不会有返回值的函数表达式或箭头函数表达式的返回值类型。unknown: 任何类型的值都可以赋给 unknown 类型，但是 unknown 类型的值只能赋给 unknown 本身和 any 类型。null & undefined: 默认情况下 null 和 undefined 是所有类型的子类型。 就是说你可以把 null 和 undefined 赋值给 number 类型的变量。当你指定了 --strictNullChecks 标记，null 和 undefined 只能赋值给 void 和它们各自。void: 没有任何类型。例如：一个函数如果没有返回值，那么返回值可以定义为void。

### keyof 和 typeof 关键字的作用？

**keyof**用于获取**一个类型的所有键值的联合类型**。例如，如果有一个类型**Person**，它有三个属性**name**，**age**和**gender**，则使用**keyof**可以获取到一个类型**PersonKeys**，它的值为**"name" | "age" | "gender"**

```jsx
type Person = {
  name: string;
  age: number;
  gender: string;
};

type PersonKeys = keyof Person; // "name" | "age" | "gender"

```

**typeof**用于获取一个值的类型。例如，如果有一个变量**age**，它的值为**30**，则使用**typeof**可以获取到一个类型**number**。

```jsx
const age = 30;
type AgeType = typeof age; // number

```

### 如何联合枚举类型的 Key?

在 TypeScript 中，可以使用 **keyof** 关键字和 **typeof** 关键字来联合枚举类型的 Key。

假设我们有一个枚举类型 **MyEnum**，它有三个属性 **A**，**B** 和 **C**。我们想要定义一个类型，它的值只能为 **MyEnum** 的属性之一，我们可以使用联合类型和 **keyof** 关键字

```jsx
enum MyEnum {
   A,
   B,
   C
}
type MyEnumKey =  keyof typeof MyEnum; // 'A' | 'B' | 'C'
```

**typeof** 操作符用于获取一个值的类型。在 **typeof MyEnum** 中，**MyEnum** 是一个枚举类型的名称，因此 **typeof MyEnum** 将返回枚举类型 **MyEnum** 的类型，即 **{ [key: string]: number }**。这个类型表示一个具有字符串索引签名的对象，其中键是枚举属性的名称，值是枚举属性的值。例如，对于如下的枚举类型：

```jsx
enum MyEnum {
  A,
  B,
  C,
}

```

**typeof MyEnum** 的返回值将是：

```jsx
{
  A: 0,
  B: 1,
  C: 2,
  [key: string]: number,
}

```

### 对 TypeScript 类中成员的 public、private、protected、readonly 修饰符的理解？

public: 成员都默认为public，被此限定符修饰的成员是可以被外部访问；private: 被此限定符修饰的成员是只可以被类的内部访问；protected: 被此限定符修饰的成员是只可以**被类的内部以及类的子类**访问;readonly: 关键字将属性设置为只读的。 **只读属性必须在声明时或构造函数里被初始化**。

### declare，declare global是什么？

declare 是用来定义全局变量、全局函数、全局命名空间、js modules、class等declare global 为全局对象 window 增加新的属性

```jsx
declare global {
   interface Window {
        csrf: string;
   }
}
```

### **简述工具类型 Exclude、Omit、Merge、Intersection、Overwrite的作用。**

Exclude<T, U> 从 T 中排除出可分配给 U的元素。Omit<T, K> 的作用是忽略T中的某些属性。Merge<O1, O2> 是将两个对象的属性合并。Compute<A & B> 是将交叉类型合并Intersection<T, U>的作用是取T的属性,此属性同样也存在与U。Overwrite<T, U> 是用U的属性覆盖T的相同属性。
