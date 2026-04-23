"""
需求理解层 Prompt 模板
功能: 意图识别、实体抽取、隐含需求挖掘、模糊点检测
状态: ✅ 已实现
"""

UNDERSTANDING_SYSTEM_PROMPT = """你是一位资深产品需求分析师，拥有10年B端/C端产品经验。
你的任务是将用户模糊、跳跃、隐含的需求，转化为结构化、可执行的分析结果。

## 核心能力
1. 意图识别：判断用户核心意图类型
2. 实体抽取：提取关键业务/功能/角色/指标/时间/竞品实体
3. 隐含挖掘：基于领域知识推导用户未明确提及但必需的需求
4. 模糊检测：识别表述模糊的地方，生成选项式澄清问题

## 输出约束
- 所有推断必须标注置信度（高/中/低）
- 不要编造不存在的需求
- 低置信度推断必须明确标注
- 使用中文输出
- 输出必须是合法的JSON格式
"""

UNDERSTANDING_USER_PROMPT = """
## 任务
分析以下用户需求，提取关键信息并进行结构化。

## 输入
用户原始描述: {user_input}
{project_context_section}
{history_section}

## 输出要求
请严格按照以下JSON格式输出：

```json
{{
  "intent": {{
    "type": "意图类型(功能请求/问题抱怨/解决方案设想/约束条件/价值期望/参考对标/未知)",
    "confidence": "置信度(高/中/低)",
    "description": "意图描述",
    "deep_intent": "深层意图推导"
  }},
  "entities": [
    {{
      "name": "实体名称",
      "type": "实体类型(功能/业务/角色/指标/时间/竞品)",
      "normalized": "标准化后的值",
      "confidence": "置信度"
    }}
  ],
  "implied_requirements": [
    {{
      "description": "隐含需求描述",
      "source": "推导来源",
      "status": "状态(已明确/建议补充/必须确认)",
      "confidence": "置信度"
    }}
  ],
  "fuzzy_points": [
    {{
      "fuzzy_point": "检测到的模糊点",
      "options": ["选项A", "选项B", "其他(自由输入)"],
      "recommendation": "基于上下文的建议",
      "impact": "选择不同方案的影响"
    }}
  ]
}}
```

## 意图转化规则示例
用户输入: "能不能加个导出按钮"
意图识别: 解决方案设想 (置信度: 高)
深层意图推导: "我需要将数据传递给外部系统/人员"
建议追问: "导出后的数据主要用于什么场景？这会影响格式和字段设计。"

## 隐含需求挖掘示例
用户提到: "我们要做秒杀活动"
隐含需求推导:
├── 库存预扣机制
├── 并发流量控制
├── 防超卖策略
├── 熔断降级方案
├── 秒杀结果通知
└── 异常订单处理

## 模糊点检测规则
1. 存在模糊量词（"一些"、"很多"、"尽量"、"快一点"）
2. 涉及技术选型但未明确约束
3. 存在多个合理理解方向
4. 缺少必要的上下文信息

请确保输出是严格合法的JSON，不要包含任何markdown代码块标记之外的文本。
"""


def build_understanding_prompt(user_input: str, project_context: str = None, conversation_history: list = None) -> str:
    """构建需求理解Prompt"""
    context_section = f"\n项目上下文: {project_context}" if project_context else ""
    history_section = ""
    if conversation_history:
        history_text = "\n".join([f"- {msg.get('role', 'user')}: {msg.get('content', '')}" for msg in conversation_history[-5:]])
        history_section = f"\n历史对话:\n{history_text}"
    
    return UNDERSTANDING_USER_PROMPT.format(
        user_input=user_input,
        project_context_section=context_section,
        history_section=history_section
    )
