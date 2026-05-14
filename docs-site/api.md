# Langfuse API 架构

Langfuse 采用三层 API 架构，分别为内部 tRPC API、Public REST API 和 Fern API 定义层。

---

## 1. tRPC 内部 API

**路径**: `web/src/server/api/`

### 路由注册中心

**文件**: `root.ts`

所有 tRPC 路由在此统一注册，是整个内部 API 的入口：

```typescript
export const appRouter = createTRPCRouter({
  annotationQueues: queueRouter,
  traces: traceRouter,
  sessions: sessionRouter,
  generations: generationsRouter,
  events: eventsRouter,
  scores: scoresRouter,
  scoreAnalytics: scoreAnalyticsRouter,
  projects: projectsRouter,
  datasets: datasetRouter,
  observations: observationsRouter,
  prompts: promptRouter,
  models: modelRouter,
  evals: evalRouter,
  // ... 更多路由
});
```

### 主要路由模块

| 路由 | 路径 | 功能 |
|------|------|------|
| `traces` | `web/src/server/api/routers/traces.ts` | Trace 管理 |
| `sessions` | `web/src/server/api/routers/Sessions.ts` | 会话管理 |
| `generations` | `web/src/server/api/routers/generations.ts` | 生成记录 |
| `events` | `src/features/events/server/eventsRouter.ts` | 事件处理 |
| `scores` | `web/src/server/api/routers/scores.ts` | 评分管理 |
| `observations` | `web/src/server/api/routers/observations.ts` | 观察记录 |
| `prompts` | `src/features/prompts/server/routers/promptRouter.ts` | Prompt 管理 |
| `datasets` | `src/features/datasets/server/dataset-router.ts` | 数据集管理 |
| `evals` | `src/features/evals/server/router.ts` | 评估任务 |
| `projects` | `src/features/projects/server/projectsRouter.ts` | 项目管理 |
| `models` | `web/src/server/api/routers/models.ts` | 模型配置 |
| `scoreConfigs` | `web/src/server/api/routers/scoreConfigs.ts` | 评分配置 |

### 上下文和错误处理

**文件**: `trpc.ts`

关键组件：

- **上下文创建**: `createTRPCContext` — 构建请求上下文，包含 session 和 headers
- **认证程序**: 
  - `publicProcedure` — 公开访问
  - `authenticatedProcedure` — 需要登录
  - `protectedProjectProcedure` — 需要项目成员资格
  - `protectedOrganizationProcedure` — 需要组织成员资格
- **错误处理**: 全局错误中间件，统一处理 ZodError、ClickHouseResourceError 等
- **OpenTelemetry**: 集成分布式追踪

### 用途

Web UI 与后端之间的通信，TypeScript 类型安全调用。

---

## 2. Public REST API

**路径**: `web/src/pages/api/public/`

