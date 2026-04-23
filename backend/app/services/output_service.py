"""
输出生成服务
功能: 实现Layer 4 - 用户故事、验收标准、澄清问题、技术建议、风险清单
状态: ✅ 已实现
"""
from typing import Dict, Any
from app.services.llm_service import llm_service, LLMServiceError
from app.prompts.output import (
    OUTPUT_SYSTEM_PROMPT,
    build_output_prompt
)
import logging

logger = logging.getLogger(__name__)


class OutputService:
    """输出生成服务"""
    
    async def generate(
        self,
        understanding_result: Dict[str, Any],
        analysis_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        生成结构化输出
        
        Args:
            understanding_result: 需求理解结果
            analysis_result: 需求分析结果
            
        Returns:
            输出生成结果
        """
        logger.info("开始输出生成")
        
        prompt = build_output_prompt(understanding_result, analysis_result)
        
        try:
            result = await llm_service.structured_completion(
                system_prompt=OUTPUT_SYSTEM_PROMPT,
                user_prompt=prompt,
                temperature=0.4
            )
            
            # 标准化输出
            standardized = self._standardize_result(result)
            logger.info(f"输出生成完成，用户故事: {len(standardized.get('user_stories', []))}个, "
                       f"验收标准: {len(standardized.get('acceptance_criteria', []))}个, "
                       f"风险: {len(standardized.get('risk_list', []))}个")
            
            return standardized
            
        except LLMServiceError as e:
            logger.error(f"输出生成失败: {str(e)}")
            raise
    
    def _standardize_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """标准化输出结果"""
        standardized = {
            "user_stories": result.get("user_stories", []),
            "acceptance_criteria": result.get("acceptance_criteria", []),
            "clarification_questions": result.get("clarification_questions", []),
            "technical_suggestions": result.get("technical_suggestions", []),
            "risk_list": result.get("risk_list", [])
        }
        
        # 标准化用户故事
        for story in standardized["user_stories"]:
            story.setdefault("priority", "Should Have")
        
        # 标准化验收标准
        for ac in standardized["acceptance_criteria"]:
            ac.setdefault("category", "正常场景")
        
        # 标准化澄清问题
        for q in standardized["clarification_questions"]:
            q.setdefault("options", ["选项A", "选项B", "其他"])
            q.setdefault("recommendation", "请根据实际业务场景选择")
        
        # 标准化技术建议
        for ts in standardized["technical_suggestions"]:
            ts.setdefault("risk_level", "中")
            ts.setdefault("mitigation", "待评估")
        
        # 标准化风险
        for risk in standardized["risk_list"]:
            risk.setdefault("probability", "中")
            risk.setdefault("impact", "中")
            risk.setdefault("mitigation", "待制定")
        
        return standardized


# 全局服务实例
output_service = OutputService()
