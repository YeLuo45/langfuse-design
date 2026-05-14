# 数据库层架构

Langfuse 采用多数据库架构，不同组件承担不同职责：

```
┌─────────────────────────────────────────────────────────┐
│                    Langfuse 应用层                        │
├──────────────┬──────────────┬──────────────┬────────────┤
│   Postgres   │  ClickHouse  │    Redis     │    S3      │
│  (Prisma)    │              │   (BullMQ)   │  (对象存储)  │
├──────────────┼──────────────┼──────────────┼────────────┤
│  事务性数据   │  分析性数据   │  队列和缓存   │  文件存储   │
└──────────────┴──────────────┴──────────────┴────────────┘
```

## Postgres (Prisma) — 事务性数据

Postgres 存储所有需要强一致性事务支持的核心业务数据。

### 核心表

| 表名 | 说明 |
|------|------|
| `User` | 用户账户（NextAuth 集成） |
| `Organization` | 组织/租户 |
| `Project` | 项目，归属特定组织 |
| `ApiKey` | API 密钥（支持组织和项目级别作用域） |
| `Prompt` | Prompt 模板（含版本管理） |
| `PromptDependency` | Prompt 依赖关系 |
| `Dataset` | 数据集 |
| `DatasetItem` | 数据集条目 |
| `DatasetRuns` | 数据集运行 |
| `DatasetRunItems` | 数据集运行条目 |
| `Model` | 模型配置 |
| `LegacyPrismaTrace` | 追踪会话（v1/v2 遗留表，仍在使用） |
| `LegacyPrismaObservation` | 观察记录（span/event/log，v1/v2 遗留表） |
| `EvalTemplate` | 评估模板 |
| `ScoreConfig` | 评分配置 |
| `ProjectMembership` | 项目成员关系 |
| `OrganizationMembership` | 组织成员关系 |
| `MembershipInvitation` | 成员邀请 |
| `LlmApiKeys` | LLM API 密钥配置 |
| `LlmSchema` | LLM Schema 定义 |
| `LlmTool` | LLM 工具定义 |
| `JobConfiguration` | 任务配置 |
| `JobExecution` | 任务执行记录 |
| `Automation` | 自动化规则 |
| `AutomationExecution` | 自动化执行记录 |
| `Trigger` | 触发器 |
| `Action` | 操作/动作 |
| `Dashboard` | 仪表板 |
| `DashboardWidget` | 仪表板小组件 |
| `AnnotationQueue` | 标注队列 |
| `AnnotationQueueItem` | 标注队列条目 |
| `AnnotationQueueAssignment` | 标注分配 |
| `BlobStorageIntegration` | Blob 存储集成 |
| `SlackIntegration` | Slack 集成 |
| `MixpanelIntegration` | Mixpanel 集成 |
| `PosthogIntegration` | Posthog 集成 |
| `TraceMedia` | 追踪媒体 |
| `ObservationMedia` | 观察记录媒体 |
| `Media` | 媒体文件 |
| `PendingDeletion` | 待删除记录 |
| `DefaultView` | 默认视图 |
| `TableViewPreset` | 表格视图预设 |
| `Survey` | 问卷调查 |
| `CloudSpendAlert` | 云开销告警 |
| `VerifiedDomain` | 已验证域名 |

### Schema 管理

**Schema 文件：**
```
packages/shared/prisma/schema.prisma
```

**迁移文件：**
```
packages/shared/prisma/migrations/
```

**生成 Prisma Client：**
```bash
pnpm run db:generate
```

**运行迁移（开发环境）：**
```bash
pnpm run db:migrate
```

---

## ClickHouse — 分析性数据

ClickHouse 存储海量的追踪、观察和评分数据，用于高性能分析和查询。

### 核心表

| 表名 | 说明 |
|------|------|
| `traces` | 追踪会话概览（时间、名称、用户、元数据等） |
| `observations` | 详细观察记录（LLM calls、retrieval、embedding 等） |
| `event_log` | 事件日志（用于 blob storage 文件追踪） |
| `scores` | 评分数据 |
| `dataset_run_items` | 数据集运行条目 |
| `analytics_traces` | 追踪分析物化视图 |
| `analytics_observations` | 观察记录分析物化视图 |

### Schema 示例

**traces 表（ClickHouse）：**
```sql
CREATE TABLE traces (
    `id` String,
    `timestamp` DateTime64(3),
    `name` String,
    `user_id` Nullable(String),
    `metadata` Map(LowCardinality(String), String),
    `release` Nullable(String),
    `version` Nullable(String),
    `project_id` String,
    `public` Bool,
    `bookmarked` Bool,
    `tags` Array(String),
    `input` Nullable(String) CODEC(ZSTD(3)),
    `output` Nullable(String) CODEC(ZSTD(3)),
    `session_id` Nullable(String),
    `created_at` DateTime64(3) DEFAULT now(),
    `updated_at` DateTime64(3) DEFAULT now(),
    `event_ts` DateTime64(3),
    `is_deleted` UInt8
) ENGINE = ReplacingMergeTree(event_ts, is_deleted)
PRIMARY KEY (project_id, toDate(timestamp))
ORDER BY (project_id, toDate(timestamp), id);
```

