// 历史记录存储服务
const STORAGE_KEY = 'requirement_analysis_history'
const MAX_ITEMS = 50

export function saveAnalysisRecord(record) {
  const history = getHistory()
  history.unshift({
    id: generateId(),
    timestamp: Date.now(),
    ...record
  })
  // 限制数量
  if (history.length > MAX_ITEMS) {
    history.splice(MAX_ITEMS)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  return history[0]
}

export function getHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function deleteHistoryItem(id) {
  const history = getHistory().filter(item => item.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  return history
}

export function clearHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
}

function generateId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function formatHistoryItem(item) {
  return {
    id: item.id,
    timestamp: item.timestamp,
    displayTime: formatTime(item.timestamp),
    title: item.requirement_content?.substring(0, 50) + (item.requirement_content?.length > 50 ? '...' : ''),
    content: item.requirement_content
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}