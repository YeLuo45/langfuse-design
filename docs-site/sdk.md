# Langfuse SDK

Langfuse 提供多种语言的 SDK，支持 Python 和 JavaScript/TypeScript 两大生态，方便开发者将 LLM 应用与 Langfuse 平台集成。

---

## Python SDK

**PyPI 包名**: `langfuse`  
**安装命令**:

```bash
pip install langfuse
```

### 核心功能

- **LLM 调用追踪**：通过装饰器（`@observe()`）或上下文管理器轻松追踪任意 Python LLM 应用
- **Prompt 管理**：支持在代码中管理和版本化 Prompts
- **数据集和评估**：内置数据集管理及评估功能
- **用户反馈**：支持将用户反馈数据接入平台

### 快速开始

```python
from langfuse import Langfuse

langfuse = Langfuse()
langfuse.trace(name="my-chatgpt-call")
```

---

## JavaScript/TypeScript SDK

**npm 包名**: `langfuse`  
**安装命令**:

```bash
npm install langfuse
```

### 核心功能

- **前端集成（Web）**：专为 Web 前端场景设计，可追踪浏览器端的 LLM 调用
- **LLM 调用自动追踪**：自动捕获通过支持的 SDK 发起的 LLM 请求
- **回调机制**：提供灵活的回调函数扩展点，支持自定义行为

---

## SDK 集成方式

Langfuse 提供两种集成模式：

### 1. Instrumentation（自动追踪）

通过仪表化（Instrumentation）自动捕获 LLM 调用。Langfuse 为多种主流 LLM SDK 提供**开箱即用的自动集成**，无需修改业务代码，只需替换对应的 SDK 包即可完成接入。

### 2. Manual SDK（手动调用）

通过 Langfuse SDK 手动调用，实现更精细化的控制。使用装饰器或上下文管理器自行管理追踪生命周期，适合需要自定义追踪逻辑的场景。

---

## 支持的 LLM 提供商

Langfuse SDK 支持主流的 LLM 提供商，包括但不限于：

- **OpenAI**
- **Anthropic**
- **Google AI**（Gemini 等）
- **Azure OpenAI**
- **Cohere**
- **Mistral**
- **其他兼容 OpenAI 接口的 LLM 提供商**

---

## 进一步阅读

- [Python SDK 文档](https://langfuse.com/docs/sdk/python)
- [JavaScript/TypeScript SDK 文档](https://langfuse.com/docs/sdk)
- [@observe() 装饰器指南](https://langfuse.com/docs/sdk/python/decorators)
- [OpenAI 集成](https://langfuse.com/integrations/model-providers/openai-py)
