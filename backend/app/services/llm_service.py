"""
LLM服务模块
功能: 封装OpenAI兼容API调用，支持MiniMax/OpenAI等多服务商
状态: ✅ 已实现 (已适配MiniMax)
"""
import json
import re
from typing import Optional, Dict, Any
from openai import AsyncOpenAI
from app.core.config import settings


class LLMService:
    """大语言模型服务"""
    
    def __init__(self):
        self.provider = settings.llm_provider
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL if settings.OPENAI_BASE_URL else None
        )
        self.model = settings.OPENAI_MODEL
        
        # MiniMax特殊处理: 部分模型不支持response_format
        self.supports_json_mode = not self.provider == "MiniMax" or self._minimax_supports_json()
    
    def _minimax_supports_json(self) -> bool:
        """检查MiniMax模型是否支持JSON模式"""
        # MiniMax-M2.7 及更新模型支持JSON模式
        supported_models = ["MiniMax-M2.7", "MiniMax-M2.5", "MiniMax-M2.1", "MiniMax-M2"]
        return any(m in self.model for m in supported_models)
    
    async def chat_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 32000,
        response_format: Optional[Dict[str, str]] = None
    ) -> str:
        """
        调用LLM进行对话完成
        
        Args:
            system_prompt: 系统提示词
            user_prompt: 用户提示词
            temperature: 温度参数 (0-1, 越低越确定)
            max_tokens: 最大输出token数
            response_format: 响应格式要求
            
        Returns:
            AI生成的文本响应
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        kwargs = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        # MiniMax特殊处理: 添加reasoning_split参数以分离思考内容
        if self.provider == "MiniMax":
            kwargs["extra_body"] = {"reasoning_split": True}
        
        # 仅在支持JSON模式的模型上使用response_format
        if response_format and self.supports_json_mode:
            kwargs["response_format"] = response_format
        
        try:
            response = await self.client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content
            
            # MiniMax特殊处理: 清理可能的<think>标签
            if self.provider == "MiniMax":
                content = self._clean_think_tags(content)
            
            return content
            
        except Exception as e:
            raise LLMServiceError(f"LLM调用失败 [{self.provider}/{self.model}]: {str(e)}")
    
    async def structured_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """
        调用LLM并解析为结构化JSON
        
        Args:
            system_prompt: 系统提示词
            user_prompt: 用户提示词
            temperature: 温度参数
            
        Returns:
            解析后的字典对象
        """
        # 如果模型不支持JSON模式，在prompt中明确要求JSON输出
        if not self.supports_json_mode:
            system_prompt = system_prompt + "\n\n## 重要\n你必须只输出合法的JSON格式，不要包含任何其他文本或markdown标记。"
        
        content = await self.chat_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            response_format={"type": "json_object"} if self.supports_json_mode else None
        )
        
        # 清理可能的markdown代码块标记
        content = self._clean_json_response(content)
        
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            # 尝试修复常见的JSON格式问题
            fixed_content = self._try_fix_json(content)
            try:
                return json.loads(fixed_content)
            except:
                raise LLMServiceError(
                    f"JSON解析失败 [{self.provider}/{self.model}]: {str(e)}\n"
                    f"原始内容前500字符: {content[:500]}"
                )
    
    def _clean_json_response(self, content: str) -> str:
        """清理JSON响应中的markdown标记"""
        # 移除 ```json 和 ``` 标记
        content = re.sub(r'^```json\s*', '', content.strip())
        content = re.sub(r'\s*```$', '', content.strip())
        # 移除可能的 <think>...</think> 标签
        content = self._clean_think_tags(content)
        return content.strip()
    
    def _clean_think_tags(self, content: str) -> str:
        """清理MiniMax模型的<think>标签"""
        # 移除 <think>...</think> 块
        content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
        # 移除残留的 <think> 或 </think> 标签
        content = re.sub(r'</?think>', '', content)
        return content.strip()
    
    def _try_fix_json(self, content: str) -> str:
        """尝试修复常见的JSON格式问题"""
        # 尝试提取JSON对象
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            fixed = match.group(0)
            # 尝试修复常见的逗号问题
            fixed = self._fix_common_json_issues(fixed)
            return fixed
        # 尝试提取JSON数组
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            fixed = match.group(0)
            fixed = self._fix_common_json_issues(fixed)
            return fixed
        return content

    def _fix_common_json_issues(self, json_str: str) -> str:
        """修复常见的JSON格式问题"""
        # 1. 修复多余逗号 (如 {"a": 1, } -> {"a": 1})
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        # 2. 修复单引号为双引号（但在字符串内部不处理）
        # 先找出所有字符串内容，然后只处理字符串外的内容
        # 简化处理：如果有单引号问题很可能导致JSON失败
        # 3. 移除尾随逗号
        json_str = re.sub(r',(\s*)$', r'\1', json_str, flags=re.MULTILINE)
        # 4. 修复未转义的换行符在字符串内的问题
        # 移除多余的空白字符但保留必要的空格
        json_str = re.sub(r'\\s+', ' ', json_str)
        # 5. 尝试修复换行符问题 - 替换为\n（如果在外面）
        # 6. 移除控制字符
        json_str = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', json_str)
        return json_str


class LLMServiceError(Exception):
    """LLM服务异常"""
    pass


# 全局LLM服务实例
llm_service = LLMService()
