"""
LLM服务模块
功能: 封装OpenAI兼容API调用，支持MiniMax/OpenAI等多服务商
状态: ✅ 已实现 (已适配MiniMax)
"""
import json
import logging
import re
from typing import Optional, Dict, Any
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)


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

        content = self._clean_json_response(content)

        try:
            return json.loads(content)
        except json.JSONDecodeError as first_error:
            logger.warning(
                "首次JSON解析失败 [%s/%s]: %s",
                self.provider,
                self.model,
                first_error
            )

            repaired = self._try_fix_json(content, first_error)
            if repaired:
                try:
                    return json.loads(repaired)
                except json.JSONDecodeError:
                    logger.warning("本地JSON修复未成功，准备发起模型修复")

            repaired_by_model = await self._repair_json_with_model(content)
            if repaired_by_model:
                repaired_by_model = self._clean_json_response(repaired_by_model)
                repaired_by_model = self._try_fix_json(repaired_by_model)
                try:
                    return json.loads(repaired_by_model)
                except json.JSONDecodeError:
                    logger.warning("模型JSON修复后仍无法解析")

            raise LLMServiceError(
                f"JSON解析失败 [{self.provider}/{self.model}]: {str(first_error)}\n"
                f"原始内容前500字符: {content[:500]}"
            )

    def _clean_json_response(self, content: str) -> str:
        """清理JSON响应中的markdown标记"""
        content = re.sub(r'^```json\s*', '', content.strip())
        content = re.sub(r'\s*```$', '', content.strip())
        content = self._clean_think_tags(content)
        return content.strip()

    def _clean_think_tags(self, content: str) -> str:
        """清理MiniMax模型的<think>标签"""
        content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
        content = re.sub(r'</?think>', '', content)
        return content.strip()

    async def _repair_json_with_model(self, content: str) -> str:
        """当本地修复失败后，借助模型将脏JSON修正为合法JSON"""
        system_prompt = (
            "你是一个JSON修复器。"
            "你的唯一任务是把用户提供的损坏JSON修复成严格合法的JSON。"
            "不要补充解释，不要改变字段语义，不要新增无关字段，只修复语法问题。"
        )
        user_prompt = (
            "请修复下面的JSON，只输出修复后的合法JSON：\n\n"
            f"{content}"
        )

        try:
            return await self.chat_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0,
                response_format={"type": "json_object"} if self.supports_json_mode and content.lstrip().startswith("{") else None
            )
        except Exception as e:
            logger.warning("模型JSON修复调用失败: %s", e)
            return ""

    def _try_fix_json(self, content: str, error: Optional[json.JSONDecodeError] = None) -> str:
        """尝试修复常见的JSON格式问题"""
        candidate = self._extract_json_candidate(content)

        for attempt in (
            candidate,
            self._attempt_targeted_comma_fix(candidate, error),
            self._fix_common_json_issues(candidate),
            self._fix_common_json_issues(self._attempt_targeted_comma_fix(candidate, error) or candidate),
        ):
            if attempt:
                try:
                    json.loads(attempt)
                    return attempt
                except json.JSONDecodeError:
                    continue

        return self._fix_common_json_issues(candidate)

    def _extract_json_candidate(self, content: str) -> str:
        """提取首个平衡的JSON对象/数组，避免贪婪正则误伤"""
        start = -1
        start_char = ""
        for idx, char in enumerate(content):
            if char in "{[":
                start = idx
                start_char = char
                break

        if start == -1:
            return content

        stack = ["}" if start_char == "{" else "]"]
        in_string = False
        escaped = False

        for idx in range(start + 1, len(content)):
            char = content[idx]

            if in_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    in_string = False
                continue

            if char == '"':
                in_string = True
            elif char == "{":
                stack.append("}")
            elif char == "[":
                stack.append("]")
            elif char in "}]":
                if stack and char == stack[-1]:
                    stack.pop()
                    if not stack:
                        return content[start:idx + 1]

        return content[start:]

    def _attempt_targeted_comma_fix(
        self,
        json_str: str,
        error: Optional[json.JSONDecodeError]
    ) -> Optional[str]:
        """针对缺失逗号错误，在报错位置前插入逗号进行一次定点修复"""
        if not error or "Expecting ',' delimiter" not in error.msg:
            return None

        insert_at = max(0, min(error.pos, len(json_str)))
        while insert_at > 0 and json_str[insert_at - 1].isspace():
            insert_at -= 1

        if insert_at <= 0 or insert_at >= len(json_str):
            return None

        prev_idx = insert_at - 1
        while prev_idx >= 0 and json_str[prev_idx].isspace():
            prev_idx -= 1

        if prev_idx < 0:
            return None

        prev_char = json_str[prev_idx]
        next_char = json_str[insert_at]

        if prev_char in '"}]0123456789el' and next_char in '"{[':
            return json_str[:insert_at] + "," + json_str[insert_at:]

        return None

    def _fix_common_json_issues(self, json_str: str) -> str:
        """修复常见的JSON格式问题"""
        json_str = (
            json_str
            .replace("“", '"')
            .replace("”", '"')
            .replace("‘", "'")
            .replace("’", "'")
            .replace("\ufeff", "")
            .replace("\u00a0", " ")
        )
        json_str = self._escape_control_chars_in_strings(json_str)
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        json_str = re.sub(r',(\s*)$', r'\1', json_str, flags=re.MULTILINE)
        json_str = self._insert_missing_commas(json_str)
        return json_str.strip()

    def _escape_control_chars_in_strings(self, json_str: str) -> str:
        """把字符串中的裸换行/制表符转义，避免JSON解析中断"""
        result = []
        in_string = False
        escaped = False

        for char in json_str:
            if in_string:
                if escaped:
                    result.append(char)
                    escaped = False
                    continue

                if char == "\\":
                    result.append(char)
                    escaped = True
                    continue

                if char == '"':
                    result.append(char)
                    in_string = False
                    continue

                if char == "\n":
                    result.append("\\n")
                    continue
                if char == "\r":
                    result.append("\\r")
                    continue
                if char == "\t":
                    result.append("\\t")
                    continue
                if ord(char) < 32:
                    continue

                result.append(char)
                continue

            if char == '"':
                in_string = True
                result.append(char)
                continue

            if ord(char) < 32 and char not in "\r\n\t":
                continue

            result.append(char)

        return "".join(result)

    def _insert_missing_commas(self, json_str: str) -> str:
        """在明显缺失分隔符的位置补逗号"""
        result = []
        in_string = False
        escaped = False
        length = len(json_str)

        def next_significant_index(start: int) -> int:
            idx = start
            while idx < length and json_str[idx].isspace():
                idx += 1
            return idx

        for idx, char in enumerate(json_str):
            if in_string:
                result.append(char)
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    in_string = False
                    next_idx = next_significant_index(idx + 1)
                    if next_idx < length and json_str[next_idx] not in ",:}]":
                        result.append(",")
                continue

            if char == '"':
                in_string = True
                result.append(char)
                continue

            result.append(char)

            if char in "}]":
                next_idx = next_significant_index(idx + 1)
                if next_idx < length and json_str[next_idx] not in ",:}]":
                    result.append(",")

        return "".join(result)


class LLMServiceError(Exception):
    """LLM服务异常"""
    pass


# 全局LLM服务实例
llm_service = LLMService()
