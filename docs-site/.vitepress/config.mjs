import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Langfuse Design",
  description: "Langfuse LLM 工程平台架构设计文档站",
  lang: "zh-CN",
  base: "/langfuse-design/",
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  ],
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "首页", link: "/" },
      { text: "架构", link: "/architecture" },
      { text: "核心模块", link: "/core-modules" },
      { text: "数据库", link: "/database" },
      { text: "队列", link: "/queues" },
      { text: "API", link: "/api" },
      { text: "SDK", link: "/sdk" },
      { text: "测试", link: "/testing" },
      { text: "部署", link: "/deployment" },
    ],
    sidebar: [
      {
        text: "文档",
        items: [
          { text: "首页", link: "/" },
          { text: "整体架构", link: "/architecture" },
          { text: "核心模块", link: "/core-modules" },
          { text: "数据库层", link: "/database" },
          { text: "队列系统", link: "/queues" },
          { text: "API 层", link: "/api" },
          { text: "SDK", link: "/sdk" },
          { text: "测试体系", link: "/testing" },
          { text: "部署指南", link: "/deployment" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/YeLuo45/langfuse-design" },
    ],
    footer: {
      message: "基于 Langfuse 开源项目构建",
      copyright: "Copyright © 2025-present Langfuse Contributors",
    },
  },
});
