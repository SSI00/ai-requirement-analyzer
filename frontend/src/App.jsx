import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, Clock, CheckCircle } from 'lucide-react'
import InputForm from './components/InputForm'
import AnalysisProgress from './components/AnalysisProgress'
import UnderstandingResult from './components/UnderstandingResult'
import AnalysisResult from './components/AnalysisResult'
import OutputResult from './components/OutputResult'
import { analyzeRequirementStream, healthCheck } from './services/api'

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progressSteps, setProgressSteps] = useState(null)
  const [backendStatus, setBackendStatus] = useState(null)
  const [partialResults, setPartialResults] = useState({
    understanding: null,
    analysis: null,
    output: null
  })

  const cancelRef = useRef(null)

  // 页面加载时检查后端状态
  useEffect(() => {
    checkBackend()
  }, [])

  // 组件卸载时取消正在进行的请求
  useEffect(() => {
    return () => {
      if (cancelRef.current) {
        cancelRef.current()
      }
    }
  }, [])

  const checkBackend = async () => {
    try {
      const data = await healthCheck()
      setBackendStatus({ ok: true, ...data })
    } catch (err) {
      setBackendStatus({ ok: false })
    }
  }

  const handleAnalyze = useCallback((content, projectContext) => {
    // 取消之前的请求
    if (cancelRef.current) {
      cancelRef.current()
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setProgressSteps(null)
    setPartialResults({
      understanding: null,
      analysis: null,
      output: null
    })

    const cancel = analyzeRequirementStream(content, projectContext, {
      onProgress: (data) => {
        setProgressSteps(data.steps)
      },
      onUnderstanding: (data) => {
        setPartialResults(prev => ({ ...prev, understanding: data.data }))
      },
      onAnalysis: (data) => {
        setPartialResults(prev => ({ ...prev, analysis: data.data }))
      },
      onOutput: (data) => {
        setPartialResults(prev => ({ ...prev, output: data.data }))
      },
      onComplete: (data) => {
        setResult(data)
        setProgressSteps(data.steps)
        setPartialResults({
          understanding: data.understanding,
          analysis: data.analysis,
          output: data.output
        })
        setLoading(false)
      },
      onError: (err, data) => {
        console.error('分析失败:', err)
        setLoading(false)

        // 如果有部分结果，保留显示
        if (data?.steps) {
          setProgressSteps(data.steps)
        }

        // 详细错误诊断
        let errorTitle = '分析请求失败'
        let errorMsg = ''
        let suggestion = ''

        const errStr = err.message || String(err)

        if (errStr.includes('ECONNABORTED') || errStr.includes('timeout')) {
          errorTitle = '请求超时'
          errorMsg = 'AI分析需要较长时间（约3-6分钟），但请求已超时。'
          suggestion = '1. 请稍后重试\n2. 如果多次超时，请检查网络连接\n3. 也可以尝试简化需求描述'
        } else if (errStr.includes('Failed to fetch') || errStr.includes('NetworkError')) {
          errorTitle = '无法连接到后端服务'
          errorMsg = '前端无法连接到后端API服务器。'
          suggestion = '1. 确认后端服务已启动: 双击 start_backend.bat\n2. 检查后端是否在 http://localhost:8000 运行\n3. 检查防火墙是否阻止了端口8000'
        } else {
          try {
            const detail = JSON.parse(errStr)
            if (typeof detail === 'object' && detail.detail) {
              const d = detail.detail
              if (typeof d === 'object') {
                errorMsg = d.message || '未知错误'
                suggestion = d.suggestion || '请检查API Key配置和网络连接'
                if (d.type === 'llm_error') {
                  errorTitle = 'AI服务不可用'
                } else if (d.type === 'internal_error') {
                  errorTitle = '服务器内部错误'
                }
              } else {
                errorMsg = String(d)
              }
            } else {
              errorMsg = errStr
            }
          } catch {
            errorMsg = errStr
          }
          if (!suggestion) {
            suggestion = '请稍后重试或联系管理员'
          }
        }

        setError({ title: errorTitle, message: errorMsg, suggestion })
      }
    })

    cancelRef.current = cancel
  }, [])

  // 判断是否显示某个结果面板
  const showUnderstanding = partialResults.understanding || (result?.understanding)
  const showAnalysis = partialResults.analysis || (result?.analysis)
  const showOutput = partialResults.output || (result?.output)

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div>
            <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={24} color="#1677ff" />
              AI需求分析系统
            </div>
            <div className="header-subtitle">将模糊需求转化为结构化、可执行的产品需求</div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#666', alignItems: 'center' }}>
            {/* 后端状态指示器 */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                padding: '4px 10px',
                borderRadius: 12,
                background: backendStatus?.ok ? '#f6ffed' : '#fff2f0',
                color: backendStatus?.ok ? '#389e0d' : '#cf1322',
                fontSize: 12,
                cursor: backendStatus?.ok ? 'default' : 'pointer'
              }}
              onClick={!backendStatus?.ok ? checkBackend : undefined}
              title={backendStatus?.ok ? `AI服务商: ${backendStatus.llm_provider || '未知'}` : '点击重新检测后端状态'}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: backendStatus?.ok ? '#52c41a' : '#ff4d4f',
                display: 'inline-block'
              }} />
              {backendStatus === null ? '检测中...' : backendStatus?.ok ? '后端正常' : '后端未连接'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={14} color="#52c41a" />
              文本输入
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={14} color="#52c41a" />
              需求理解
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={14} color="#52c41a" />
              矛盾检测
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={14} color="#52c41a" />
              PRD生成
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container">
        {/* Input Form */}
        <InputForm onSubmit={handleAnalyze} loading={loading} />

        {/* Loading State with Progress */}
        {loading && (
          <AnalysisProgress 
            steps={progressSteps} 
            error={null}
          />
        )}

        {/* Error Message */}
        {error && !loading && (
          <div className="card" style={{ borderLeft: '4px solid #ff4d4f' }}>
            <div style={{ 
              color: '#cf1322', 
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 8
            }}>
              {error.title}
            </div>
            {error.message && (
              <div style={{ 
                color: '#595959',
                fontSize: 14, 
                lineHeight: 1.8,
                marginBottom: error.suggestion ? 12 : 0
              }}>
                {error.message}
              </div>
            )}
            {error.suggestion && (
              <div style={{ 
                padding: '10px 14px',
                background: '#f6ffed',
                borderRadius: 8,
                color: '#389e0d',
                fontSize: 13,
                lineHeight: 1.8,
                whiteSpace: 'pre-line'
              }}>
                <strong>解决建议：</strong>
                {error.suggestion}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {(result || partialResults.understanding) && (
          <>
            {/* Processing Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
              padding: '12px 16px',
              background: '#e6f4ff',
              borderRadius: 8,
              fontSize: 13,
              color: '#0958d9'
            }}>
              <Clock size={16} />
              <span>需求ID: <strong>{result?.requirement_id || progressSteps?.[0]?.requirement_id || '分析中...'}</strong></span>
              {result?.processing_time_ms && (
                <>
                  <span>·</span>
                  <span>处理耗时: <strong>{result.processing_time_ms}ms</strong></span>
                </>
              )}
              <span>·</span>
              <span>状态: <strong style={{ color: result ? '#52c41a' : '#1677ff' }}>{result ? '分析完成' : '分析中...'}</strong></span>
            </div>

            {/* Completed Steps Summary (only show when done) */}
            {result?.steps && result.steps.length > 0 && !loading && (
              <AnalysisProgress steps={result.steps} />
            )}

            {/* Layer 2: Understanding */}
            {showUnderstanding && (
              <UnderstandingResult data={partialResults.understanding || result?.understanding} />
            )}

            {/* Layer 3: Analysis */}
            {showAnalysis && (
              <AnalysisResult data={partialResults.analysis || result?.analysis} />
            )}

            {/* Layer 4: Output */}
            {showOutput && (
              <OutputResult data={partialResults.output || result?.output} />
            )}
          </>
        )}

        {/* Empty State */}
        {!result && !loading && !error && !partialResults.understanding && (
          <div className="card empty-state">
            <div className="empty-state-icon">📝</div>
            <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
              输入您的需求描述，AI将为您进行全方位分析
            </div>
            <div style={{ fontSize: 13, color: '#999' }}>
              支持功能请求、问题反馈、解决方案设想等多种需求类型
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
