# 菜鸟的Android知识博物馆

项目作用
- 个人与团队的 Android 知识沉淀与检索中心：统一规范的内容结构，随时补充与查询
- 学习路线与实践笔记的可视化导航：分类/章节/面包屑/目录（TOC）清晰呈现学习路径
- 快速搜索定位：标题、段落与正文关键词匹配，点击可跳转到文档对应位置并高亮
- 轻量部署与发布：纯静态站点，无需服务端，适合 GitHub Pages、任意静态托管或本地浏览
- 移动端友好：抽屉式侧栏、代码块换行、表格横向滚动，手机上完整可读

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

- 范围：页面标题、文内标题（段落）与正文内容
- 展示：命中片段会带 `<mark>` 高亮，显示上下文摘要
- 跳转：点击搜索结果可定位到文档对应标题位置，并在文内高亮匹配词
- 建议：为页面在 `summary` 字段填写摘要，便于搜索列表展示

## 本地预览（可选）

直接用浏览器打开 `index.html` 即可预览。如果遇到跨域限制，建议通过轻量服务器（如 VSCode Live Server 或 `python -m http.server`）在本地目录启动。

## 自定义

- 修改 `assets/styles.css` 调整主题与样式（含移动端抽屉与响应式规则）
- 修改 `index.html` 中标题与页眉（品牌、按钮与搜索框）
- 若需要更复杂的搜索，可引入 `lunr.js` 并生成 `search.json`

适用场景
- 个人技术博客的知识条目归档与检索
- 团队内部学习资料与最佳实践的轻量知识库
- 课程/培训/读书笔记的结构化整理与共享

## 许可证

内容与代码均可在你的仓库下按你的许可证分发。
