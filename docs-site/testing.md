# 测试体系

Langfuse 使用 **Vitest** 作为单元/集成测试框架，**Playwright** 作为 E2E 测试框架。

## 测试类型

### Server Tests（`web/src/__tests__/server/`）

Server Tests 验证后端逻辑，包括 tRPC 路由、REST API 和数据库 Repository 层。

- **`*.servertest.ts`** — 集成测试，需要完整的数据库环境（Postgres + ClickHouse bootstrap）
- **`repositories/*.servertest.ts`** — Repository 层单元测试

### Client Tests（`web/src/**/*.clienttest.ts(x)`）

Client Tests 使用 Vitest 验证 React 组件和工具函数。

- 组件逻辑测试
- 工具函数测试
- 纯前端业务逻辑测试

### E2E Tests（`web/src/__e2e__/`）

E2E Tests 使用 Playwright 进行浏览器端到端测试。

- 认证流程 (`auth.spec.ts`)
- 项目创建流程 (`create-project.spec.ts`)
- API 集成测试 (`api.servertest.ts`)

### Worker Tests（`worker/src/__tests__/`）

Worker Tests 验证后台任务处理逻辑。

- **`*.test.ts`** — 通用单元测试
- **`queues/__tests__/*.test.ts`** — 队列处理器专项测试

### Shared Tests

- **Vitest Workspace** — 根目录 `vitest.workspace.ts` 配置了 monorepo 的测试工作区：

```typescript
export default ["web", "worker"];
```

## 测试命令

### 开发环境

```bash
pnpm run dev:web      # 启动 Web 开发服务器
pnpm run dev:worker   # 启动 Worker 开发服务器
```

### 运行测试

```bash
pnpm run test         # 运行所有测试（turbo run test）
pnpm test web         # Web 测试（server + client + in-source）
pnpm test worker      # Worker 测试
```

### Web 测试详情

```bash
pnpm --filter web run test                    # Server + in-source 测试
pnpm --filter web run test:in-source          # 仅 in-source 测试
pnpm --filter web run test-client             # 仅 client 测试
pnpm --filter web run test:watch              # 监听模式运行测试
```

### Playwright E2E 测试

```bash
pnpm run playwright:install   # 安装 Chromium 浏览器
pnpm run test:e2e            # 运行 E2E 测试
```

## 测试文件示例

### Server Test

```typescript
// web/src/__tests__/server/observations-api-v2.servertest.ts
import { test, expect } from "vitest";
import { createCaller } from "../test-utils";

test("should fetch observations", async () => {
  const caller = await createCaller();
  const result = await caller.observations.list({ projectId: "test-project" });
  expect(result).toBeDefined();
});
```

### Client Test

```typescript
// web/src/utils/chatml.test.clienttest.ts
import { test, expect } from "vitest";
import { compileChatMessages } from "../chatml/utils";

test("compileChatMessages handles empty input", () => {
  expect(compileChatMessages([])).toBe("");
});
```

### Worker Test

```typescript
// worker/src/__tests__/evalService.test.ts
import { test, expect } from "vitest";

test("evalService processes evaluation jobs", async () => {
  // test implementation
});
```

## 注意事项

- Server Tests 依赖数据库环境，确保运行前已启动 Postgres 和 ClickHouse
- Client Tests 为纯前端测试，不需要后端依赖
- E2E 测试需要先安装 Playwright 浏览器：`pnpm run playwright:install`
- Worker Tests 可独立运行，验证队列处理逻辑
