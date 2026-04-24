"""
数据模型定义 (Pydantic Schemas)
功能: 定义API请求和响应的数据结构
状态: ✅ 已实现
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum
from datetime import datetime


# ==================== 枚举类型 ====================

class IntentType(str, Enum):
    """意图类型枚举"""
    FEATURE_REQUEST = "功能请求"
    PROBLEM_COMPLAINT = "问题抱怨"
    SOLUTION_IDEA = "解决方案设想"
    CONSTRAINT = "约束条件"
    VALUE_EXPECTATION = "价值期望"
    REFERENCE_COMPETITOR = "参考对标"
    UNKNOWN = "未知"


class ConfidenceLevel(str, Enum):
    """置信度级别"""
    HIGH = "高"
    MEDIUM = "中"
    LOW = "低"


class RequirementCategory(str, Enum):
    """需求分类"""
    FUNCTIONAL = "功能需求"
    NON_FUNCTIONAL = "非功能需求"
    BUSINESS_RULE = "业务规则"


class PriorityLevel(str, Enum):
    """优先级级别 (MoSCoW)"""
    MUST_HAVE = "Must Have"
    SHOULD_HAVE = "Should Have"
    COULD_HAVE = "Could Have"
    WONT_HAVE = "Won't Have"


class ConflictType(str, Enum):
    """矛盾类型"""
    FUNCTIONAL = "功能冲突"
    RESOURCE = "资源冲突"
    ROLE = "角色冲突"
    TECHNICAL = "技术冲突"
    TEMPORAL = "时序冲突"


class ImpactLevel(str, Enum):
    """影响程度"""
    HIGH = "高"
    MEDIUM = "中"
    LOW = "低"


class AnalysisStep(str, Enum):
    """分析步骤"""
    INTENT_RECOGNITION = "intent_recognition"
    ENTITY_EXTRACTION = "entity_extraction"
    IMPLIED_MINING = "implied_mining"
    REQUIREMENT_DECOMPOSITION = "requirement_decomposition"
    CONFLICT_DETECTION = "conflict_detection"
    OUTPUT_GENERATION = "output_generation"


# ==================== 基础模型 ====================

class Entity(BaseModel):
    """实体抽取结果"""
    name: str = Field(description="实体名称")
    type: str = Field(description="实体类型: 功能/业务/角色/指标/时间/竞品")
    normalized: Optional[str] = Field(default=None, description="标准化后的值")
    confidence: ConfidenceLevel = Field(default=ConfidenceLevel.HIGH)


class ImpliedRequirement(BaseModel):
    """隐含需求"""
    description: str = Field(description="需求描述")
    source: str = Field(description="推导来源")
    status: Literal["已明确", "建议补充", "必须确认"] = Field(default="建议补充")
    confidence: ConfidenceLevel = Field(default=ConfidenceLevel.MEDIUM)


class ClarificationQuestion(BaseModel):
    """澄清问题"""
    fuzzy_point: str = Field(description="检测到的模糊点")
    options: List[str] = Field(description="选项列表")
    recommendation: Optional[str] = Field(default=None, description="基于上下文的建议")
    impact: str = Field(description="选择不同方案的影响")


class SubRequirement(BaseModel):
    """子需求"""
    id: str = Field(description="需求ID")
    title: str = Field(description="需求标题")
    description: str = Field(description="需求描述")
    category: RequirementCategory = Field(description="需求分类")
    sub_category: Optional[str] = Field(default=None, description="子分类")
    priority: PriorityLevel = Field(default=PriorityLevel.SHOULD_HAVE)
    source: str = Field(description="来源: 显式/隐含/衍生")


class Conflict(BaseModel):
    """矛盾检测"""
    description: str = Field(description="矛盾描述")
    involved_requirements: List[str] = Field(description="涉及的需求ID列表")
    conflict_type: ConflictType = Field(description="矛盾类型")
    impact_level: ImpactLevel = Field(description="影响程度")
    suggested_solutions: List[dict] = Field(description="建议方案列表")


class UserStory(BaseModel):
    """用户故事"""
    role: str = Field(description="作为...角色")
    action: str = Field(description="我希望...功能")
    value: str = Field(description="以便...价值")
    priority: PriorityLevel = Field(default=PriorityLevel.SHOULD_HAVE)


class AcceptanceCriteria(BaseModel):
    """验收标准"""
    scenario: str = Field(description="场景描述")
    given: str = Field(description="前置条件 Given")
    when: str = Field(description="操作 When")
    then: str = Field(description="预期结果 Then")
    category: Literal["正常场景", "边界场景", "异常场景"] = Field(default="正常场景")


# ==================== 请求模型 ====================

class RequirementInput(BaseModel):
    """需求输入请求"""
    content: str = Field(min_length=1, max_length=10000, description="用户原始需求描述")
    project_context: Optional[str] = Field(default=None, description="项目上下文信息")
    conversation_history: Optional[List[dict]] = Field(default=None, description="历史对话记录")


class RequirementAnalyzeRequest(BaseModel):
    """需求分析请求"""
    requirement_id: Optional[str] = Field(default=None, description="需求ID")
    input_data: RequirementInput


# ==================== 响应模型 ====================

class StepProgress(BaseModel):
    """步骤进度"""
    step: str = Field(description="步骤标识")
    name: str = Field(description="步骤名称")
    status: Literal["pending", "running", "completed", "failed"] = Field(description="状态")
    message: Optional[str] = Field(default=None, description="状态说明")


class UnderstandingResult(BaseModel):
    """需求理解结果"""
    intent: dict = Field(description="意图识别结果")
    entities: List[Entity] = Field(description="实体列表")
    implied_requirements: List[ImpliedRequirement] = Field(description="隐含需求列表")
    fuzzy_points: List[ClarificationQuestion] = Field(description="模糊点及澄清问题")


class AnalysisResult(BaseModel):
    """需求分析结果"""
    sub_requirements: List[SubRequirement] = Field(description="拆解后的子需求")
    conflicts: List[Conflict] = Field(description="检测到的矛盾")
    priorities: List[dict] = Field(description="优先级排序")


class OutputResult(BaseModel):
    """输出生成结果"""
    user_stories: List[UserStory] = Field(description="用户故事列表")
    acceptance_criteria: List[AcceptanceCriteria] = Field(description="验收标准列表")
    clarification_questions: List[ClarificationQuestion] = Field(description="澄清问题列表")
    technical_suggestions: Optional[List[dict]] = Field(default=None, description="技术建议")
    risk_list: Optional[List[dict]] = Field(default=None, description="风险清单")


class RequirementResponse(BaseModel):
    """完整需求分析响应"""
    requirement_id: str = Field(description="需求ID")
    status: str = Field(description="处理状态")
    steps: Optional[List[StepProgress]] = Field(default=None, description="分析步骤进度")
    understanding: UnderstandingResult = Field(description="需求理解结果")
    analysis: AnalysisResult = Field(description="需求分析结果")
    output: OutputResult = Field(description="输出生成结果")
    created_at: datetime = Field(default_factory=datetime.now)
    processing_time_ms: Optional[int] = Field(default=None, description="处理耗时(ms)")
    error_info: Optional[dict] = Field(default=None, description="错误信息")


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str = Field(default="ok")
    version: str = Field(default="1.1.1")
    llm_provider: str = Field(default="")
    llm_model: str = Field(default="")
    timestamp: datetime = Field(default_factory=datetime.now)


class ClarificationAnswer(BaseModel):
    """澄清问题回答"""
    question: str = Field(description="澄清问题")
    answer: str = Field(description="用户回答")


class ClarificationContinueRequest(BaseModel):
    """澄清后继续分析请求"""
    requirement_id: str = Field(description="需求ID")
    clarification: List[ClarificationAnswer] = Field(description="澄清回答列表")
    skipped: bool = Field(default=False, description="是否跳过澄清")
