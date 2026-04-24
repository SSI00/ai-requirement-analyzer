"""
FastAPI 应用入口
功能: 初始化FastAPI应用，注册路由和中间件
状态: ✅ 已实现 (支持MiniMax等多服务商)
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import requirement

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=f"""AI需求分析系统 - MVP版本

将用户模糊、跳跃、隐含的真实需求，转化为结构化、可执行、可验证的产品需求

**当前AI服务商**: {settings.llm_provider}
**当前模型**: {settings.OPENAI_MODEL}
""",
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_parameters={
        "defaultModelsExpandDepth": 1,
        "docExpansion": "list",
        "filter": True,
        "showExtensions": True,
        "showCommonExtensions": True,
        "tryItOutEnabled": True,
        "deepLinking": True,
        "persistAuthorization": True,
    }
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(requirement.router)


@app.get("/")
async def root():
    """根路径 - 返回中文提示页面"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "llm_provider": settings.llm_provider,
        "llm_model": settings.OPENAI_MODEL,
        "docs": "/docs",
        "docs_zh": "/docs/zh-CN",
        "status": "running",
        "message": "AI需求分析系统 API 运行中",
        "api_guide": {
            "前端界面": "http://localhost:5173",
            "API文档": "http://localhost:8000/docs",
            "API文档(中文)": "http://localhost:8000/docs?language=zh-CN",
            "语言切换": "在 /docs 页面右上角点击 'Language' 下拉框选择中文"
        }
    }


@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} 启动成功")
    logger.info(f"🤖 AI服务商: {settings.llm_provider} | 模型: {settings.OPENAI_MODEL}")
    logger.info(f"📖 API文档: http://localhost:8000/docs")
    
    # 检查API Key是否配置
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_openai_api_key_here":
        logger.warning("⚠️ 警告: OPENAI_API_KEY 未配置，AI分析功能将不可用")
        logger.warning("   请编辑 backend/.env 文件配置您的API Key")


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    logger.info(f"👋 {settings.APP_NAME} 已关闭")
