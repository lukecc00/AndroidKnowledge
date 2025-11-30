# 常用的 UI 组件

Compose 提供丰富的基础组件，满足常见 UI 场景。

## 文本与按钮

```kotlin
@Composable
fun Basics() {
  Column(Modifier.padding(16.dp)) {
    Text("标题", style = MaterialTheme.typography.titleMedium)
    Spacer(Modifier.height(8.dp))
    Button(onClick = { /* TODO */ }) { Text("按钮") }
  }
}
```

## 图片与卡片

```kotlin
@Composable
fun MediaCard() {
  Card { 
    Column(Modifier.padding(12.dp)) {
      Image(painterResource(R.drawable.ic_launcher_foreground), contentDescription = null)
      Text("描述文案", color = Color.Gray)
    }
  }
}
```

## 列表与懒加载

```kotlin
@Composable
fun NamesList(items: List<String>) {
  LazyColumn { items(items) { name -> Text(name) } }
}
```

## 输入与表单

```kotlin
@Composable
fun InputDemo() {
  var text by remember { mutableStateOf("") }
  TextField(value = text, onValueChange = { text = it }, label = { Text("输入") })
}
```

> 提示：结合 `Modifier` 与 `MaterialTheme` 可以快速构建统一风格的界面。
