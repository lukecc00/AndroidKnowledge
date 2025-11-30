# Jetpack Compose 入门

Jetpack Compose 是 Android 官方推出的声明式 UI 框架，强调“UI = f(State)”。它通过可组合函数描述界面，随状态变化自动重组，从而减少样板代码并提升开发效率。

![Compose 动效示例（占位图）](media/placeholder.svg)

## 核心概念

- Composable 函数：以 `@Composable` 标注，描述界面
- 状态与重组：`remember`、`mutableStateOf` 保存本地状态并触发重组
- 作用域与副作用：`LaunchedEffect`、`DisposableEffect` 处理生命周期相关逻辑
- 布局与修饰：`Row`/`Column`/`Box` 与 `Modifier`

## 第一个示例

```kotlin
@Composable
fun Greeting(name: String) {
  Text(text = "Hello, $name")
}
```

## 响应式状态

```kotlin
@Composable
fun Counter() {
  var count by remember { mutableStateOf(0) }
  Button(onClick = { count++ }) { Text("Clicked $count times") }
}
```

### 结构化并发与副作用

```kotlin
@Composable
fun Avatar(userId: String) {
  var image by remember { mutableStateOf<Bitmap?>(null) }
  LaunchedEffect(userId) {
    image = repository.loadAvatar(userId) // suspend 调用
  }
  image?.let { Image(bitmap = it.asImageBitmap(), contentDescription = null) }
}
```

## 布局与 Modifier

```kotlin
@Composable
fun CardSample() {
  Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
    Text("标题", style = MaterialTheme.typography.titleMedium)
    Spacer(Modifier.height(8.dp))
    Text("正文内容……", color = Color.Gray)
  }
}
```

### 主题与暗色模式

Compose 的 `MaterialTheme` 内置明暗主题与色彩方案，推荐在应用层统一管理：

```kotlin
@Composable
fun AppTheme(content: @Composable () -> Unit) {
  val dark = isSystemInDarkTheme()
  MaterialTheme(colorScheme = if (dark) darkColorScheme() else lightColorScheme()) {
    content()
  }
}
```

## 与 View 共存

通过 `ComposeView` 将 Compose 嵌入传统 View；或在 Compose 中使用 `AndroidView` 渲染现有 View：

```kotlin
@Composable
fun WebViewContainer(url: String) {
  AndroidView(factory = { ctx -> WebView(ctx) }, update = { it.loadUrl(url) })
}
```

### 性能与重组建议

- 避免在 `@Composable` 中做重计算，使用 `remember/derivedStateOf`
- 尽量保持参数稳定性，减少不必要重组
- 列表场景优先使用 `LazyColumn/LazyRow`

## 导航与状态提升

`NavHost` 管理页面导航；将状态提升至上层，保证组件可复用：

```kotlin
@Composable
fun AppNav() {
  val navController = rememberNavController()
  NavHost(navController, startDestination = "home") {
    composable("home") { HomeScreen() }
    composable("detail/{id}") { backStackEntry ->
      DetailScreen(id = backStackEntry.arguments?.getString("id") ?: "0")
    }
  }
}
```

### 可访问性与测试

- 使用 `contentDescription`、`semantics` 提升无障碍支持
- 通过 `compose-test` 进行 UI 测试，定位节点与断言状态

## 资源

- 官方文档与示例工程
- Material 3 设计语言与组件库
- 性能与重组指南、可访问性实践
