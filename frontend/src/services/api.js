/**
 * API服务
 * 功能: 封装后端API调用，支持流式SSE响应
 * 状态: ✅ 已实现
 */
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000, // 10分钟超时
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 分析需求（非流式）
 * @param {string} content - 用户原始需求描述
 * @param {string} projectContext - 项目上下文（可选）
 * @returns {Promise<Object>} 分析结果
 */
export async function analyzeRequirement(content, projectContext = '') {
  const response = await api.post('/api/v1/requirements/analyze', {
    input_data: {
      content,
      project_context: projectContext || undefined
    }
  })
  return response.data
}

/**
 * 流式分析需求（SSE）
 * @param {string} content - 用户原始需求描述
 * @param {string} projectContext - 项目上下文（可选）
 * @param {Object} callbacks - 事件回调
 * @param {Function} callbacks.onProgress - 进度更新回调 (data) => void
 * @param {Function} callbacks.onUnderstanding - 需求理解结果回调 (data) => void
 * @param {Function} callbacks.onAnalysis - 需求分析结果回调 (data) => void
 * @param {Function} callbacks.onOutput - 输出生成结果回调 (data) => void
 * @param {Function} callbacks.onComplete - 完成回调 (data) => void
 * @param {Function} callbacks.onError - 错误回调 (error) => void
 * @returns {Function} 取消函数
 */
export function analyzeRequirementStream(content, projectContext = '', callbacks = {}) {
  const {
    onProgress,
    onUnderstanding,
    onAnalysis,
    onOutput,
    onComplete,
    onError
  } = callbacks

  // 使用fetch + ReadableStream来处理SSE，因为EventSource不支持POST请求
  const controller = new AbortController()
  const { signal } = controller

  const url = `${API_BASE_URL}/api/v1/requirements/analyze/stream`

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify({
      input_data: {
        content,
        project_context: projectContext || undefined
      }
    }),
    signal
  })
    .then(async (response) => {
      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { detail: `HTTP ${response.status}` }
        }
        throw new Error(JSON.stringify(errorData))
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // 处理SSE事件
        const events = buffer.split('\n\n')
        buffer = events.pop() || '' // 保留不完整的部分

        for (const eventText of events) {
          if (!eventText.trim()) continue

          const lines = eventText.split('\n')
          let eventType = 'message'
          let dataStr = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6).trim()
            }
          }

          if (!dataStr) continue

          try {
            const data = JSON.parse(dataStr)

            switch (eventType) {
              case 'progress':
                onProgress?.(data)
                break
              case 'understanding':
                onUnderstanding?.(data)
                break
              case 'analysis':
                onAnalysis?.(data)
                break
              case 'output':
                onOutput?.(data)
                break
              case 'complete':
                onComplete?.(data)
                break
              case 'error':
                onError?.(new Error(data.error_info?.message || '分析出错'), data)
                break
              default:
                break
            }
          } catch (e) {
            console.warn('解析SSE数据失败:', e, dataStr)
          }
        }
      }
    })
    .catch((err) => {
      if (err.name === 'AbortError') {
        // 用户主动取消，不触发错误回调
        return
      }
      console.error('流式请求失败:', err)
      onError?.(err)
    })

  // 返回取消函数
  return () => controller.abort()
}

/**
 * 继续分析（澄清后）
 * @param {string} requirementId - 需求ID
 * @param {string} clarification - 用户澄清回答
 * @param {boolean} skipped - 是否跳过澄清
 * @returns {Promise<Object>} 继续分析的结果
 */
export async function continueAnalysis(requirementId, clarification, skipped = false) {
  const response = await api.post('/api/v1/requirements/continue', {
    requirement_id: requirementId,
    clarification,
    skipped
  })
  return response.data
}

/**
 * 健康检查
 * @returns {Promise<Object>} 健康状态
 */
export async function healthCheck() {
  const response = await api.get('/api/v1/requirements/health')
  return response.data
}

export default api