### 端点列表

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/public/ingestion` | POST | 数据摄取（Trace、Generation、Event 等） |
| `/api/public/projects` | GET | 项目列表 |
| `/api/public/scores` | GET/POST | 评分管理 |
| `/api/public/observations` | GET | 观察记录查询 |
| `/api/public/prompts` | GET/POST | Prompt 管理 |
| `/api/public/datasets` | GET/POST | 数据集管理 |
| `/api/public/dataset-items` | GET/POST | 数据集项管理 |
| `/api/public/models` | GET/POST | 模型配置 |
| `/api/public/comments` | GET/POST | 评论功能 |
| `/api/public/score-configs` | GET/POST | 评分配置 |
| `/api/public/health` | GET | 健康检查 |
| `/api/public/ready` | GET | 就绪检查 |
| `/api/public/media` | GET/POST | 媒体文件 |
| `/api/public/evals` | POST | 评估任务触发 |
| `/api/public/v2/*` | 多种 | V2 版本 API |

### 不稳定端点（Unstable）

**路径**: `web/src/pages/api/public/unstable/`

| 端点 | 功能 |
|------|------|
| `/api/public/unstable/evaluators` | 评估器管理 |
| `/api/public/unstable/evaluation-rules` | 评估规则管理 |

### 类型定义

**路径**: `src/features/public-api/types/*`

Public API 使用严格类型定义：

- 请求类型（Request）
- 响应类型（Response）
- Zod 验证 Schema

### 中间件

**文件**: `src/features/public-api/server/withMiddlewares.ts`

提供统一的中间件处理：

- 认证（Basic Auth / API Key）
- 请求验证
- 错误处理
- 日志记录

### 认证方式

Public REST API 使用 Basic Auth：

- Username: Langfuse Public Key
- Password: Langfuse Secret Key

### 测试

Server integration tests 位于 `web/src/__tests__/server/` 目录：

- `ingestion-api.servertest.ts` — 摄取 API 测试
- `prompts.v1.servertest.ts` — V1 Prompt API 测试
- `prompts.v2.servertest.ts` — V2 Prompt API 测试

---

## 3. Fern API 定义

**路径**: `fern/apis/`

### 目录结构

```
fern/apis/
├── server/                    # Server API 定义
│   ├── definition/
│   │   ├── api.yml           # 主 API 配置
│   │   ├── ingestion.yml     # 摄取端点
│   │   ├── trace.yml         # Trace 端点
│   │   ├── observations.yml  # 观察端点
│   │   ├── scores.yml        # 评分端点
│   │   ├── prompts.yml       # Prompt 端点
│   │   ├── datasets.yml      # 数据集端点
│   │   ├── models.yml        # 模型端点
│   │   ├── projects.yml      # 项目端点
│   │   ├── organizations.yml  # 组织端点
│   │   ├── health.yml        # 健康检查
│   │   ├── media.yml         # 媒体文件
│   │   ├── comments.yml      # 评论
│   │   ├── score-configs.yml # 评分配置
│   │   ├── sessions.yml      # 会话
│   │   ├── commons.yml       # 公共类型
│   │   ├── utils/pagination.yml  # 分页工具
│   │   ├── unstable/         # 不稳定端点
│   │   └── legacy/           # 遗留 API
│   └── generators.yml
├── client/                    # Client API 定义
│   ├── definition/
│   └── generators.yml
└── organizations/             # 组织 API 定义
```

### OpenAPI 规范生成

Fern 定义文件用于生成 OpenAPI 规范：

- `web/public/generated/api/openapi.yml` — Server API
- `web/public/generated/api-client/openapi.yml` — Client API
- `web/public/generated/organizations-api/openapi.yml` — Organizations API

### 重要规则

> **注意**: `generated/` 目录下的文件为自动生成，**永不手动编辑**。

如需修改 API 契约：

1. 编辑 `fern/apis/` 下的源定义文件
2. 重新生成输出
3. 更新 SDK

---

## SDK

Langfuse 提供官方 SDK 支持：

| 语言 | 包名 | 安装 |
|------|------|------|
| Python | `langfuse` | `pip install langfuse` |
| JavaScript/TypeScript | `langfuse` | `npm install langfuse` |

### Python SDK

```python
from langfuse import Langfuse

langfuse = Langfuse(
    public_key="your-public-key",
    secret_key="your-secret-key",
    host="https://cloud.langfuse.com"  # 可选，自托管地址
)

# 追踪
langfuse.trace(
    name="my-trace",
    input={"query": "hello"},
    output={"response": "world"}
)
```

### JavaScript/TypeScript SDK

```typescript
import Langfuse from "langfuse";

const langfuse = new Langfuse({
  publicKey: "your-public-key",
  secretKey: "your-secret-key",
  baseUrl: "https://cloud.langfuse.com" // 可选
});

// 追踪
langfuse.trace({
  name: "my-trace",
  input: { query: "hello" },
  output: { response: "world" }
});
```

---

## API 端点示例

### 数据摄取

```http
POST /api/public/ingestion
Authorization: Basic <base64(public_key:secret_key)>
Content-Type: application/json

{
  "batch": [
    {
      "id": "event-123",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "type": "trace-create",
      "body": {
        "id": "trace-456",
        "input": {"query": "hello"},
        "output": {"response": "world"}
      }
    }
  ]
}
```

### 项目列表

```http
GET /api/public/projects
Authorization: Basic <base64(public_key:secret_key)>
```

### 评估任务

```http
POST /api/public/evals
Authorization: Basic <base64(public_key:secret_key)>
Content-Type: application/json

{
  "projectId": "project-123",
  "datasetId": "dataset-456",
  "model": "gpt-4"
}
```

---

## 参考链接

- [Fern API 文档](https://buildwithfern.com/docs)
- [Langfuse SDK 文档](https://langfuse.com/docs/sdk)
- [OpenAPI 规范](https://cloud.langfuse.com/generated/api/openapi.yml)
