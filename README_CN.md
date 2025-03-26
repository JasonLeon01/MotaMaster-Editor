# MotaMaster 编辑器
[中文](README_CN.md) | [English](README.md)

一个专门为 MotaMaster 引擎开发的魔塔类型游戏编辑器。

## 功能特性

- 可视化地图编辑器
- 角色编辑器
- 道具与装备管理
- 敌人配置
- 动画编辑器
- 事件系统编辑器
- 系统设置配置

## 环境要求

- Node.js (v16 或更高版本)
- npm (v8 或更高版本)

## 开始使用

1. 克隆仓库：
```bash
git clone https://github.com/JasonLeon01/MotaMaster-Editor.git

2. 安装依赖：
```bash
cd MotaMaster-Editor
npm install
```

3. 启动开发环境：
```bash
npm start
npm run electron
```

## 开发命令
- `npm run electron-dev` ：启动开发环境
- `npm start` ：仅启动 React 开发服务器
- `npm run build` ：构建生产版本
- `npm run electron` ：不使用开发模式启动 Electron
- `npm run package:win` ：仅打包 Windows 程序
- `npm run package:mac` ：仅打包 macOS 程序

## 项目结构
- `/src` ：React 源代码
- `/electron` ：Electron 主进程代码
- `/public` ：静态资源

## 许可证
本项目采用 zlib 许可证 - 详见 [LICENSE](LICENSE) 文件。
