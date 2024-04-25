---
layout: ../../layouts/Blog.astro
title: "HLS协议简介"
date: "20220831"
tags: ["hls"]

---

## HLS是什么
HLS ([HTTP Live Streaming](https://developer.apple.com/streaming/)) 是 Apple 提出的直播流协议，它诞生于2009年，它的工作原理是把一段视频流切分成一个个的小块，一次传输一小部分，并基于 HTTP 的文件来下载。当媒体流正在播放时，客户端可以根据当前网络环境，方便地在不同的码率流中做切换，以实现更好的观影体验。
下图是苹果官方给出的大体流程图：
![image.png](https://static.zhutongtong.cn/uPic/20240425152125171402968517140296854691661951450629-3fc6acd0-381e-4f1a-b6a9-0918f5de9bfb.png)
Server部分接受音视频输入并对其进行编码，将该流分割成一系列短的媒体文件，放在服务器上，还会创建并维护一个包含媒体文件列表的索引文件也就是index file。
客户端读取索引文件，然后按顺序请求列出的媒体文件。每个文件都包含流的一个连续片段。一旦下载了足够的数据，客户端就开始播放视频。

## HLS如何播放
HLS提供一个m3u8地址，可以很方便地实现播放：

- Safari浏览器直接能打开m3u8地址，譬如：
[https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/hls/xgplayer-demo.m3u8](https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/hls/xgplayer-demo.m3u8)
[https://v2.h5player.bytedance.com/examples/](https://v2.h5player.bytedance.com/examples/)
- 其他不兼容的浏览器里想播放HLS，可以使用开源的[hls.js](https://github.com/video-dev/hls.js/)

## HLS协议的组成
HLS 由两部分构成：

- **.m3u8 文件**：以 UTF-8 编码的 m3u 文件，这个文件本身不能播放，只是存放了播放信息的文本文件
- **.ts 视频文件**：每一个 m3u8 文件，分别对应若干个 ts 文件， ts 文件才是真正存放视频数的文件

m3u8 文件只是存放了一些 ts 文件的配置信息和相关路径，当视频播放时，m3u8 是动态改变的，video 标签会解析这个文件，并找到对应的 ts 文件来播放，所以一般为了加快速度，m3u8 放在 Web 服务器上，ts 文件放在 CDN 上。



这张图片显示了索引文件（master.m3u8）是如何构建的：
![image.png](https://static.zhutongtong.cn/uPic/20240425152137171402969717140296979551665712621273-8a4a57ed-eca6-4070-94c2-1a2b45b6067e.png)




## M3U8文件格式解析
简单的M3U8文件包含URL列表或带有一些其他元数据的本地文件路径。**元数据行以＃开头**。
**#EXTM3U**：表示该播放列表是一个扩展的M3U文件，M3U8文件必须以这个标签开始
**#EXT-X-PLAYLIST-TYPE**：表示该播放列表是点播还是直播（VOD或EVENT）
**#EXT-X-TARGETDURATION**：.ts文件最大的持续持续时间
**#EXT-X-VERSION**: HLS协议版本
**#EXT-X-ALLOW-CACHE：**是否允许cache
**#EXT-X-MEDIA-SEQUENCE**: 第一个TS分片的序列号，一个URL的序列号要比它前面的URL的序列号高1。
**#EXTINF**：指定每个媒体段(ts)的持续时间（秒），仅对其后面的URI有效
#**EXT-X-ENDLIST**：m3u8文件结束标志
[西瓜m3u8文件](http://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/hls/xgplayer-demo.m3u8)
```bash
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:6.000000,
segment-0.ts
#EXTINF:6.000000,
segment-1.ts
#EXTINF:6.000000,
segment-2.ts
#EXTINF:6.160000,
segment-3.ts
#EXTINF:6.240000,
segment-4.ts
#EXTINF:6.000000,
segment-5.ts
#EXT-X-ENDLIST
```

复杂的m3u8比上面的简版多了一个 **playlist**或称**master**文件。
在 master 中，会根据网速实现不同的 m3u8 文件，比如，3G/4G/wifi 网速等。一个 master 文件中可能是如下内容：
```bash
#EXTM3U
#EXT-X-VERSION:6
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=9615600,CODECS="avc1.4d001f,mp4a.40.2",RESOLUTION=1280x720 live/high.m3u8
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=5605600,CODECS="avc1.640028,mp4a.40.2",RESOLUTION=960x540 live/medium.m3u8
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=1755600,CODECS="avc1.42001f,mp4a.40.2",RESOLUTION=640x360 live/low.m3u8
EXT-X-STREAM-INF表示该标签后面的URL标识了另一个.m3u8文件，并参数定义了流的元数据，如BANDWIDTH、CODECS等。
```

live/high.m3u8（wifi环境，高清）文件里的结构可以如下：
```bash
#EXTM3U
#EXT-X-VERSION:6
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:26
#EXTINF:9.901,
https://cdn.com/wifi/segment1.ts
#EXTINF:9.901,
https://cdn.com/wifi/segment2.ts
#EXTINF:9.501,
https://cdn.com/wifi/segment3.ts
```

## MSE：MediaSource Extenstion
媒体源扩展API(通常简称为MSE)是来自 W3C 的一个规范，目前大多数浏览器都实现了这个规范。MSE实现了基于 Web 的流媒体功能。使用 MSE，媒体流能够通过 JavaScript 创建，并且能通过使用 `<audio>`和 `<video>`元素进行播放。

Video 、 MediaSource、 SourceBuffers 和实际数据之间的关系：
![image.png](https://static.zhutongtong.cn/uPic/20240425152357171402983717140298379621666700835241-fc2fc198-bea1-4563-adc6-6cf319d7a2af.png)




```javascript


const videoTag = document.getElementById("my-video");
const myMediaSource = new MediaSource();
const url = URL.createObjectURL(myMediaSource);
videoTag.src = url;

// 1. 添加 source buffers
const audioSourceBuffer = myMediaSource
  .addSourceBuffer('audio/mp4; codecs="mp4a.40.2"');
const videoSourceBuffer = myMediaSource
  .addSourceBuffer('video/mp4; codecs="avc1.64001e"');


// 2. 从服务端获取audio/video数据并添加到SourceBuffers
// 获取 audio 
fetch("http://server.com/audio.mp4").then(function(response) {
  // The data has to be a JavaScript ArrayBuffer
  return response.arrayBuffer();
}).then(function(audioData) {
  audioSourceBuffer.appendBuffer(audioData);
});
// 获取 video
fetch("http://server.com/video.mp4").then(function(response) {
  // The data has to be a JavaScript ArrayBuffer
  return response.arrayBuffer();
}).then(function(videoData) {
  videoSourceBuffer.appendBuffer(videoData);
});
```


```javascript

function fetchSegment(url) {
  return fetch(url).then(function(response) {
    return response.arrayBuffer();
  });
}

// fetching audio segments one after another (notice the URLs)
fetchSegment("http://server.com/audio/segment0.ts")
  .then(function(audioSegment0) {
    audioSourceBuffer.appendBuffer(audioSegment0);
  })
  .then(function() {
    return fetchSegment("http://server.com/audio/segment1.ts");
  })
  .then(function(audioSegment1) {
    audioSourceBuffer.appendBuffer(audioSegment1);
  })
  .then(function() {
    return fetchSegment("http://server.com/audio/segment2.ts");
  })
  .then(function(audioSegment2) {
    audioSourceBuffer.appendBuffer(audioSegment2);
  })
  // ...

// 用相同的方式获取video片段
fetchSegment("http://server.com/video/segment0.ts")
  .then(function(videoSegment0) {
    videoSourceBuffer.appendBuffer(videoSegment0);
  });

// ...
```

## hls.js
hls.js是基于Http Live Stream协议开发，利用Media Source Extension，用于实现HLS在web上播放的一款js播放库。

核心原理：
![image.png](https://static.zhutongtong.cn/uPic/20240425152207171402972717140297275381666789085355-dce35e3e-88f6-4e35-962a-ba0ec8cdf78e.png)

- hls.js会先通过loader去拉取.m3u8文件，通过文本正则匹配获取子m3u8文件或者ts地址
- 获取到ts地址后，然后再进行二进制读取，将ts格式中的视频流、音频流进行解封装
- 分流后转封装成mp4格式设置到Media Source Extension，最后通过挂载到video标签进行播放

