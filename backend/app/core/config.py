"""
核心配置模块
功能: 管理应用配置，支持环境变量加载
状态: ✅ 已实现 (支持MiniMax/OpenAI等多服务商)
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """应用配置类"""
    
    # 应用信息
    APP_NAME: str = "AI Requirement Analyzer"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    
    # AI模型配置 (兼容OpenAI格式，支持MiniMax等服务商)
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # CORS配置
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def llm_provider(self) -> str:
        """识别当前使用的LLM服务商"""
        base = self.OPENAI_BASE_URL.lower()
        if "minimax" in base or "minimaxi" in base:
            return "MiniMax"
        elif "openai" in base:
            return "OpenAI"
        elif "deepseek" in base:
            return "DeepSeek"
        elif "silicon" in base:
            return "SiliconFlow"
        else:
            return "Custom"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# 全局配置实例
settings = Settings()
