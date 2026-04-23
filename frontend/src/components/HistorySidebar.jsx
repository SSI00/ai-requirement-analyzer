import React from 'react'
import { History, Trash2, X, Clock } from 'lucide-react'
import { deleteHistoryItem, clearHistory } from '../services/storage'

function HistorySidebar({ isOpen, onClose, history, onLoadHistory }) {
  const handleDelete = (e, id) => {
    e.stopPropagation()
    deleteHistoryItem(id)
    onLoadHistory()
  }

  const handleClear = () => {
    if (window.confirm('确定清空所有历史记录？')) {
      clearHistory()
      onLoadHistory()
    }
  }

  const handleLoadHistory = (item) => {
    // 直接加载完整的历史分析结果，而不是只填充输入框
    onLoadHistory(item)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 999
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : '-380px',
        width: 380,
        height: '100vh',
        background: 'white',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
        zIndex: 1000,
        transition: 'right 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e8e8e8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={20} color="#1677ff" />
            <span style={{ fontWeight: 600, fontSize: 16 }}>历史记录</span>
            <span style={{
              background: '#e6f4ff',
              color: '#1677ff',
              padding: '2px 8px',
              borderRadius: 10,
              fontSize: 12
            }}>
              {history.length} 条
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {history.length > 0 && (
              <button
                onClick={handleClear}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#ff4d4f',
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: '4px 8px',
                  borderRadius: 4
                }}
                title="清空全部"
              >
                清空
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={20} color="#666" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {history.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999'
            }}>
              <Clock size={48} color="#d9d9d9" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 14 }}>暂无历史记录</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>分析完成后会自动保存到这里</div>
            </div>
          ) : (
            history.map(item => {
              const title = item.requirement_content?.substring(0, 50) + (item.requirement_content?.length > 50 ? '...' : '')
              const displayTime = formatTime(item.timestamp)

              // 从结果中提取摘要
              const storyCount = item.result?.output?.user_stories?.length || 0
              const reqCount = item.result?.analysis?.sub_requirements?.length || 0

              return (
                <div
                  key={item.id}
                  onClick={() => handleLoadHistory(item)}
                  style={{
                    padding: '14px 20px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{
                      fontSize: 13,
                      color: '#333',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      paddingRight: 8
                    }}>
                      {title}
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      style={{
                        border: 'none',
                        background: 'none',
                        padding: 4,
                        cursor: 'pointer',
                        color: '#ccc',
                        borderRadius: 4
                      }}
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 6,
                    fontSize: 12,
                    color: '#999'
                  }}>
                    <Clock size={12} />
                    {displayTime}
                  </div>
                  {storyCount > 0 && (
                    <div style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: '#52c41a'
                    }}>
                      {reqCount}个子需求 · {storyCount}个用户故事
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e8e8e8',
          fontSize: 12,
          color: '#999',
          textAlign: 'center'
        }}>
          点击记录重新加载完整分析结果
        </div>
      </div>
    </>
  )
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

export default HistorySidebar