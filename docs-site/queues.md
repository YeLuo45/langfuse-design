# Langfuse 队列系统

Langfuse 使用 **BullMQ + Redis** 实现后台任务处理，用于解耦耗时操作、提升系统响应能力。

## 队列架构

| 队列名称 | 用途 | 分片 |
|---------|------|------|
| `ingestion-queue` | 处理 trace/observation 数据摄取 | 支持多分片 |
| `secondary-ingestion-queue` | 高吞吐项目的摄取处理 | 支持多分片 |
| `otel-ingestion-queue` | OpenTelemetry 格式数据摄取 | 支持多分片 |
| `secondary-otel-ingestion-queue` | 高吞吐 OTel 项目专用 | 支持多分片 |
| `evaluation-execution-queue` | 执行评估任务 | 支持多分片 |
| `secondary-evaluation-execution-queue` | 高评估量项目专用 | 支持多分片 |
| `llm-as-a-judge-execution-queue` | LLM-as-a-Judge 观察级评估 | 支持多分片 |
| `trace-upsert-queue` | Trace 写入事件处理 | 支持多分片 |
| `create-eval-queue` | 评估任务创建 | - |
| `dataset-run-item-upsert-queue` | 数据集运行项更新 | - |
| `batch-export-queue` | 数据导出任务 | - |
| `batch-action-queue` | 批量操作处理 | - |
| `trace-delete-queue` | Trace 删除 | - |
| `score-delete-queue` | 分数删除 | - |
| `dataset-delete-queue` | 数据集删除 | - |
| `project-delete-queue` | 项目删除 | - |
| `experiment-create-queue` | 实验创建 | - |
| `data-retention-queue` | 数据保留策略 | - |
| `data-retention-processing-queue` | 数据保留处理 | - |
| `webhook-queue` | Webhook 投递 | - |
| `entity-change-queue` | 实体变更事件 | - |
| `event-propagation-queue` | 事件传播 | - |
| `notification-queue` | 通知投递 | - |
| `posthog-integration-queue` | PostHog 集成 | - |
| `mixpanel-integration-queue` | Mixpanel 集成 | - |
| `blobstorage-integration-queue` | Blob 存储集成 | - |
| `cloud-spend-alert-queue` | 云支出告警 | - |
| `cloud-usage-metering-queue` | 云用量计量 | - |
| `cloud-free-tier-usage-threshold-queue` | 免费层用量阈值 | - |
| `dead-letter-retry-queue` | 失败任务重试 | - |

## 核心组件

### Worker 层

**`worker/src/queues/workerManager.ts`**
- Worker 注册和生命周期管理
- 提供 `WorkerManager.register()` 方法注册消费者
- 统一的错误处理和指标收集
- 支持 worker 级别的并发控制和限流

**`worker/src/app.ts`**
- Worker 启动入口
- 所有队列消费者的注册点
- 通过环境变量开关控制各队列的启用/禁用
- 配置并发数、限流参数、锁策略等

### 并发控制

```typescript
// 环境变量控制示例
WorkerManager.register(QueueName.CreateEvalQueue, processor, {
  concurrency: env.LANGFUSE_EVAL_CREATOR_WORKER_CONCURRENCY,
  limiter: {
    max: env.LANGFUSE_EVAL_CREATOR_WORKER_CONCURRENCY,
    duration: env.LANGFUSE_EVAL_CREATOR_LIMITER_DURATION,
  },
});
```

**常用环境变量：**

| 环境变量 | 用途 |
|---------|------|
| `LANGFUSE_INGESTION_QUEUE_PROCESSING_CONCURRENCY` | 摄取队列并发数 |
| `LANGFUSE_EVAL_EXECUTION_WORKER_CONCURRENCY` | 评估执行并发数 |
| `LANGFUSE_TRACE_DELETE_CONCURRENCY` | Trace 删除并发数 |
| `LANGFUSE_EVAL_CREATOR_WORKER_CONCURRENCY` | 评估创建并发数 |

**限流器（BullMQ 内置 limiter）：**
- 用于全局速率控制
- 按时间窗口限制最大处理 job 数
- 避免下游服务过载

### 队列契约（shared 包）

**`packages/shared/src/server/queues.ts`**
- 所有队列 payload 的 Zod schemas
- `QueueName` 枚举：所有队列名称定义
- `QueueJobs` 枚举：队列任务类型
- `TQueueJobTypes`：完整的类型映射

```typescript
// 示例：定义新的队列 payload schema
export const MyEventSchema = z.object({
  projectId: z.string(),
  data: z.string(),
});

export enum QueueName {
  MyQueue = "my-queue",
}

export enum QueueJobs {
  MyJob = "my-job",
}
```

**`packages/shared/src/server/redis/`**
- Redis 队列辅助函数目录
- `getQueue.ts`：非分片队列的工厂函数
- `{queueName}.ts`：各队列的 BullMQ Queue 实例封装
- `sharding.ts`：分片策略（基于 hash 的consistent hashing）
- `redis.ts`：Redis 连接配置和重试选项

## 分片机制

