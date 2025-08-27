---
layout: ../../layouts/Blog.astro
title: "鸿蒙ArkWeb简介与使用"
date: "20250322"
tags: ["Harmony"]
---

## 1. ArkWeb简介

### 使用场景

ArkWeb 提供了 Web 组件，用于在应用程序中显示 Web 页面内容。常见使用场景包括：

1，应用集成Web页面，打开App特定网页；Hybrid 混合开发。

2，浏览器网页浏览场景，打开三方网页；多窗口，多Tab。

### 能力范围

Web 组件为开发者提供了丰富的控制 Web 页面能力，包括：

- **Web 页面加载**：声明式加载Web页面和离屏加载 Web 页面等。
- **生命周期管理**：组件生命周期状态变化，通知 Web 页面的加载状态变化等。
- **常用属性与事件**：UserAgent 管理、Cookie 管理、字体与深色模式管理、权限管理等。
- **与应用界面交互**：自定义文本选择菜单、上下文菜单、文件上传界面等与应用界面交互能力。
- **JavaScript 交互**：App 与 Web 页面通过 JavaScriptProxy 进行双向交互。
- **安全与隐私**：无痕浏览模式、广告拦截、坚盾守护模式等。
- **维测能力**：DevTools 工具调试能力，使用 crashpad 收集 Web 组件崩溃信息。
- **其他高阶能力**：与原生组件同层渲染、Web组件的媒体播放托管等。

## **2. ArkWeb的使用**

### ArkWeb组件的简单使用

ArkWeb 组件主要两部分组成，分别是 Web 组件，主要用于显示页面；另外一个就是 Web 组件控制器（webview.WebviewController），主要用来控制页面的行为。

**下面是一个简单的加载网页的示例：**

```jsx
import { webview } from '@kit.ArkWeb';
@Entry
@Component
struct WebComponent {
  controller: webview.WebviewController = new webview.WebviewController(); // Web 组件控制器
  build() {
    Column() {
      Web({ src: 'https://aiqicha.baidu.com', controller: this.controller }); // 创建 Web 组件，且创建时加载 https://m.baidu.com
    }
  }
}
```

需要注意的是，加载网页是需求使用网络的，对于网络的使用，需要声明权限，除了上面的示例代码，还需要在工程的 module.json5 中配置网络访问权限，

**参考配置如下所示：**

```jsx
"requestPermissions":[
    {
      "name" : "ohos.permission.INTERNET"
    }
  ]
```

### Web 组件常用配置&常用事件

Web 组件有丰富的属性配置和事件回调，方便开发时处理不同的业务，以下是常用属性配置和常用事件回调介绍：

**部分常用属性配置:**

- **JS脚本执行权限：**`javaScriptAccess`
- **存储&缓存权限：**`domStorageAccess`, `fileAccess`, `databaseAccess`, `imageAccess`, `cacheMode`
- **多窗口权限：**`multiWindowAccess`
- **字体设置：**`defaultFontSize`, `webStandardFont`, `webSerifFont`, `webSansSerifFont`
- **主题模式：**`darkMode`
- **缩放控制：**`initialScale`, `textZoomRatio`

**部分常用事件回调**

- **页面状态**：`onBeforeUnload`, `onPageBegin`, `onPageEnd`, `onProgressChange`
- **页面标题**：`onFaviconReceived`, `onTitleReceive`
- **网页拦截**：`onInterceptRequest`, `onLoadIntercept`
- **网络错误**：`onErrorReceive`, `onHttpErrorReceive`
- **弹窗事件**：`onWindowNew`, `onWindowExit`
- **网站权限**：`onGeolocationShow`, `onPermissionRequest`
- **输入处理**：`onInterceptKeyEvent`, `onScroll`

### Web 组件控制器常用的控制能力

Web 组件控制器也有不少的常用的控制 Web 页面的能力，以下是常用的控制能力介绍：

- **加载网页**：loadUrl、loadData
- **生命周期**：onInactive、 onActive
- **用户代理**：getUserAgent、get(set)CustomUserAgent
- **页面操作**：pageUp、zoomIn\ zoomOut、 scrollTo、scrollBy、 slideScroll
- **网站信息**：getUrl、getOriginalUrl、 getFavicon、getWebId
- **前进后退**：forward、backward、accessStep
- **历史记录：**getItemAtIndex、clearHistory
- **页面搜索**：searchNext、searchAllAsync、clearMatches
- **调试开关**：setWebDebuggingAccess
- **页面保存**：storeWebArchive
- **页面预加载**：prepareForPageLoad、prefetchPage

