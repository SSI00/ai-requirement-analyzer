import React, { useState } from 'react'
import { Send, FileText, AlertCircle } from 'lucide-react'

function InputForm({ onSubmit, loading }) {
  const [content, setContent] = useState('')
  const [projectContext, setProjectContext] = useState('')
  const [showContext, setShowContext] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim()) return
    onSubmit(content, projectContext)
  }

  return (
    <div className="card">
      <div className="card-title">
        <FileText size={20} />
        输入需求描述
      </div>
      
      <form onSubmit={handleSubmit}>
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
