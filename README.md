# 菜鸟的Android知识博物馆

这是一个完全静态、可直接部署到 GitHub Pages 的 Android 知识分享网站。无需服务端，所有内容以 Markdown 存储，支持分类、页面导航与站内搜索。

## 如何部署到 GitHub Pages

1. 在 GitHub 创建仓库，例如：`AndroidKnowledge`
2. 将本项目所有文件推送到 `main` 分支
3. 在仓库 Settings → Pages 启用 Pages，并选择 “GitHub Actions” 作为构建来源
4. 推送后，Actions 会自动运行并发布到 `https://<你的用户名>.github.io/AndroidKnowledge/`

## 内容结构与管理

- 内容位于 `content/` 目录，按分类组织为子目录（如 `android-basics/`、`jetpack/` 等）
- 每个页面为一个 `.md` 文件，使用标准 Markdown 语法
- `content/index.json` 是清单文件，站点通过该文件加载分类与页面列表

### 新增页面的步骤

1. 在对应分类目录下新增 Markdown 文件，例如：`content/jetpack/navigation.md`
2. 编辑 `content/index.json`，在该分类的 `pages` 中追加：
   ```json
   {"id": "navigation", "title": "导航", "file": "jetpack/navigation.md", "summary": "Navigation 组件与路由"}
   ```
3. 提交并推送到 GitHub，即可在站点侧边栏与搜索中出现

> 说明：由于 GitHub Pages 不能列目录，站点无法自动发现新文件，因此维护 `index.json` 是必须的。

### 在内容中添加图片/动图

- 将图片或动图（PNG/JPG/SVG/GIF）放入 `content/media/` 或对应分类目录中
- 在 Markdown 中直接引用：
  - `![说明文字](media/your-image.png)` 或 `![说明文字](android-basics/diagram.svg)`
- 站点会自动：
  - 为相对路径前置 `content/` 前缀（如 `media/xxx.png` → `content/media/xxx.png`）
  - 为图片增加懒加载与可点击的放大预览（Lightbox）
  - 使用 `alt` 文字作为图片说明（figcaption）
- 也可以直接引用外链图片 `https://...`，无需前缀处理

## 搜索说明

- 搜索框支持标题与正文的关键词匹配
- 为提升性能，正文在搜索时按需读取并做简易文本匹配
- 你可以在 `summary` 字段填写该页面的摘要，便于搜索列表展示

## 本地预览（可选）

直接用浏览器打开 `index.html` 即可预览。如果遇到跨域限制，建议通过轻量服务器（如 VSCode Live Server 或 `python -m http.server`）在本地目录启动。

## 自定义

- 修改 `assets/styles.css` 调整主题与样式
- 修改 `index.html` 中标题与页眉
- 若需要更复杂的搜索，可以引入 `lunr.js` 并生成 `search.json`

## 许可证

内容与代码均可在你的仓库下按你的许可证分发。
