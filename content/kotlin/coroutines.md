# Kotlin 协程基础

协程通过 `suspend` 将异步代码写成同步风格。核心构件：

- CoroutineScope/Job：生命周期与取消
- Dispatcher：线程调度（Main、IO、Default）
- Structured Concurrency：在作用域内声明任务，自动取消与错误传播

示例：

```kotlin
suspend fun load() = withContext(Dispatchers.IO) { /* I/O */ }
```

