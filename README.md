# 开水泡泡 · 商品展示页

粉色系手账商品展示网站，使用原生 HTML、CSS 和 JavaScript 构建，无需安装依赖或执行构建命令。

## 本地预览

直接打开 `index.html`，或者在项目根目录启动任意静态文件服务器。

## 替换商品资料

商品名称、价格、描述和图片路径集中保存在 `script.js` 顶部的 `products` 数组中。真实商品图可以放入 `assets/products/`，然后修改对应商品的 `image` 字段。

社交平台入口位于 `index.html` 的 `#contact` 区域，目前展示“即将开放”。获得真实链接后，可将按钮替换为链接。

## Cloudflare Pages

本项目是纯静态网站：

- Framework preset：None
- Build command：留空
- Build output directory：项目根目录（`.`）

连接 GitHub 仓库后部署即可。
