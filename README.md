# flask

## 0.项目介绍

```
安装依赖: pip install flask reportlab==3.6.12 pillow==9.5.0

handbook_flask/
├── app.py          # Flask 后端核心代码
├── static/         # 静态文件（JS/CSS）
│   └── js/
│       └── main.js # 前端交互逻辑
└── templates/      # 前端模板
    └── index.html  # 主页面

```

## 1.后端核心

```
generate_handbook_pdf 函数接收前端参数，在内存中生成 PDF（避免临时文件），支持自定义间距、边距；

/generate-pdf 接口接收 POST 请求，返回 PDF 文件流，前端可直接下载或打印。
```

## 2.前端交互

```
用滑块实现实时调整间距 / 边距，数值同步显示，操作直观；
Canvas 实现本地实时预览，无需每次请求后端，体验更流畅；
一键下载 PDF、一键打印 PDF，操作闭环。
```

## 3.适配性

```
1.启动应用：运行 app.py，控制台会显示 Running on http://0.0.0.0:5000/；

2.访问页面：打开浏览器，输入 http://localhost:5000；

3.操作流程：

    a.选择尺寸、样式；
    
    b.调整间距 / 边距（滑块拖动）；
    
    c.点击「实时预览」查看效果；
    
    d.点击「下载 PDF」保存到本地；
    
    e.点击「打印 PDF」直接调用浏览器打印功能。
```

## 3.总结

```
1.这个 Flask 应用实现了可视化参数调整 + 实时预览 + PDF 导出 / 打印的核心需求，完全适配手帐内页打印场景；

2.前端用 Bootstrap 保证界面美观，Canvas 实现本地预览，后端用 reportlab 生成标准 PDF；

3.代码结构清晰，你可以轻松扩展（比如添加更多尺寸、自定义颜色、多页生成等）。

如果需要调整样式（比如线条颜色、点阵大小），只需修改后端 generate_handbook_pdf 中的 setStrokeColorRGB/setFillColorRGB 参数，或前端 main.js 中的 strokeStyle/fillStyle 即可。
```