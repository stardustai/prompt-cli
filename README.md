# @stardustai/prompt-cli

一个基于 TypeScript 的命令行工具，用于快速初始化项目、生成任务 prompt 文件以及管理配置。

## 特性

- 🚀 **项目初始化**: 自动创建 Git 仓库、Python 虚拟环境，并安装依赖
- 🎯 **Prompt 生成**: 根据任务类型生成相应的 prompt 文件
- ⚙️ **配置管理**: 支持 OSS 和平台配置的缓存与管理
- 🔧 **多任务支持**: 支持数据导入、数据导出、结果导入等任务类型

## 安装

```bash
npm install -g @stardustai/prompt-cli
```

## 使用方法

### 初始化项目

```bash
# 在当前目录初始化项目
prompt init

# 在指定目录初始化项目
prompt init /path/to/project
```

初始化命令会：
- 检查并创建 Git 仓库
- 创建 Python 虚拟环境
- 生成 requirements.txt 文件
- 安装 Python 依赖

### 生成 Prompt 文件

```bash
# 在当前目录生成 prompt 文件
prompt generate

# 在指定目录生成 prompt 文件
prompt generate /path/to/project
```

支持的任务类型：
- **数据导入**: 从 OSS 下载数据并处理
- **数据导出**: 处理数据并上传到 OSS

### 配置管理

```bash
# 查看配置命令帮助
prompt config --help

# 清空所有配置缓存
prompt config clear
```

配置管理功能：
- 清空 OSS 配置缓存
- 清空平台认证信息
- 清空所有已保存的设置

## 配置文件

工具会在以下位置保存配置：
- **配置目录**: `~/.config/prompt-cli/`
- **环境变量**: `~/.config/prompt-cli/.env`
- **缓存文件**: `~/.config/prompt-cli/cache.json`

支持的配置项：
- OSS 访问密钥和端点
- 平台用户名和密码
- 最近使用的项目设置

## 开发

### 环境要求

- Node.js >= 16
- npm >= 7

### 本地开发

1. 克隆项目：
```bash
git clone <repository-url>
cd prompt-cli
```

2. 安装依赖：
```bash
npm install
```

3. 构建项目：
```bash
npm run build
```

4. 开发模式运行：
```bash
npm run dev
```

5. 测试构建后的版本：
```bash
npm run start
```

### 项目结构

```
src/
├── commands/          # 命令实现
│   ├── init.ts        # 项目初始化命令
│   ├── generate.ts    # Prompt 生成命令
│   └── config.ts      # 配置管理命令
├── services/          # 服务层
│   ├── configService.ts     # 配置管理服务
│   ├── ossService.ts        # OSS 服务
│   ├── platformService.ts   # 平台服务
│   └── fileGeneratorService.ts # 文件生成服务
├── utils/             # 工具函数
├── types/             # 类型定义
├── templates/         # 模板文件
└── index.ts          # 入口文件
```

## 许可证

MIT
