# 写在开头

欢迎来到 Android 知识库。本页提供全站导览与使用教程：

- 左侧为分类导航，支持折叠与展开
- 右侧为目录（TOC），显示当前页面的标题层级
- 底部上一页/下一页按全站顺序连通所有页面

你可以从左侧选择任意分类开始阅读，或使用顶部搜索快速定位内容。

## 添加内容

1. 在 `content/<分类>/` 下新增 Markdown 文件，例如：`content/jetpack/compose/navigation.md`
2. 编辑 `content/index.json`，在对应分类下追加或更新页面条目：
   ```json
   {"id":"compose-navigation","title":"导航与路由","file":"jetpack/compose/navigation.md","summary":"NavHost 与参数传递"}
   ```
3. 推送到仓库，站点侧边栏与搜索会自动生效

> 说明：由于 Pages 不列目录，维护 `content/index.json` 是必须的。

## 子页面（章节）

- 在页面对象内添加 `children` 数组，实现目录级联，例如在 `Compose 入门` 下添加：
  ```json
  "children": [
    {"id":"compose-ui-components","title":"2. 常用的 UI 组件","file":"jetpack/compose/ui-components.md"}
  ]
  ```
- 左侧会显示可折叠的子目录项，右侧面包屑也会展示层级

## 图片与动图

- 将图片放入 `content/media/` 或对应分类目录中
- 在 Markdown 引用：`![说明](media/your.png)` 或外链 `https://...`
- 站点自动处理路径、懒加载与点击放大预览

## 部署到 GitHub Pages

1. 创建仓库并推送文件到 `main`
2. 在 Settings → Pages 选择 “GitHub Actions” 作为构建来源
3. 工作流位于 `.github/workflows/deploy.yml`，推送即自动发布

## 本地预览

- 在根目录运行轻量服务器，例如：`python3 -m http.server 8000`
- 浏览器打开 `http://localhost:8000/`

## 常见问题

- 404：请使用站内路由（`#/分类/页面id`），不要直接打开 `.md`
- 搜索无结果：确认 `index.json` 已包含该页面条目
- 目录点击无响应：确保章节未折叠，或刷新后重试