### ArkWeb的userAgent

UserAgent（简称UA）是一个特殊的字符串，它包含了设备类型、操作系统及版本等关键信息。

鸿蒙的ua：

`Mozilla/5.0 (Phone; OpenHarmony 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36  ArkWeb/4.1.6.1 Mobile`

UA 的相关方法

- getUserAgent() 获取当前默认 UA。
- getCustomUserAgent(): string 获取自定义 UA。
- setCustomUserAgent(userAgent: string): void 设置自定义 UA，会覆盖系统的用户代理。

一般情况下，我们是不应该直接覆盖默认 UA 的，这样会丢失很多信息。在百度 app 里面，是在默认的 UA 里面追加手百自己的标记。

```jsx
struct WebComponent {
  webviewController: webview.WebviewController = new webview.WebviewController(); 
  build() {
    Column() {
      Web({ src: src: "https://aiqicha.baidu.com", controller: this.webviewController})
        .onControllerAttached(() => { // webviewController 需要和 Web 组件绑定后，才可以使用 UA 相关的方法
          this.webviewController.setCustomUserAgent(this.webviewController.getUserAgent() + "baidu_tag")
        })
    }
  }
}
```

### ArkWeb的Cookie

Web 组件提供了 WebCookieManager 类，用于管理 Web 组件的 Cookie 信息。

**部分常用方法**

- static fetchCookieSync(url: string, incognito?: boolean): string 同步获取指定url对应cookie的值。
- static fetchCookie(url: string, callback: AsyncCallback<string>): void 异步callback方式获取指定url对应cookie的值。
- static configCookieSync(url: string, value: string, incognito?: boolean): void 为指定url设置单个cookie的值。
- static configCookie(url: string, value: string, callback: AsyncCallback<void>): void 异步callback方式为指定url设置单个cookie的值。
- static existCookie(incognito?: boolean): boolean 获取是否存在cookie。
- static clearAllCookiesSync(incognito?: boolean): void 清除所有cookie。
- static clearAllCookies(callback: AsyncCallback<void>): void 异步callback方式清除所有cookie。
- static clearSessionCookieSync(): void 清除所有会话cookie。
- static clearSessionCookie(callback: AsyncCallback<void>): void 异步callback方式清除所有会话cookie。

### app使用ArkWeb中的js方法

应用侧可以通过下面 2 个方法来调用前端页面的JavaScript相关函数

- webview.WebviewController.runJavaScript()
- webview.WebviewController.runJavaScriptExt()

runJavaScriptExt() 入参类型不仅支持string，还支持 ArrayBuffer（比如从文件中获取JavaScript脚本数据），当脚本比较大的时候，可以用这个方法。

```jsx
 <!-- index.html  -->
...
<script>
function htmlTest() {
  console.log('js call htmlTest method');
}
</script>
...

...
webviewController: webview.WebviewController = new webview.WebviewController();
build() {
  Column() {
    Button('runJavaScript').onClick(() => {
      this.webviewController.runJavaScript('htmlTest()');
    })
    Web({ src: $rawfile('index.html'), controller: this.webviewController })
}
...
```

### ArkWeb使用app中的原生方法

前端页面调用应用侧函数，需要先建立 Web 和应用侧的方法注册绑定，然后前端页面才可以调用。可以通过下面 2 个方法建立方法注册绑定：

- Web.javaScriptProxy() 接口
- webview.WebviewController.registerJavaScriptProxy() 接口

```jsx
// xxx.ets 伪码
...
class testClass {
  test(): string {
    return 'ArkTS Hello World!';
  }
}
testObj: testClass = new testClass();
build() {
  Column() {
    Web({ src: $rawfile('index.html'), controller: this.webviewController})
      .javaScriptProxy({
        object: this.testObj, name: "testObjName", methodList: ["test"], controller: this.webviewController,
        asyncMethodList: [], permission: '' // 这一行是可选参数
      })
  }
}

<!-- index.html 伪码 -->
...
<button type="button" onclick="callArkTS()">Click Me!</button>
<script>
function callArkTS() {
  let str = testObjName.test();
}
</script>
...
```

