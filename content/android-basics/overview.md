# Android 总览

Android 是一个基于 Linux 的移动操作系统，核心由以下层级组成：

- Linux Kernel：进程管理、内存、驱动、Binder IPC
- HAL：硬件抽象层，为上层提供统一接口
- Framework：Activity、Service、ContentProvider、View 等
- App 层：使用 SDK 构建的应用程序

设计关键：进程隔离、权限模型、组件化、跨进程通信（Binder）。

