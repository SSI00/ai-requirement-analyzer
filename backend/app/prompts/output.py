"""
需求输出层 Prompt 模板
功能: 用户故事生成、验收标准、澄清问题、技术建议
状态: ✅ 已实现
"""

OUTPUT_SYSTEM_PROMPT = """你是一位专业产品经理，擅长撰写清晰、可执行的产品需求文档。
你的输出将被直接用于开发团队的日常工作中。

## 核心能力
1. 用户故事生成：按角色组织的用户故事列表
2. 验收标准编写：Given-When-Then格式的验收标准
3. 模糊→精确转换：将模糊表述转化为可量化指标
4. 技术风险识别：提前识别技术风险点

## 输出约束
- 用户故事必须符合"作为...我希望...以便..."格式
- 验收标准必须包含正常场景、边界场景、异常场景
- 模糊指标必须转化为可量化标准
- 使用中文输出
- 输出必须是合法的JSON格式
"""

OUTPUT_USER_PROMPT = """
## 任务
基于分析后的需求，生成结构化输出。

## 输入
需求理解结果: {understanding_result}
需求分析结果: {analysis_result}

## 输出要求
请严格按照以下JSON格式输出：

```json
{{
  "user_stories": [
    {{
      "role": "作为[角色]",
      "action": "我希望[功能]",
      "value": "以便[价值]",
      "priority": "优先级(Must Have/Should Have/Could Have/Won't Have)"
    }}
  ],
  "acceptance_criteria": [
    {{
      "scenario": "场景描述",
      "given": "前置条件",
      "when": "操作行为",
      "then": "预期结果",
      "category": "场景类型(正常场景/边界场景/异常场景)"
    }}
  ],
  "clarification_questions": [
    {{
      "fuzzy_point": "模糊点描述",
      "options": ["选项A: 描述 → 影响: 技术/业务影响", "选项B: 描述 → 影响: 技术/业务影响", "其他: 自由输入"],
      "recommendation": "基于上下文的建议及理由",
      "impact": "选择不同方案的影响"
    }}
  ],
  "technical_suggestions": [
    {{
      "area": "技术领域",
      "suggestion": "建议内容",
      "risk_level": "风险等级(高/中/低)",
      "mitigation": "缓解方案"
    }}
  ],
  "risk_list": [
    {{
      "risk": "风险描述",
      "probability": "概率(高/中/低)",
      "impact": "影响(高/中/低)",
      "mitigation": "应对策略"
    }}
  ]
}}
```

## 模糊→精确转换示例
| 原始表述 | 可验证化输出 |
|---------|-------------|
| "系统要快一点" | 页面首屏加载时间 < 1.5s (P95) |
| "支持很多人同时用" | 并发用户数 ≥ 5000，错误率 < 0.1% |
| "界面要好看" | 符合设计系统规范，可用性测试评分 ≥ 4.0/5 |
| "数据不能丢" | RPO = 0，RTO < 5分钟 |
| "操作要简单" | 新用户无需培训即可完成核心任务，完成率 ≥ 90% |

## 验收标准编写规范
正常场景：核心功能路径
边界场景：极限值、空值、超长输入等
异常场景：网络中断、权限不足、数据异常等

请确保输出是严格合法的JSON，不要包含任何markdown代码块标记之外的文本。
"""


def build_output_prompt(understanding_result: dict, analysis_result: dict) -> str:
    """构建输出生成Prompt"""
    import json
    return OUTPUT_USER_PROMPT.format(
        understanding_result=json.dumps(understanding_result, ensure_ascii=False, indent=2),
        analysis_result=json.dumps(analysis_result, ensure_ascii=False, indent=2)
    )
