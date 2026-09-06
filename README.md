# 开水泡泡 · 商品展示页

粉色系手账商品展示网站，使用原生 HTML、CSS 和 JavaScript 构建，无需安装依赖或执行构建命令。

## 本地预览

直接打开 `index.html`，或者在项目根目录启动任意静态文件服务器。

站点包含两套可互相切换的视觉方案：

- `index.html`：方案 1「奶油雾光蕾丝手账屋」，也是默认首页。
- `scheme-2.html`：方案 2「泡泡蔷薇洛丽塔剧场」。

两个页面顶部的“华丽展开 / 温柔回归”按钮用于切换风格，商品数据、收藏状态和图片素材共用。

## 替换商品资料

商品名称、规格、描述和图片路径集中保存在 `script.js` 顶部的 `products` 数组中。真实商品图可以放入 `assets/products/`，然后修改对应商品的 `image` 字段。

当前实拍商品使用 `assets/products/real/` 中以商品名命名的 WebP 副本。桌面目录中的原始 JPG 和 PSD 不属于项目文件，不会被网页修改或覆盖。商品列表当前不显示价格；商品规格保存在每条数据的 `size` 和 `material` 字段中。

社交平台入口位于 `index.html` 的 `#contact` 区域，目前展示“即将开放”。获得真实链接后，可将按钮替换为链接。

## Cloudflare Pages

本项目是纯静态网站：

- Framework preset：None
- Build command：留空
- Build output directory：项目根目录（`.`）

连接 GitHub 仓库后部署即可。

部署完成后，主域名默认打开方案 1；方案 2 位于 `/scheme-2.html`。无需新增 Cloudflare 项目或修改构建设置。
