import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, Clock, CheckCircle, ChevronDown, ChevronUp, FileText, Layers, History } from 'lucide-react'
import InputForm from './components/InputForm'
import AnalysisProgress from './components/AnalysisProgress'
import UnderstandingResult from './components/UnderstandingResult'
import AnalysisResult from './components/AnalysisResult'
import OutputResult from './components/OutputResult'
import HistorySidebar from './components/HistorySidebar'
import { analyzeRequirementStream, healthCheck } from './services/api'
import { saveAnalysisRecord, getHistory } from './services/storage'

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
  // P0: 视图切换状态
  const [viewMode, setViewMode] = useState('result') // 'process' | 'result'
  // P0: 面板折叠状态
  const [collapsedPanels, setCollapsedPanels] = useState({
    understanding: false,
    analysis: false,
    output: false
  })
  // P1: 历史记录状态
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyList, setHistoryList] = useState([])
  const [loadedHistory, setLoadedHistory] = useState(null) // 从历史加载的记录

  const cancelRef = useRef(null)

  // 页面加载时检查后端状态 & 加载历史记录
  useEffect(() => {
    checkBackend()
    setHistoryList(getHistory())
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

  // P1: 加载历史记录
  const handleLoadHistory = useCallback((item) => {
    if (item) {
      setLoadedHistory(item)
    } else {
      setLoadedHistory(null)
    }
  }, [])

  // P1: 清除加载的历史记录
  const handleClearLoadedHistory = useCallback(() => {
    setLoadedHistory(null)
  }, [])

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
        // P0: 分析完成后默认显示结果视图
        setViewMode('result')
        // P1: 保存到本地存储
        saveAnalysisRecord({
          requirement_content: content,
          project_context: projectContext,
          result: data
        })
        setHistoryList(getHistory())
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
            {/* P1: 历史记录按钮 */}
            <button
              onClick={() => setHistoryOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 12,
                background: '#e6f4ff',
                border: 'none',
                color: '#1677ff',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              <History size={14} />
              历史记录
              {historyList.length > 0 && (
                <span style={{
                  background: '#1677ff',
                  color: 'white',
                  borderRadius: 10,
                  padding: '0 6px',
                  fontSize: 11
                }}>
                  {historyList.length}
                </span>
              )}
            </button>
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
        <InputForm
          onSubmit={handleAnalyze}
          loading={loading}
          initialContent={loadedHistory?.requirement_content || ''}
          initialContext={loadedHistory?.project_context || ''}
          onClear={handleClearLoadedHistory}
        />

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

            {/* P0: View Mode Toggle - 分析完成后显示 */}
            {result && (
              <div style={{
                display: 'flex',
                gap: 8,
                marginBottom: 16
              }}>
                <button
                  onClick={() => setViewMode('process')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: viewMode === 'process' ? '2px solid #1677ff' : '1px solid #d9d9d9',
                    background: viewMode === 'process' ? '#e6f4ff' : 'white',
                    color: viewMode === 'process' ? '#1677ff' : '#666',
                    fontWeight: viewMode === 'process' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Layers size={16} />
                  过程
                </button>
                <button
                  onClick={() => setViewMode('result')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: viewMode === 'result' ? '2px solid #1677ff' : '1px solid #d9d9d9',
                    background: viewMode === 'result' ? '#e6f4ff' : 'white',
                    color: viewMode === 'result' ? '#1677ff' : '#666',
                    fontWeight: viewMode === 'result' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <FileText size={16} />
                  结果
                </button>
              </div>
            )}

            {/* P0: View Mode Content */}
            {viewMode === 'process' ? (
              /* 过程视图：只显示进度 */
              result?.steps && result.steps.length > 0 && (
                <AnalysisProgress steps={result.steps} />
              )
            ) : (
              /* 结果视图：显示三个面板，可折叠 */
              <>
                {/* Layer 2: Understanding */}
                {showUnderstanding && (
                  <div style={{
                    marginBottom: 16,
                    border: '1px solid #e8e8e8',
                    borderRadius: 8,
                    overflow: 'hidden'
                  }}>
                    <div
                      onClick={() => setCollapsedPanels(p => ({ ...p, understanding: !p.understanding }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#fafafa',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                        <ChevronDown size={18} style={{ transform: collapsedPanels.understanding ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
                        需求理解结果
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        {collapsedPanels.understanding ? '点击展开' : '点击折叠'}
                      </div>
                    </div>
                    {!collapsedPanels.understanding && (
                      <UnderstandingResult data={partialResults.understanding || result?.understanding} />
                    )}
                  </div>
                )}

                {/* Layer 3: Analysis */}
                {showAnalysis && (
                  <div style={{
                    marginBottom: 16,
                    border: '1px solid #e8e8e8',
                    borderRadius: 8,
                    overflow: 'hidden'
                  }}>
                    <div
                      onClick={() => setCollapsedPanels(p => ({ ...p, analysis: !p.analysis }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#fafafa',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                        <ChevronDown size={18} style={{ transform: collapsedPanels.analysis ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
                        需求分析结果
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        {collapsedPanels.analysis ? '点击展开' : '点击折叠'}
                      </div>
                    </div>
                    {!collapsedPanels.analysis && (
                      <AnalysisResult data={partialResults.analysis || result?.analysis} />
                    )}
                  </div>
                )}

                {/* Layer 4: Output */}
                {showOutput && (
                  <div style={{
                    marginBottom: 16,
                    border: '1px solid #e8e8e8',
                    borderRadius: 8,
                    overflow: 'hidden'
                  }}>
                    <div
                      onClick={() => setCollapsedPanels(p => ({ ...p, output: !p.output }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#fafafa',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                        <ChevronDown size={18} style={{ transform: collapsedPanels.output ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
                        结构化输出
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        {collapsedPanels.output ? '点击展开' : '点击折叠'}
                      </div>
                    </div>
                    {!collapsedPanels.output && (
                      <OutputResult data={partialResults.output || result?.output} />
                    )}
                  </div>
                )}
              </>
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

        {/* P1: 历史记录侧边栏 */}
        <HistorySidebar
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          history={historyList}
          onLoadHistory={handleLoadHistory}
        />
      </div>
    </div>
  )
}

export default App
