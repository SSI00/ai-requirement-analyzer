"""
需求分析主服务
功能: 编排需求理解的完整流程 (Layer 1→2→3→4)，支持步骤进度追踪和流式输出
状态: ✅ 已实现 (支持流式SSE)
"""
import uuid
import time
import json
from typing import Dict, Any, Optional, List, AsyncGenerator
from app.services.understanding_service import understanding_service
from app.services.analysis_service import analysis_service
from app.services.output_service import output_service
from app.services.llm_service import LLMServiceError
import logging

logger = logging.getLogger(__name__)


class RequirementService:
    """需求分析主服务"""
    
    def __init__(self):
        self.steps_template = [
            {"step": "intent_recognition", "name": "意图识别", "status": "pending"},
            {"step": "entity_extraction", "name": "实体抽取", "status": "pending"},
            {"step": "implied_mining", "name": "隐含挖掘", "status": "pending"},
            {"step": "requirement_decomposition", "name": "需求拆解", "status": "pending"},
            {"step": "conflict_detection", "name": "矛盾检测", "status": "pending"},
            {"step": "output_generation", "name": "输出生成", "status": "pending"},
        ]
    
    def _update_step(self, steps: List[dict], step_id: str, status: str, message: str = None):
        """更新步骤状态"""
        for s in steps:
            if s["step"] == step_id:
                s["status"] = status
                if message:
                    s["message"] = message
                break
    
    def _make_progress_event(self, event_type: str, data: dict) -> str:
        """构造SSE事件字符串"""
        return f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
    
    async def process_requirement_stream(
        self,
        content: str,
        project_context: Optional[str] = None,
        conversation_history: Optional[list] = None
    ) -> AsyncGenerator[str, None]:
        """
        流式处理需求分析流程，实时推送进度更新
        
        事件类型:
        - progress: 步骤进度更新
        - understanding: 需求理解结果（Layer 2完成）
        - analysis: 需求分析结果（Layer 3完成）
        - output: 输出生成结果（Layer 4完成）
        - complete: 全部完成，包含完整结果汇总
        - error: 处理出错
        """
        requirement_id = str(uuid.uuid4())[:8]
        start_time = time.time()
        steps = [s.copy() for s in self.steps_template]
        
        logger.info(f"[{requirement_id}] 开始流式处理需求分析请求")
        
        # 发送初始进度
        yield self._make_progress_event("progress", {
            "requirement_id": requirement_id,
            "steps": steps,
            "phase": "started"
        })
        
        understanding = None
        analysis = None
        output = None
        
        try:
            # Step 1: 需求理解 (Layer 2)
            self._update_step(steps, "intent_recognition", "running", "正在分析用户核心意图...")
            self._update_step(steps, "entity_extraction", "running", "正在提取关键业务实体...")
            self._update_step(steps, "implied_mining", "running", "正在推导隐含需求...")
            
            yield self._make_progress_event("progress", {
                "requirement_id": requirement_id,
                "steps": steps,
                "phase": "understanding"
            })
            
            logger.info(f"[{requirement_id}] Step 1/3: 需求理解")
            understanding = await understanding_service.analyze(
                user_input=content,
                project_context=project_context,
                conversation_history=conversation_history
            )
            
            self._update_step(steps, "intent_recognition", "completed", 
                f"识别到意图: {understanding.get('intent', {}).get('type', '未知')}")
            self._update_step(steps, "entity_extraction", "completed",
                f"提取到 {len(understanding.get('entities', []))} 个实体")
            self._update_step(steps, "implied_mining", "completed",
                f"发现 {len(understanding.get('implied_requirements', []))} 个隐含需求")
            
            yield self._make_progress_event("progress", {
                "requirement_id": requirement_id,
                "steps": steps,
                "phase": "understanding_done"
            })
            
            # 发送需求理解结果
            yield self._make_progress_event("understanding", {
                "requirement_id": requirement_id,
                "data": understanding
            })
            
            # Step 2: 需求分析 (Layer 3)
            self._update_step(steps, "requirement_decomposition", "running", "正在拆解为可执行单元...")
            self._update_step(steps, "conflict_detection", "running", "正在识别需求间冲突...")
            
            yield self._make_progress_event("progress", {
                "requirement_id": requirement_id,
                "steps": steps,
                "phase": "analysis"
            })
            
            logger.info(f"[{requirement_id}] Step 2/3: 需求分析")
            analysis = await analysis_service.analyze(understanding)
            
            self._update_step(steps, "requirement_decomposition", "completed",
                f"拆解为 {len(analysis.get('sub_requirements', []))} 个子需求")
            self._update_step(steps, "conflict_detection", "completed",
                f"检测到 {len(analysis.get('conflicts', []))} 个矛盾")
            
            yield self._make_progress_event("progress", {
                "requirement_id": requirement_id,
                "steps": steps,
                "phase": "analysis_done"
            })
            
            # 发送需求分析结果
            yield self._make_progress_event("analysis", {
                "requirement_id": requirement_id,
                "data": analysis
            })
            
            # Step 3: 输出生成 (Layer 4)
            self._update_step(steps, "output_generation", "running", "正在生成用户故事与验收标准...")
            
            yield self._make_progress_event("progress", {
                "requirement_id": requirement_id,
                "steps": steps,
                "phase": "output"
            })
            
            logger.info(f"[{requirement_id}] Step 3/3: 输出生成")
            output = await output_service.generate(understanding, analysis)
            
            self._update_step(steps, "output_generation", "completed",
                f"生成 {len(output.get('user_stories', []))} 个用户故事")
            
            processing_time = int((time.time() - start_time) * 1000)
            
            yield self._make_progress_event("progress", {
                "requirement_id": requirement_id,
                "steps": steps,
                "phase": "output_done"
            })
            
            # 发送输出生成结果
            yield self._make_progress_event("output", {
                "requirement_id": requirement_id,
                "data": output
            })
            
            # 发送完成事件
            yield self._make_progress_event("complete", {
                "requirement_id": requirement_id,
                "status": "success",
                "steps": steps,
                "understanding": understanding,
                "analysis": analysis,
                "output": output,
                "processing_time_ms": processing_time,
                "error_info": None
            })
            
            logger.info(f"[{requirement_id}] 需求分析完成，耗时: {processing_time}ms")
            
        except LLMServiceError as e:
            logger.error(f"[{requirement_id}] LLM服务错误: {str(e)}")
            error_info = {
                "type": "llm_error",
                "message": str(e),
                "suggestion": "请检查: 1) API Key是否正确 2) 网络连接是否正常 3) API余额是否充足"
            }
            yield self._make_progress_event("error", {
                "requirement_id": requirement_id,
                "error_info": error_info,
                "steps": steps
            })
            
        except Exception as e:
            logger.error(f"[{requirement_id}] 需求分析失败: {str(e)}")
            error_info = {
                "type": "unknown_error",
                "message": str(e),
                "suggestion": "系统内部错误，请查看后端日志获取详细信息"
            }
            yield self._make_progress_event("error", {
                "requirement_id": requirement_id,
                "error_info": error_info,
                "steps": steps
            })
    
    async def process_requirement(
        self,
        content: str,
        project_context: Optional[str] = None,
        conversation_history: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        处理完整的需求分析流程（非流式，保持向后兼容）
        
        流程:
        1. Layer 2: 需求理解 (意图识别 + 实体抽取 + 隐含挖掘 + 模糊检测)
        2. Layer 3: 需求分析 (需求拆解 + 矛盾检测 + 优先级排序)
        3. Layer 4: 输出生成 (用户故事 + 验收标准 + 澄清问题)
        
        Args:
            content: 用户原始需求描述
            project_context: 项目上下文
            conversation_history: 历史对话
            
        Returns:
            完整的需求分析结果（包含步骤进度）
        """
        requirement_id = str(uuid.uuid4())[:8]
        start_time = time.time()
        steps = [s.copy() for s in self.steps_template]
        
        logger.info(f"[{requirement_id}] 开始处理需求分析请求")
        
        try:
            # Step 1: 需求理解 (Layer 2)
            self._update_step(steps, "intent_recognition", "running")
            self._update_step(steps, "entity_extraction", "running")
            self._update_step(steps, "implied_mining", "running")
            
            logger.info(f"[{requirement_id}] Step 1/3: 需求理解")
            understanding = await understanding_service.analyze(
                user_input=content,
                project_context=project_context,
                conversation_history=conversation_history
            )
            
            self._update_step(steps, "intent_recognition", "completed", 
                f"识别到意图: {understanding.get('intent', {}).get('type', '未知')}")
            self._update_step(steps, "entity_extraction", "completed",
                f"提取到 {len(understanding.get('entities', []))} 个实体")
            self._update_step(steps, "implied_mining", "completed",
                f"发现 {len(understanding.get('implied_requirements', []))} 个隐含需求")
            
            # Step 2: 需求分析 (Layer 3)
            self._update_step(steps, "requirement_decomposition", "running")
            self._update_step(steps, "conflict_detection", "running")
            
            logger.info(f"[{requirement_id}] Step 2/3: 需求分析")
            analysis = await analysis_service.analyze(understanding)
            
            self._update_step(steps, "requirement_decomposition", "completed",
                f"拆解为 {len(analysis.get('sub_requirements', []))} 个子需求")
            self._update_step(steps, "conflict_detection", "completed",
                f"检测到 {len(analysis.get('conflicts', []))} 个矛盾")
            
            # Step 3: 输出生成 (Layer 4)
            self._update_step(steps, "output_generation", "running")
            
            logger.info(f"[{requirement_id}] Step 3/3: 输出生成")
            output = await output_service.generate(understanding, analysis)
            
            self._update_step(steps, "output_generation", "completed",
                f"生成 {len(output.get('user_stories', []))} 个用户故事")
            
            processing_time = int((time.time() - start_time) * 1000)
            
            result = {
                "requirement_id": requirement_id,
                "status": "success",
                "steps": steps,
                "understanding": understanding,
                "analysis": analysis,
                "output": output,
                "processing_time_ms": processing_time,
                "error_info": None
            }
            
            logger.info(f"[{requirement_id}] 需求分析完成，耗时: {processing_time}ms")
            return result
            
        except LLMServiceError as e:
            # LLM调用失败 - 通常是API Key或网络问题
            logger.error(f"[{requirement_id}] LLM服务错误: {str(e)}")
            error_info = {
                "type": "llm_error",
                "message": str(e),
                "suggestion": "请检查: 1) API Key是否正确 2) 网络连接是否正常 3) API余额是否充足"
            }
            raise RequirementServiceError(error_info["message"], error_info)
            
        except Exception as e:
            # 其他未知错误
            logger.error(f"[{requirement_id}] 需求分析失败: {str(e)}")
            error_info = {
                "type": "unknown_error",
                "message": str(e),
                "suggestion": "系统内部错误，请查看后端日志获取详细信息"
            }
            raise RequirementServiceError(error_info["message"], error_info)


class RequirementServiceError(Exception):
    """需求分析服务异常"""
    def __init__(self, message: str, error_info: dict = None):
        super().__init__(message)
        self.error_info = error_info


# 全局服务实例
requirement_service = RequirementService()