对于高吞吐队列（如摄取、评估执行），Langfuse 支持 Redis 分片：

```typescript
// 获取所有分片名称
IngestionQueue.getShardNames(); // ["ingestion-queue", "ingestion-queue-1", ...]

// 按 shardingKey 获取实例
IngestionQueue.getInstance({
  shardingKey: `${projectId}-${eventBodyId}`,
});
```

**分片配置环境变量：**

| 环境变量 | 用途 |
|---------|------|
| `LANGFUSE_INGESTION_QUEUE_SHARD_COUNT` | 摄取队列分片数 |
| `LANGFUSE_INGESTION_SECONDARY_QUEUE_SHARD_COUNT` | 二级摄取队列分片数 |
| `REDIS_CLUSTER_ENABLED` | 是否启用 Redis Cluster 模式 |

## 添加新队列流程

### 1. 在 `queues.ts` 定义 payload schema

```typescript
// packages/shared/src/server/queues.ts

export const MyEventSchema = z.object({
  projectId: z.string(),
  payload: z.string(),
});

export enum QueueName {
  MyQueue = "my-queue",
}

export enum QueueJobs {
  MyJob = "my-job",
}
```

### 2. 在 shared 包添加队列辅助函数

```typescript
// packages/shared/src/server/redis/myQueue.ts
import { Queue } from "bullmq";
import { QueueName, TQueueJobTypes } from "../queues";
import { createNewRedisInstance, redisQueueRetryOptions, getQueuePrefix } from "./redis";
import { logger } from "../logger";

export class MyQueue {
  private static instance: Queue<TQueueJobTypes[QueueName.MyQueue]> | null = null;

  public static getInstance(): Queue<TQueueJobTypes[QueueName.MyQueue]> | null {
    if (!MyQueue.instance) {
      const redis = createNewRedisInstance(redisQueueRetryOptions);
      if (!redis) return null;

      MyQueue.instance = new Queue(QueueName.MyQueue, {
        connection: redis,
        prefix: getQueuePrefix(QueueName.MyQueue),
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: 100_000,
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
        },
      });

      MyQueue.instance.on("error", (err) => {
        logger.error("MyQueue error", err);
      });
    }
    return MyQueue.instance;
  }
}
```

### 3. 在 web 中添加生产者（enqueue）

```typescript
// web/src/features/myFeature/myQueue.ts
import { MyQueue } from "@langfuse/shared/src/server";

export const enqueueMyJob = async (payload: MyEventPayload) => {
  const queue = MyQueue.getInstance();
  await queue?.add(QueueJobs.MyJob, payload, {
    jobId: `my-${payload.projectId}-${Date.now()}`,
  });
};
```

### 4. 在 worker 中添加消费者（processor）

```typescript
// worker/src/queues/myQueue.ts
import { Job } from "bullmq";
import { MyEventSchema, QueueName } from "@langfuse/shared/src/server";

export const myQueueProcessor = async (job: Job) => {
  const payload = MyEventSchema.parse(job.data);
  // 处理逻辑
  console.log(`Processing job ${job.id} for project ${payload.projectId}`);
};
```

### 5. 在 `app.ts` 中注册

```typescript
// worker/src/app.ts
import { myQueueProcessor } from "./queues/myQueue";

if (env.QUEUE_CONSUMER_MY_QUEUE_IS_ENABLED === "true") {
  WorkerManager.register(QueueName.MyQueue, myQueueProcessor, {
    concurrency: env.LANGFUSE_MY_QUEUE_CONCURRENCY,
    limiter: {
      max: env.LANGFUSE_MY_QUEUE_CONCURRENCY,
      duration: 10_000,
    },
  });
}
```

## 关键设计原则

1. **队列契约统一在 shared 包**
   - 所有 payload schema 只在一处定义
   - web 和 worker 共享同一份类型定义
   - 确保生产者和消费者契约一致

2. **Worker 支持多消费者并发**
   - 通过 `concurrency` 参数控制并行处理的 job 数
   - 每个 worker 是独立的 Redis 连接
   - 支持按队列独立扩缩容

3. **队列名通过环境变量配置分片**
   - 高吞吐场景可水平扩展
   - 分片数通过环境变量配置
   - 与 Redis Cluster 配合实现高可用

4. **限流保护下游服务**
   - BullMQ 内置 limiter 实现全局速率限制
   - 避免压垮数据库或外部 API

5. **重试和死信处理**
   - 指数退避重试策略
   - 失败次数超限进入 dead letter queue
   - `dead-letter-retry-queue` 处理恢复

## 监控指标

WorkerManager 自动收集以下指标：

| 指标 | 说明 |
|------|------|
| `{queue}.request` | 请求计数 |
| `{queue}.wait_time` | 任务等待时间 |
| `{queue}.processing_time` | 任务处理时间 |
| `{queue}.length` | 队列长度 |
| `{queue}.active` | 活跃任务数 |
| `{queue}.failed` | 失败任务数 |
| `{queue}.dlq_length` | 死信队列长度 |
| `{queue}.error` | 错误计数 |
