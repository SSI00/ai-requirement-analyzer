"""
需求理解服务
功能: 实现Layer 2 - 意图识别、实体抽取、隐含需求挖掘、模糊点检测
状态: ✅ 已实现
"""
from typing import Dict, Any, Optional
from app.services.llm_service import llm_service, LLMServiceError
from app.prompts.understanding import (
    UNDERSTANDING_SYSTEM_PROMPT,
    build_understanding_prompt
)
import logging

logger = logging.getLogger(__name__)


class UnderstandingService:
    """需求理解服务"""
    
    async def analyze(
        self,
        user_input: str,
        project_context: Optional[str] = None,
        conversation_history: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        分析用户输入，进行需求理解
        
        Args:
            user_input: 用户原始需求描述
            project_context: 项目上下文
            conversation_history: 历史对话记录
            
        Returns:
            结构化理解结果
        """
        logger.info(f"开始需求理解分析，输入长度: {len(user_input)}")
        
        prompt = build_understanding_prompt(
            user_input=user_input,
            project_context=project_context,
            conversation_history=conversation_history
        )
        
        try:
            result = await llm_service.structured_completion(
                system_prompt=UNDERSTANDING_SYSTEM_PROMPT,
                user_prompt=prompt,
                temperature=0.3
            )
            
            # 标准化输出结构
            standardized = self._standardize_result(result)
            logger.info(f"需求理解完成，识别实体: {len(standardized.get('entities', []))}个, "
                       f"隐含需求: {len(standardized.get('implied_requirements', []))}个, "
                       f"模糊点: {len(standardized.get('fuzzy_points', []))}个")
            
            return standardized
            
        except LLMServiceError as e:
            logger.error(f"需求理解失败: {str(e)}")
            raise
    
    def _standardize_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """标准化理解结果结构"""
        # 确保所有必要字段存在
        standardized = {
            "intent": result.get("intent", {
                "type": "未知",
                "confidence": "低",
                "description": "未能识别意图",
                "deep_intent": ""
            }),
            "entities": result.get("entities", []),
            "implied_requirements": result.get("implied_requirements", []),
            "fuzzy_points": result.get("fuzzy_points", [])
        }

        # 标准化实体结构
        for entity in standardized["entities"]:
            entity.setdefault("normalized", entity.get("name", ""))
            entity.setdefault("confidence", "中")

        # 标准化隐含需求结构
        for req in standardized["implied_requirements"]:
            req.setdefault("status", "建议补充")
            req.setdefault("confidence", "中")

        # 标准化模糊点结构
        for point in standardized["fuzzy_points"]:
            point.setdefault("options", ["选项A", "选项B", "其他"])
            point.setdefault("recommendation", "请根据实际业务场景选择")
            point.setdefault("impact", "影响待评估")

        return standardized

    def apply_clarification(self, understanding: Dict[str, Any], clarification: List[dict]) -> Dict[str, Any]:
        """
        应用澄清回答，更新理解结果

        Args:
            understanding: 原始理解结果
            clarification: 澄清回答列表 [{"question": "...", "answer": "..."}]

        Returns:
            更新后的理解结果
        """
        # 创建副本避免修改原始数据
        updated = {
            **understanding,
            "intent": {**understanding.get("intent", {})},
            "entities": list(understanding.get("entities", [])),
            "implied_requirements": list(understanding.get("implied_requirements", [])),
            "fuzzy_points": []
        }

        # 用澄清回答更新模糊点
        for point in understanding.get("fuzzy_points", []):
            fuzzy_point_text = point.get("fuzzy_point", "")

            # 找到对应的回答
            answer_text = None
            for ca in clarification:
                if ca.get("question") == fuzzy_point_text or fuzzy_point_text in ca.get("question", ""):
                    answer_text = ca.get("answer", "")
                    break

            # 如果有回答，更新模糊点状态
            if answer_text:
                updated_point = {**point}
                updated_point["resolved"] = True
                updated_point["user_answer"] = answer_text
                updated["fuzzy_points"].append(updated_point)
            else:
                updated["fuzzy_points"].append(point)

        # 添加澄清上下文到隐含需求
        if clarification:
            clarification_context = "；".join([
                f"已澄清：{ca.get('question')} -> {ca.get('answer')}"
                for ca in clarification
            ])
            # 在意图描述中追加澄清信息
            if updated["intent"].get("description"):
                updated["intent"]["description"] += f"\n[澄清] {clarification_context}"

        logger.info(f"应用澄清回答完成，处理 {len(clarification)} 个问题")
        return updated


# 全局服务实例
understanding_service = UnderstandingService()
