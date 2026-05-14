# Langfuse 核心模块架构

Langfuse 采用三层架构设计，将 Web 应用、后台任务处理和数据存储逻辑清晰分离。

## 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web 层 (Next.js)                         │
│  app/ · components/ · features/ · hooks/ · pages/ · server/       │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
┌─────────────────────────────────┐  ┌─────────────────────────────┐
│      Worker 层 (Express+BullMQ) │  │    Shared 包 (@langfuse/shared) │
│  api/ · queues/ · features/    │  │  domain/ · server/ · db.ts   │
│  services/ · backgroundMigra.. │  │  types.ts · index.ts         │
└─────────────────────────────────┘  └─────────────────────────────┘
```

## 1. Web 层（Next.js）

Web 层是用户面向的界面层，基于 Next.js 构建。

```
src/
├── app/                  # Next.js App Router 页面
├── components/           # UI 组件（基于 shadcn/ui）
├── features/             # 功能模块（每个功能独立目录）
├── hooks/                # React 自定义 Hooks
├── pages/                # 页面路由
│   ├── api/              # tRPC 路由 + Public REST API
│   └── _app.tsx          # App Shell 入口
├── server/               # 服务端代码
│   ├── api/              # tRPC 路由（routers/）
│   └── db/               # 数据库访问层
├── styles/               # 全局样式
├── utils/                # 工具函数
└── workers/              # 后台 Worker
```

**职责：**
- 渲染用户界面（Traces、Prompts、Metrics 等）
- 通过 tRPC 调用内部 API
- 通过 Public REST API 暴露外部接口
- 管理用户会话和认证

## 2. Worker 层（Express + BullMQ）

Worker 层处理异步任务和后台 jobs。

```
src/
├── api/                  # HTTP 路由（健康检查等）
├── queues/               # 队列处理器
│   └── workerManager.ts  # Worker 注册与生命周期管理
├── features/             # 功能处理器（与队列 jobs 对应）
├── services/             # 服务层抽象
├── backgroundMigrations/ # 后台数据迁移脚本
└── __tests__/            # 单元测试
```

**职责：**
- 从 Redis 队列消费异步任务（ingestion、evaluation 等）
- 执行长时间运行的后台作业
- 通过 WorkerManager 统一管理 worker 的注册和生命周期

## 3. Shared 包（@langfuse/shared）

Shared 是 web 层和 worker 层共同依赖的核心共享库。

```
src/
├── domain/               # 领域模型
│   └── observations/      # 观察数据模型（traces、spans、generations）
│   └── scores/           # 评分模型
├── server/               # 服务端共享代码
│   ├── repositories/     # 数据访问层（Prisma repositories）
│   ├── queues.ts         # 队列负载（Job Payloads）Schema 定义
│   ├── redis/            # Redis 队列辅助函数
│   └── clickhouse/       # ClickHouse 分析引擎访问
├── db.ts                 # Prisma 客户端单例
├── types.ts              # 共享类型定义
└── index.ts              # 包导出入口
```

**职责：**
- 定义队列 payload 的 Zod schemas（统一契约）
- 提供 Prisma 和 ClickHouse 的数据访问抽象
- 沉淀领域模型和通用类型

## 4. EE 包（企业版）

企业版（Enterprise Edition）作为独立包被 web 层消费，提供高级功能：

- 高级分析（Advanced Analytics）
- 团队管理（Team Management）
- 私有部署增强（Self-hosted Enhancements）
- 审计日志（Audit Logs）

## 关键设计原则

### 依赖单向

```
web ──► shared ◄── worker
```

Web 层和 Worker 层都依赖 Shared 包，但彼此之间无直接依赖，Shared 是唯一的共享依赖。

### 队列契约统一

所有队列的 payload 结构（Job Payloads）统一在 `shared/src/server/queues.ts` 中定义，使用 Zod 进行类型校验。这确保了：

- 生产者（Web 层入队）和消费者（Worker 层处理）使用同一 Schema
- 类型安全，运行时校验
- 避免循环依赖（因为 Schema 定义在 Shared 中）

### 数据库分离

| 数据库 | 用途 | 特点 |
|--------|------|------|
| **PostgreSQL** | 事务性数据 | 用户、项目、配置、Trace 元数据 |
| **ClickHouse** | 分析型查询 | Trace 事件、LLM 调用日志、Metrics |

PostgreSQL 保证事务一致性（写入），ClickHouse 承载高并发分析查询（读取）。

### 前后端分离

| API 类型 | 调用方 | 用途 |
|----------|--------|------|
| **tRPC** | 前端组件 | 内部类型安全的 RPC 调用 |
| **Public REST API** | 外部客户端 | SDK 接入、Webhook、第三方集成 |

tRPC 用于前端到后端的类型安全通信；REST API 则面向外部消费者。

## 模块交互示例

以一个 LLM 调用追踪为例：

1. **SDK 写入** → Public REST API 接收 Trace 数据
2. **Web 层** → 通过 tRPC 处理写入请求，存入 PostgreSQL
3. **异步事件** → 通过 BullMQ 将事件入队到 Redis
4. **Worker 层** → 从 Redis 消费事件，写入 ClickHouse
5. **前端查询** → 通过 tRPC 从 PostgreSQL 读取元数据，从 ClickHouse 读取详细事件

## 目录结构速查

```
langfuse/
├── web/                  # Next.js 应用
│   └── src/
│       ├── app/          # App Router
│       ├── components/    # UI 组件
│       ├── features/     # 功能模块
│       ├── server/       # 服务端 API
│       └── pages/api/    # Public REST API
├── worker/               # 后台任务处理
│   └── src/
│       ├── queues/       # 队列定义
│       └── services/     # 服务层
└── shared/               # 共享包
    └── src/
        ├── domain/       # 领域模型
        └── server/       # 服务端共享
```
