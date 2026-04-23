import React, { useState, useEffect } from 'react'
import { Send, FileText, AlertCircle, RefreshCw } from 'lucide-react'

function InputForm({ onSubmit, loading, initialContent, initialContext, onClear }) {
  const [content, setContent] = useState(initialContent || '')
  const [projectContext, setProjectContext] = useState(initialContext || '')
  const [showContext, setShowContext] = useState(false)

  // 当从历史加载时，更新内容
  useEffect(() => {
    if (initialContent !== undefined) {
      setContent(initialContent)
    }
    if (initialContext !== undefined) {
      setProjectContext(initialContext)
    }
  }, [initialContent, initialContext])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim()) return
    onSubmit(content, projectContext)
  }

  const handleClear = () => {
    setContent('')
    setProjectContext('')
    onClear?.()
  }

  return (
    <div className="card">
      <div className="card-title">
        <FileText size={20} />
        输入需求描述
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* 加载历史记录时的提示 */}
        {initialContent && (
          <div style={{
            padding: '8px 12px',
            background: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: 6,
            marginBottom: 12,
            fontSize: 13,
            color: '#ad6800',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              <strong>来自历史记录</strong> — 可直接修改后重新分析
            </span>
            <button
              type="button"
              onClick={handleClear}
              style={{
                border: 'none',
                background: 'none',
                color: '#ad6800',
                cursor: 'pointer',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <RefreshCw size={14} />
              清除
            </button>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <textarea
            className="textarea"
            placeholder="请描述您的需求，例如：我想要一个..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setShowContext(!showContext)}
            style={{
              background: 'none',
              border: 'none',
              color: '#1677ff',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <AlertCircle size={14} />
            {showContext ? '隐藏项目上下文' : '添加项目上下文（可选）'}
          </button>
          
          {showContext && (
            <textarea
              className="textarea"
              placeholder="项目背景、目标用户、技术栈等上下文信息..."
              value={projectContext}
              onChange={(e) => setProjectContext(e.target.value)}
              rows={3}
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                分析中...
              </>
            ) : (
              <>
                <Send size={16} />
                开始分析
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default InputForm
