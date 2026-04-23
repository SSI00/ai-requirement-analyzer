"""
需求分析层 Prompt 模板
功能: 需求拆解、矛盾检测、优先级排序
状态: ✅ 已实现
"""

ANALYSIS_SYSTEM_PROMPT = """你是一位系统架构师兼产品专家，擅长将需求拆解为可执行单元，并发现需求间的潜在冲突。

## 核心能力
1. 需求拆解：将需求按功能/非功能/业务规则维度拆解
2. 矛盾检测：识别功能冲突、资源冲突、角色冲突、技术冲突、时序冲突
3. 优先级排序：基于业务价值、用户迫切度、技术依赖、实现成本、风险等级综合排序

## 输出约束
- 只报告有明确证据支持的矛盾
- 对推测性矛盾标注"待确认"
- 使用中文输出
- 输出必须是合法的JSON格式
"""

ANALYSIS_USER_PROMPT = """
## 任务
基于需求理解结果，进行深度分析：需求拆解、矛盾检测、优先级排序。

## 输入
需求理解结果: {understanding_result}

## 输出要求
请严格按照以下JSON格式输出：

```json
{{
  "sub_requirements": [
    {{
      "id": "REQ-001",
      "title": "需求标题",
      "description": "详细描述",
      "category": "需求分类(功能需求/非功能需求/业务规则)",
      "sub_category": "子分类(如: 显性功能/隐性功能/性能需求/安全需求等)",
      "priority": "优先级(Must Have/Should Have/Could Have/Won't Have)",
      "source": "来源(显式/隐含/衍生)"
    }}
  ],
  "conflicts": [
    {{
      "description": "矛盾描述",
      "involved_requirements": ["REQ-001", "REQ-002"],
      "conflict_type": "矛盾类型(功能冲突/资源冲突/角色冲突/技术冲突/时序冲突)",
      "impact_level": "影响程度(高/中/低)",
      "suggested_solutions": [
        {{
          "description": "方案描述",
          "pros": "优点",
          "cons": "缺点"
        }}
      ]
    }}
  ],
  "priorities": [
    {{
      "requirement_id": "REQ-001",
      "moscow": "Must Have",
      "score": 85,
      "reasoning": "排序理由"
    }}
  ]
}}
```

## 需求拆解维度
功能需求 (Functional):
├── 显性功能 - 用户明确提出的功能点
├── 隐性功能 - 支撑显性功能必须但用户未提及的
└── 衍生功能 - 基于业务逻辑合理推导的扩展

非功能需求 (Non-Functional):
├── 性能需求 - 并发量、响应时间(P50/P95/P99)、吞吐量
├── 安全需求 - 身份认证、权限控制、数据合规
├── 体验需求 - 无障碍访问、多语言支持、多端一致性
└── 运维需求 - 监控告警、日志审计、容灾备份

业务规则 (Business Rules):
├── 前置条件
├── 触发条件
├── 约束限制
└── 异常处理

## 矛盾检测类型
| 矛盾类型 | 示例 |
|---------|------|
| 功能冲突 | "极致个性化" + "绝不收集数据" |
| 资源冲突 | "功能要全" + "一周上线" |
| 角色冲突 | 老板要"高端大气"，用户要"简单直接" |
| 技术冲突 | "实时同步" + "离线可用" |
| 时序冲突 | B依赖A，但A在B之后排期 |

## 优先级排序因子
| 因子 | 权重 |
|------|------|
| 业务价值 | 30% |
| 用户迫切度 | 20% |
| 技术依赖 | 20% |
| 实现成本 | 15% |
| 风险等级 | 10% |
| 战略契合 | 5% |

请确保输出是严格合法的JSON，不要包含任何markdown代码块标记之外的文本。
"""


def build_analysis_prompt(understanding_result: dict) -> str:
    """构建需求分析Prompt"""
    import json
    return ANALYSIS_USER_PROMPT.format(
        understanding_result=json.dumps(understanding_result, ensure_ascii=False, indent=2)
    )
