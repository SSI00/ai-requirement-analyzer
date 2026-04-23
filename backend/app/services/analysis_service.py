"""
需求分析服务
功能: 实现Layer 3 - 需求拆解、矛盾检测、优先级排序
状态: ✅ 已实现
"""
from typing import Dict, Any
from app.services.llm_service import llm_service, LLMServiceError
from app.prompts.analysis import (
    ANALYSIS_SYSTEM_PROMPT,
    build_analysis_prompt
)
import logging

logger = logging.getLogger(__name__)


class AnalysisService:
    """需求分析服务"""
    
    async def analyze(self, understanding_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        基于理解结果进行深度分析
        
        Args:
            understanding_result: 需求理解结果
            
        Returns:
            分析结果，包含子需求、矛盾、优先级
        """
        logger.info("开始需求深度分析")
        
        prompt = build_analysis_prompt(understanding_result)
        
        try:
            result = await llm_service.structured_completion(
                system_prompt=ANALYSIS_SYSTEM_PROMPT,
                user_prompt=prompt,
                temperature=0.3
            )
            
            # 标准化输出
            standardized = self._standardize_result(result)
            logger.info(f"需求分析完成，子需求: {len(standardized.get('sub_requirements', []))}个, "
                       f"矛盾: {len(standardized.get('conflicts', []))}个")
            
            return standardized
            
        except LLMServiceError as e:
            logger.error(f"需求分析失败: {str(e)}")
            raise
    
    def _standardize_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """标准化分析结果"""
        standardized = {
            "sub_requirements": result.get("sub_requirements", []),
            "conflicts": result.get("conflicts", []),
            "priorities": result.get("priorities", [])
        }
        
        # 标准化子需求
        for i, req in enumerate(standardized["sub_requirements"]):
            req.setdefault("id", f"REQ-{i+1:03d}")
            req.setdefault("category", "功能需求")
            req.setdefault("sub_category", "显性功能")
            req.setdefault("priority", "Should Have")
            req.setdefault("source", "显式")
        
        # 标准化矛盾
        for conflict in standardized["conflicts"]:
            conflict.setdefault("conflict_type", "功能冲突")
            conflict.setdefault("impact_level", "中")
            conflict.setdefault("suggested_solutions", [])
        
        # 标准化优先级
        for p in standardized["priorities"]:
            p.setdefault("moscow", "Should Have")
            p.setdefault("score", 50)
            p.setdefault("reasoning", "基于综合分析")
        
        return standardized


# 全局服务实例
analysis_service = AnalysisService()
