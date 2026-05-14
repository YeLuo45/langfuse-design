# Langfuse 架构文档

## 项目概览

Langfuse 是一个开源的 LLM 工程平台，用于开发、监控、评估和调试 AI 应用。采用 Monorepo 架构，使用 pnpm + Turbo 管理多包项目。

## 项目结构

```
langfuse/
├─ web/                     # Next.js 应用（UI + tRPC + Public REST API）
├─ worker/                  # 后台任务处理器（Express + BullMQ）
├─ packages/
│   ├─ shared/              # 共享包（DB/队列/领域模型）
│   ├─ config-typescript/   # TS 配置
│   ├─ config-eslint/       # ESLint 配置
│   └─ eslint-plugin/       # ESLint 插件
├─ ee/                      # 企业版包（被 web 消费）
├─ fern/                    # API 定义源（OpenAPI 生成）
├─ generated/               # 生成的 API 客户端
└─ scripts/                 # 仓库脚本
```

## 核心架构图

```mermaid
graph TB
    subgraph "客户端层"
        UI["Web UI<br/>(Next.js)"]
        SDK["Langfuse SDK<br/>(Python/JS)"]
        API["Public REST API"]
    end

    subgraph "应用层 - Langfuse Core"
        Web["Web 服务<br/>Next.js + tRPC"]
        Worker["Worker 服务<br/>Express + BullMQ"]
    end

    subgraph "包层 - Packages"
        Shared["@langfuse/shared<br/>Domain + DB + Queues"]
        EE["@langfuse/ee<br/>Enterprise Features"]
    end

    subgraph "数据层"
        Postgres["PostgreSQL<br/>(Prisma ORM)"]
        ClickHouse["ClickHouse<br/>(Analytics)"]
        Redis["Redis<br/>(Queue + Cache)"]
        S3["S3<br/>(File Storage)"]
    end

    UI --> Web
    SDK --> API
    API --> Web
    Web --> Shared
    Worker --> Shared
    Web --> EE
    EE --> Shared
    Shared --> Postgres
    Shared --> ClickHouse
    Shared --> Redis
    Web --> S3
    Worker --> S3
```

## 包依赖关系

```mermaid
graph LR
    subgraph "web"
        WebUI["UI Components"]
        Trpc["tRPC Routes"]
        PublicAPI["Public REST API"]
    end

    subgraph "worker"
        QueueConsumer["BullMQ Consumer"]
        TaskProcessor["Task Processors"]
    end

    subgraph "packages"
        Shared["@langfuse/shared"]
    end

    subgraph "ee"
        EE["@langfuse/ee"]
    end

    WebUI --> Shared
    Trpc --> Shared
    PublicAPI --> Shared
    QueueConsumer --> Shared
    TaskProcessor --> Shared
    EE --> Shared
    WebUI --> EE
    Trpc --> EE
    PublicAPI --> EE
```

**依赖规则：**
- `web` → `@langfuse/shared`, `@langfuse/ee`
- `worker` → `@langfuse/shared`
- `@langfuse/ee` → `@langfuse/shared`
- `@langfuse/shared` → **不导入** `web` / `worker` / `ee`

## 服务架构

### Web 服务

基于 Next.js 框架，负责处理：
- 用户界面渲染
- tRPC 内部 API 调用
- Public REST API（同步请求）

### Worker 服务

基于 Express + BullMQ，负责处理异步任务：
- **Ingestion** - 数据摄取处理
- **Evaluation** - 评估任务执行
- **Export** - 数据导出任务

## 数据存储架构

```mermaid
graph TB
    subgraph "PostgreSQL (Prisma)"
        Users["用户数据"]
        Projects["项目配置"]
        Datasets["数据集"]
        APIKeys["API Keys"]
    end

    subgraph "ClickHouse"
        Traces["Traces"]
        Observations["Observations<br/>(Spans, Generations, Tools)"]
        Events["Events"]
        Scores["Scores"]
    end

    subgraph "Redis"
        Queues["BullMQ Queues"]
        Cache["缓存层"]
    end

    subgraph "S3"
        Files["文件存储"]
    end
```

| 存储 | 用途 | 特点 |
|------|------|------|
| PostgreSQL | 事务性数据 | 用户、项目、配置等核心实体 |
| ClickHouse | 分析性数据 | Traces、Observations、Events、Scores |
| Redis | 队列和缓存 | BullMQ 任务队列、热点数据缓存 |
| S3 | 文件存储 | 上传文件、导出文件等 |

## 技术栈

| 类别 | 技术 |
|------|------|
| 运行时 | Node.js |
| 语言 | TypeScript (strict mode) |
| 包管理 | pnpm + Turbo |
| Web 框架 | Next.js |
| 任务队列 | BullMQ |
| ORM | Prisma (PostgreSQL) |
| 分析数据库 | ClickHouse |
| 缓存/队列 | Redis |
| 测试 | Vitest + Playwright |
| 部署 | Docker Compose / Kubernetes |

## 核心入口点

- **领域模型**: `packages/shared/src/domain/{observations,traces,scores}.ts`
- **Postgres Schema**: `packages/shared/prisma/schema.prisma`
- **ClickHouse 迁移**: `packages/shared/clickhouse/migrations/{clustered,unclustered}/*.sql`
- **队列定义**: `packages/shared/src/server/queues.ts`

## 相关链接

- [Langfuse 架构手册](https://langfuse.com/handbook/product-engineering/architecture)
