# Langfuse Design

> Langfuse LLM 工程平台架构设计文档站

## 项目简介

Langfuse 是一个开源的 LLM 工程平台，帮助团队协作开发、监控、评估和调试 AI 应用。支持自托管和云端部署。

**核心功能**：LLM 追踪、Prompt 管理、评估、数据集、Playground、REST API

## 文档结构

- [整体架构](./docs-site/architecture.md) — Next.js + Worker 双容器、Postgres + ClickHouse 双存储
- [核心模块](./docs-site/core-modules.md) — web/worker/shared 三层架构
- [数据库层](./docs-site/database.md) — Prisma + ClickHouse，事务与分析分离
- [队列系统](./docs-site/queues.md) — BullMQ + Redis，多消费者并发
- [API 层](./docs-site/api.md) — tRPC 内部 API + Public REST API + Fern OpenAPI
- [SDK](./docs-site/sdk.md) — Python + JS/TS SDK
- [测试体系](./docs-site/testing.md) — Vitest + Playwright
- [部署指南](./docs-site/deployment.md) — Docker Compose / Kubernetes / Cloud

## 在线访问

https://yeluo45.github.io/langfuse-design/

## 技术栈

- VitePress — 文档渲染
- GitHub Actions — 自动构建部署
- GitHub Pages — 托管
