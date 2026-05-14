---
layout: home

hero:
  name: "Langfuse Design"
  text: "LLM 工程平台架构文档"
  tagline: "基于 Langfuse 开源项目源码架构设计"
  actions:
    - theme: brand
      text: 架构分析
      link: /architecture
    - theme: brand
      text: 核心模块
      link: /core-modules

features:
  - icon: 🏗️
    title: 整体架构
    details: Next.js + Worker 双容器、Postgres + ClickHouse 双存储、Redis 队列
    link: /architecture
    linkText: 查看
  - icon: 📦
    title: 核心模块
    details: web/worker/shared 三层架构，依赖边界清晰
    link: /core-modules
    linkText: 查看
  - icon: 🔗
    title: 数据库层
    details: Prisma + ClickHouse，事务与分析分离
    link: /database
    linkText: 查看
  - icon: 🔄
    title: 队列系统
    details: BullMQ + Redis，多消费者并发处理
    link: /queues
    linkText: 查看
  - icon: 🌐
    title: API 层
    details: tRPC 内部 API + Public REST API + Fern OpenAPI
    link: /api
    linkText: 查看
  - icon: 🧪
    title: 测试体系
    details: Vitest + Playwright，server/client/e2e 三层覆盖
    link: /testing
    linkText: 查看
  - icon: 🚀
    title: 部署指南
    details: Docker Compose / Kubernetes / Cloud
    link: /deployment
    linkText: 查看
---

# Langfuse 简介

Langfuse 是一个开源的 LLM 工程平台，帮助团队协作开发、监控、评估和调试 AI 应用。

## 核心功能

- **LLM Application Observability** — 追踪 LLM 调用、retrieval、embedding、agent actions
- **Prompt Management** — 集中管理、版本控制、协作迭代 prompts
- **Evaluations** — LLM-as-a-judge、用户反馈、人工标注、自定义评估管道
- **Datasets** — 测试集和基准测试，支持预部署测试和结构化实验
- **LLM Playground** — 测试和迭代 prompts，缩短反馈循环
- **Comprehensive API** — REST API + tRPC + Python/JS SDK

## 技术栈

- **Monorepo**: pnpm + Turbo
- **Web**: Next.js + tRPC + React + Tailwind + Shadcn/ui
- **Worker**: Express + BullMQ
- **Database**: Postgres (Prisma) + ClickHouse
- **Queue**: Redis + BullMQ
- **Storage**: S3 compatible
- **Observability**: OpenTelemetry

## 安装

```bash
pnpm install
pnpm run dev
```
