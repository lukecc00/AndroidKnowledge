# MVVM 实战

分层：UI(View) — ViewModel — Domain(UseCase) — Data(Repository)。

事件：单向数据流，副作用隔离；建议使用 Flow/StateFlow 管理状态。

测试：ViewModel 单元测试，UseCase 业务测试，Repository 集成测试。

