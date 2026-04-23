"""
需求分析API路由
功能: 提供需求分析的REST API接口，支持流式SSE响应
状态: ✅ 已实现
"""
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from app.models.schemas import (
    RequirementAnalyzeRequest,
    RequirementResponse,
    HealthResponse
)
from app.services.requirement_service import requirement_service, RequirementServiceError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/requirements", tags=["需求分析"])


@router.post("/analyze", response_model=RequirementResponse, status_code=status.HTTP_200_OK)
async def analyze_requirement(request: RequirementAnalyzeRequest):
    """
    分析需求（非流式接口，保持向后兼容）
    
    接收用户原始需求描述，返回完整的需求分析结果：
    - 意图识别与实体抽取
    - 隐含需求挖掘
    - 需求拆解与矛盾检测
    - 用户故事与验收标准
    - 澄清问题与技术建议
    """
    try:
        result = await requirement_service.process_requirement(
            content=request.input_data.content,
            project_context=request.input_data.project_context,
            conversation_history=request.input_data.conversation_history
        )
        return result
        
    except RequirementServiceError as e:
        logger.error(f"需求分析服务错误: {str(e)}")
        error_detail = {
            "type": e.error_info.get("type", "unknown") if e.error_info else "unknown",
            "message": str(e),
            "suggestion": e.error_info.get("suggestion", "") if e.error_info else ""
        }
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_detail
        )
        
    except Exception as e:
        logger.error(f"需求分析API错误: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "type": "internal_error",
                "message": f"需求分析处理失败: {str(e)}",
                "suggestion": "请检查后端服务日志获取详细信息"
            }
        )


@router.post("/analyze/stream")
async def analyze_requirement_stream(request: RequirementAnalyzeRequest):
    """
    流式分析需求（SSE）
    
    实时推送分析进度和各阶段结果：
    - event: progress - 步骤进度更新
    - event: understanding - 需求理解结果（Layer 2完成）
    - event: analysis - 需求分析结果（Layer 3完成）
    - event: output - 输出生成结果（Layer 4完成）
    - event: complete - 全部完成，包含完整结果
    - event: error - 处理出错
    """
    try:
        stream_generator = requirement_service.process_requirement_stream(
            content=request.input_data.content,
            project_context=request.input_data.project_context,
            conversation_history=request.input_data.conversation_history
        )
        
        return StreamingResponse(
            stream_generator,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # 禁用Nginx缓冲
            }
        )
        
    except Exception as e:
        logger.error(f"流式需求分析API错误: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "type": "internal_error",
                "message": f"流式分析初始化失败: {str(e)}",
                "suggestion": "请检查后端服务日志获取详细信息"
            }
        )


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查接口"""
    return HealthResponse(
        llm_provider=settings.llm_provider,
        llm_model=settings.OPENAI_MODEL
    )
