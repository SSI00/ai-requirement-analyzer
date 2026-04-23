# AI需求分析系统 (MVP版本)

> 将用户模糊、跳跃、隐含的真实需求，转化为结构化、可执行、可验证的产品需求

## 系统架构

基于设计方案的四层漏斗模型，MVP版本实现了核心三层：

```
┌─────────────────────────────────────────────┐
│  Layer 2: 需求理解层 (感知)                    │
│   - 意图识别 + 实体抽取 + 隐含挖掘 + 模糊检测   │
├─────────────────────────────────────────────┤
│  Layer 3: 需求分析层 (认知)                    │
│   - 需求拆解 + 矛盾检测 + 优先级排序            │
├─────────────────────────────────────────────┤
│  Layer 4: 需求输出层 (表达)                    │
│   - 用户故事 + 验收标准 + 澄清问题 + 风险清单    │
└─────────────────────────────────────────────┘
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite |
| 后端 | Python + FastAPI |
| AI引擎 | OpenAI GPT-4o-mini |
| 通信 | REST API + CORS |

## 快速开始

### 1. 环境准备

- Python 3.9+
- Node.js 18+
- OpenAI API Key

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
# 编辑 .env，填入您的 OpenAI API Key
```

### 3. 启动服务

**方式一：一键启动（Windows）**
```bash
start.bat
```

**方式二：分别启动**

终端1 - 启动后端：
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

终端2 - 启动前端：
```bash
cd frontend
npm install
npm run dev
```

### 4. 访问系统

- 前端界面: http://localhost:5173
- API文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/api/v1/requirements/health

## API接口

### 需求分析

```http
POST /api/v1/requirements/analyze
Content-Type: application/json

{
  "input_data": {
    "content": "我想要一个电商平台的秒杀功能...",
    "project_context": "B2C电商平台，日活用户约10万"
  }
}
```

### 响应结构

```json
{
  "requirement_id": "abc123",
  "status": "success",
  "understanding": {
    "intent": { "type": "功能请求", "confidence": "高", ... },
    "entities": [...],
    "implied_requirements": [...],
    "fuzzy_points": [...]
  },
  "analysis": {
    "sub_requirements": [...],
    "conflicts": [...],
    "priorities": [...]
  },
  "output": {
    "user_stories": [...],
    "acceptance_criteria": [...],
    "clarification_questions": [...],
    "technical_suggestions": [...],
    "risk_list": [...]
  },
  "processing_time_ms": 5000
}
```

## 功能清单

### 已实现 ✅

| 功能 | 说明 |
|------|------|
| 文本需求输入 | 支持自然语言描述需求 |
| 项目上下文 | 可选添加项目背景信息 |
| 意图识别 | 6种意图类型分类 |
| 实体抽取 | 功能/业务/角色/指标/时间/竞品实体 |
| 隐含需求挖掘 | 基于领域知识推导未明确需求 |
| 模糊点检测 | 识别模糊表述并生成澄清问题 |
| 需求拆解 | 按功能/非功能/业务规则拆解 |
| 矛盾检测 | 5种矛盾类型识别 |
| 优先级排序 | MoSCoW分类 + 加权评分 |
| 用户故事生成 | 标准用户故事格式 |
| 验收标准 | Given-When-Then格式 |
| 技术建议 | 技术风险与缓解方案 |
| 风险清单 | 概率/影响/应对策略 |

### 未实现 ❌ (Phase 2+)

- 语音/图像输入
- 多模态解析
- 完整PRD生成
- Jira/飞书集成
- 需求演化追踪
- 知识库RAG
- 多语言对齐

## 项目结构

```
ai-requirement-analyzer/
├── backend/
│   ├── app/
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── prompts/        # AI Prompt模板
│   │   ├── routers/        # API路由
│   │   ├── services/       # 业务服务
│   │   └── main.py         # 应用入口
│   ├── tests/              # 测试用例
│   ├── requirements.txt    # Python依赖
│   └── .env.example        # 环境变量模板
├── frontend/
│   ├── src/
│   │   ├── components/     # UI组件
│   │   ├── services/       # API服务
│   │   ├── App.jsx         # 主应用
│   │   └── index.css       # 样式
│   ├── package.json        # Node依赖
│   └── index.html
├── docs/                   # 文档
├── logs/                   # 项目日志
└── README.md
```

## 参考文档

本系统基于 [AI需求分析系统设计方案](file:///C:/Users/西柠/Downloads/AI需求分析系统设计方案.md) 构建。