**observations 表（ClickHouse）：**
```sql
CREATE TABLE observations (
    `id` String,
    `trace_id` String,
    `project_id` String,
    `type` LowCardinality(String),  -- span, event, generation
    `parent_observation_id` Nullable(String),
    `start_time` DateTime64(3),
    `end_time` Nullable(DateTime64(3)),
    `name` String,
    `metadata` Map(LowCardinality(String), String),
    `level` LowCardinality(String),
    `status_message` Nullable(String),
    `version` Nullable(String),
    `input` Nullable(String) CODEC(ZSTD(3)),
    `output` Nullable(String) CODEC(ZSTD(3)),
    `provided_model_name` Nullable(String),
    `internal_model_id` Nullable(String),
    `model_parameters` Nullable(String),
    `provided_usage_details` Map(LowCardinality(String), UInt64),
    `usage_details` Map(LowCardinality(String), UInt64),
    `provided_cost_details` Map(LowCardinality(String), Decimal64(12)),
    `cost_details` Map(LowCardinality(String), Decimal64(12)),
    `total_cost` Nullable(Decimal64(12)),
    `completion_start_time` Nullable(DateTime64(3)),
    `prompt_id` Nullable(String),
    `prompt_name` Nullable(String),
    `prompt_version` Nullable(UInt16),
    `created_at` DateTime64(3) DEFAULT now(),
    `updated_at` DateTime64(3) DEFAULT now(),
    `event_ts` DateTime64(3),
    `is_deleted` UInt8
) ENGINE = ReplacingMergeTree(event_ts, is_deleted)
PRIMARY KEY (project_id, `type`, toDate(start_time))
ORDER BY (project_id, `type`, toDate(start_time), id);
```

### Schema 管理

**迁移文件：**
```
packages/shared/clickhouse/migrations/unclustered/
```

> 注意：当前仅使用 `unclustered` 目录，`clustered` 目录不存在。

**添加新迁移后重置 ClickHouse：**
```bash
pnpm run ch:reset
```

---

## Redis — 队列和缓存

Redis 用于任务队列和热点数据缓存。

### BullMQ 队列

Langfuse 使用 BullMQ 处理异步任务：

| 队列名 | 说明 |
|--------|------|
| `ingestion` | 数据摄取队列 |
| `evaluation` | 评估队列 |
| `export` | 导出队列 |
| `job` | 通用任务队列 |
| `cloud-usage-metering` | 云使用量计量 |
| `data-retention` | 数据保留处理 |
| `metering-data-postgres-export` | 计量数据 Postgres 导出 |
| `cloud-free-tier-usage-threshold` | 免费层用量阈值检查 |
| `cloud-spend-alert` | 云开销告警处理 |

### 缓存

- **会话缓存**：用户会话数据
- **热点数据**：频繁访问的项目、追踪概览等

### 技术栈

- **ioredis**：Redis 客户端
- **bullmq**：任务队列

---

## S3 — 对象存储

S3 兼容存储（支持 AWS S3、MinIO 等）用于文件存储。

### 用途

| 用途 | 说明 |
|------|------|
| 数据集文件 | 上传的数据集 CSV/JSON 文件 |
| 导出文件 | 追踪、观察、评分等数据导出 |
| Blob 存储导出 | 长期存储的追踪数据导出 |
| 媒体文件 | Trace/Observation 关联的媒体文件 |

### Blob Storage Export

Langfuse 支持将追踪数据导出到 S3 进行长期归档，导出的数据包括：
- `traces` — 追踪会话
- `observations` — 观察记录
- `scores` — 评分数据
- `events` — 事件数据

---

## 数据流向

```
                           ┌─────────────────┐
                           │  SDK / API      │
                           │  (ingestion)    │
                           └────────┬────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │  Postgres │   │ ClickHouse│   │   Redis   │
            │  (写入)   │   │  (写入)   │   │  (队列)   │
            └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                  │               │               │
                  │               │               │
                  ▼               ▼               ▼
            ┌───────────────────────────────────────────┐
            │           Query / Read Path              │
            │     (Web UI, API, Analytics)             │
            └───────────────────────────────────────────┘
                                      │
                                      ▼
                              ┌───────────┐
                              │    S3     │
                              │ (导出/存储)│
                              └───────────┘
```

---

## 相关命令

| 命令 | 说明 |
|------|------|
| `pnpm run db:generate` | 生成 Prisma Client |
| `pnpm run db:migrate` | 运行 Prisma 迁移 |
| `pnpm run ch:reset` | 重置 ClickHouse 数据库 |
| `pnpm run dx` | 完整重置开发环境（破坏性） |

---

## 相关文件路径

- Prisma Schema: `packages/shared/prisma/schema.prisma`
- Prisma 迁移: `packages/shared/prisma/migrations/`
- ClickHouse 迁移: `packages/shared/clickhouse/migrations/unclustered/`
- 队列定义: `packages/shared/src/server/queues.ts`
- Redis 工具: `packages/shared/src/server/redis/`