### 在ArkWeb中进行同层渲染

在非原生框架的 UI组件功能或性能不如原生组件时，可使用同层渲染，使用ArkUI组件渲染这些组件（简称为同层组件）。这样可以提高渲染效率，提升应用使用体验。

同层渲染流程：

1. Web 页面加入同层渲染标签<embed> 和 <object>
2. Web 组件开启同层渲染功能enableNativeEmbedMode(true)
3. 当为<object>时，需注册同层标签规则registerNativeEmbedRule()
4. 监听同层组件生命周期.onNativeEmbedLifecycleChange()
5. 监听同层渲染区域的手势事件.onNativeEmbedGestureEvent()

```jsx
<!-- embed.html -->
...
<embed id = "input1" type="native/view" style="width: 100%; height: 100px; margin: 30px; margin-top: 600px"/>
...

<!-- object.html -->
...
<object id = "input1" type="test/input" style="width: 100%; height: 100px; margin: 30px; margin-top: 600px"/>
...

// xxx.ets
Web({src: $rawfile("embed.html" or "object.html"), controller: this.browserTabController})
  .enableNativeEmbedMode(true) // 配置同层渲染开关开启
  .registerNativeEmbedRule("object", "test") // 注册同层标签为"object"，类型为"test"前缀
  .onNativeEmbedLifecycleChange((embed) => { // 获取embed标签的生命周期变化数据,
    if (embed.status == NativeEmbedStatus.CREATE) {
      // 用 NodeController 创建一个原生的组件
    }
  })
  .onNativeEmbedGestureEvent((touch) => {
    nodeController?.postEvent(touch.touchEvent)； // 同层组件先处理事件
    touch.result.setGestureEventResult(true); // 通知Web组件手势事件消费结果
  })
 }
```

## 3. 优化ArkWeb加载速度

当Web页面加载缓慢时，可以使用预连接、预取等手段来加速Web页面的访问。

### **提前初始化内核**

通过[initializeWebEngine()](https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-webview-V5#initializewebengine)

来提前初始化内核说明

- initializeWebEngine不支持在异步线程中调用，否则会造成崩溃。
- initializeWebEngine全局生效，在整个APP生命周期中调用一次即可，不需要重复调用。

```jsx
import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit';
import { webview } from '@kit.ArkWeb';

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam) {
    // 提前初始化
    webview.WebviewController.initializeWebEngine()
  }
}
```

### **预连接**

可以通过[prepareForPageLoad()](https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-webview-V5#prepareforpageload10)来预解析或者预连接将要加载的页面。预连接url，在加载url之前调用，对url只进行dns解析，socket建链操作，并不获取主资源子资源。

```jsx
const HOST = "https://aiqicha.baidu.com"; 
export function doSearchPreLink() {  
  try {
    webview.WebviewController.prepareForPageLoad(HOST, true, 2)
  } catch (e) {
    logE("doSearchPreLink error")
  }
}
```

### **预取**

如果能够预测到Web组件将要加载的页面或者即将要跳转的页面。可以通过[prefetchPage()](https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/js-apis-webview-V5#prefetchpage10)

来预加载即将要加载页面。预加载会提前下载页面所需的资源，包括主资源子资源，但不会执行网页JavaScript代码。预加载是WebviewController的实例方法，需要一个已经关联好Web组件的WebviewController实例。

**说明：**

- 使用 `chromium`提供的`noStatePrefetch`实现。
- 下载的页面资源，会缓存五分钟左右，超过这段时间Web组件会自动释放。
- 缓存的内容，可以跨`web`组件复用。

在下面的示例中，在onPageEnd的时候触发下一个要访问的页面的预加载。

```jsx
import { webview } from '@kit.ArkWeb';
@Entry
@Component
struct WebComponent {
  webviewController: webview.WebviewController = new webview.WebviewController();
  build() {
    Column() {
      Web({ src: 'https://aiqicha.baidu.com', controller: this.webviewController })
        .onPageEnd(() => {
          // 预加载 https://www.baidu.com/test。
          this.webviewController.prefetchPage('https://www.baidu.com/test');
        })
    }
  }
}
```