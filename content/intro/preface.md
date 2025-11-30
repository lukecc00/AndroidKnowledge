> 本页为站点介绍页。为避免重复标题，本页不再使用一级标题（H1），正文从二级/三级标题开始，以与其他页面的显示效果保持一致。

## 站点概览

- 左侧：分类导航，支持折叠/展开
- 右侧：目录（TOC）显示当前页面标题层级（桌面端显示，移动端隐藏）
- 底部：上一页/下一页按全站顺序串联所有页面（搜索模式下隐藏）
- 顶部：搜索框支持标题/段落/正文关键词匹配，点击结果跳转并高亮

## 如何新增内容

1. 在 `content/<分类>/` 下新增 Markdown 文件：
   - 示例：`content/jetpack/compose/navigation.md`
2. 编辑 `content/index.json`，在对应分类追加条目：
   ```json
   {"id":"compose-navigation","title":"导航与路由","file":"jetpack/compose/navigation.md","summary":"NavHost 与参数传递"}
   ```
3. 推送到仓库后，侧边栏与搜索自动生效

说明：GitHub Pages 不列目录，必须维护 `content/index.json` 作为清单。

## 子页面（章节）结构

- 在页面条目内添加 `children` 数组实现章节层级：
  ```json
  "children": [
    {"id":"compose-ui-components","title":"2. 常用的 UI 组件","file":"jetpack/compose/ui-components.md"}
  ]
  ```
- 左侧会出现可折叠子目录，面包屑展示层级路径

## 资源与图片

- 图片放入 `content/media/` 或分类目录
- Markdown 引用：`![说明](media/your.png)` 或外链 `https://...`
- 站点自动处理路径前缀、懒加载与点击放大

## 部署与预览

1. 推送到 `main` 分支
2. 在仓库 Settings → Pages 选择 “GitHub Actions” 作为构建来源
3. 本地预览：在根目录运行 `python3 -m http.server 8000`，访问 `http://localhost:8000/`

## 常见问题

- 页面 404：请使用站内路由（`#/分类/页面id`），不要直接打开 `.md`
- 搜索无结果：确认 `index.json` 已包含该页面条目
- 目录点击无响应：确保章节未折叠，或刷新后重试
