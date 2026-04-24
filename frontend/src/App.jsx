import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Sparkles,
  Clock,
  ChevronDown,
  FileText,
  Layers,
  History,
  Download,
  SlidersHorizontal
} from 'lucide-react'
import InputForm from './components/InputForm'
import AnalysisProgress from './components/AnalysisProgress'
import UnderstandingResult from './components/UnderstandingResult'
import AnalysisResult from './components/AnalysisResult'
import OutputResult from './components/OutputResult'
import CompactResult from './components/CompactResult'
import HistorySidebar from './components/HistorySidebar'
import ClarificationModal from './components/ClarificationModal'
import SettingsPanel from './components/SettingsPanel'
import { analyzeRequirementStream, healthCheck, continueAnalysis } from './services/api'
import { saveAnalysisRecord, getHistory } from './services/storage'
import { exportToMarkdown, exportToDocx, exportToTxt, exportToPdf } from './services/exportService'
import { applyUISettings, getUISettings, saveUISettings } from './services/settings'

function applyClarificationAnswers(understanding, answers = []) {
  if (!understanding) return understanding

  const answerMap = new Map(
    answers
      .filter(item => item?.question && item?.answer?.trim())
      .map(item => [item.question, item.answer.trim()])
  )

  return {
    ...understanding,
    fuzzy_points: (understanding.fuzzy_points || []).map(point => {
      const answer = answerMap.get(point.fuzzy_point)
      if (!answer) return point

      return {
        ...point,
        resolved: true,
        user_answer: answer
      }
    })
  }
}

function buildClarificationResumeSteps(steps, skipped = false) {
  if (!Array.isArray(steps)) return steps

  return steps.map(step => {
    switch (step.step) {
      case 'implied_mining':
        return {
          ...step,
          status: 'completed',
          message: skipped ? '已跳过澄清，继续分析...' : '澄清已确认，继续分析...'
        }
      case 'requirement_decomposition':
        return {
          ...step,
          status: 'running',
          message: '正在基于澄清结果拆解需求...'
        }
      case 'conflict_detection':
        return {
          ...step,
          status: 'running',
          message: '正在识别需求之间的冲突...'
        }
      case 'output_generation':
        return {
          ...step,
          status: 'pending',
          message: '等待生成结构化输出...'
        }
      default:
        return step
    }
  })
}

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
  const [viewMode, setViewMode] = useState('result')
  const [collapsedPanels, setCollapsedPanels] = useState({
    understanding: false,
    analysis: false,
    output: false
  })
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyList, setHistoryList] = useState([])
  const [loadedHistory, setLoadedHistory] = useState(null)
  const [clarificationNeeded, setClarificationNeeded] = useState(false)
  const [fuzzyPoints, setFuzzyPoints] = useState([])
  const [requirementId, setRequirementId] = useState(null)
  const [submittingClarification, setSubmittingClarification] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [uiSettings, setUiSettings] = useState(() => getUISettings())

  const cancelRef = useRef(null)

  useEffect(() => {
    checkBackend()
    setHistoryList(getHistory())
  }, [])

  useEffect(() => {
    applyUISettings(uiSettings)
  }, [uiSettings])

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
    } catch {
      setBackendStatus({ ok: false })
    }
  }

  const syncSettings = useCallback((updater) => {
    setUiSettings(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return saveUISettings(next)
    })
  }, [])

  const handleSettingChange = useCallback((field, value) => {
    syncSettings(prev => ({ ...prev, [field]: value }))
  }, [syncSettings])

  const handleClarificationClose = useCallback(() => {
    setClarificationNeeded(false)
    setError(null)
  }, [])

  const handleLoadHistory = useCallback((item) => {
    if (!item?.result) {
      setResult(null)
      setLoadedHistory(null)
      return
    }

    setResult(item.result)
    setProgressSteps(item.result.steps)
    setPartialResults({
      understanding: item.result.understanding,
      analysis: item.result.analysis,
      output: item.result.output
    })
    setLoadedHistory(item)
    setViewMode(uiSettings.defaultView)
    setCollapsedPanels({
      understanding: false,
      analysis: false,
      output: false
    })
    setError(null)
  }, [uiSettings.defaultView])

  const handleClearLoadedHistory = useCallback(() => {
    setResult(null)
    setProgressSteps(null)
    setPartialResults({
      understanding: null,
      analysis: null,
      output: null
    })
    setLoadedHistory(null)
  }, [])

  const persistResultIfNeeded = useCallback((payload) => {
    if (!uiSettings.autoSaveHistory) return
    saveAnalysisRecord(payload)
    setHistoryList(getHistory())
  }, [uiSettings.autoSaveHistory])

  const handleAnalyze = useCallback((content, projectContext) => {
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
    setClarificationNeeded(false)
    setLoadedHistory({
      requirement_content: content,
      project_context: projectContext
    })

    window.lastAnalysisContent = content
    window.lastAnalysisContext = projectContext

    const cancel = analyzeRequirementStream(content, projectContext, {
      onProgress: (data) => {
        setProgressSteps(data.steps)
      },
      onClarificationNeeded: (data) => {
        setClarificationNeeded(true)
        setFuzzyPoints(data.fuzzy_points || [])
        setRequirementId(data.requirement_id)
        setLoading(false)
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
        setClarificationNeeded(false)
        setViewMode(uiSettings.defaultView)
        persistResultIfNeeded({
          requirement_content: content,
          project_context: projectContext,
          result: data
        })
      },
      onError: (err, data) => {
        setLoading(false)
        setClarificationNeeded(false)

        if (data?.steps) {
          setProgressSteps(data.steps)
        }

        let errorTitle = '分析请求失败'
        let errorMessage = err.message || '发生未知错误'
        let suggestion = '请稍后重试'

        if (errorMessage.includes('timeout') || errorMessage.includes('ECONNABORTED')) {
          errorTitle = '请求超时'
          errorMessage = 'AI 分析耗时较长，本次请求已超时。'
          suggestion = '可以稍后重试，或适当简化需求描述。'
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          errorTitle = '无法连接后端'
          errorMessage = '前端无法连接到后端 API 服务。'
          suggestion = '请确认后端服务已经启动，并且监听在正确端口。'
        } else {
          try {
            const parsed = JSON.parse(errorMessage)
            const detail = parsed?.detail
            if (detail && typeof detail === 'object') {
              errorTitle = detail.type === 'llm_error' ? 'AI 服务不可用' : errorTitle
              errorMessage = detail.message || errorMessage
              suggestion = detail.suggestion || suggestion
            }
          } catch {
            // ignore parse errors
          }
        }

        setError({
          title: errorTitle,
          message: errorMessage,
          suggestion
        })
      }
    })

    cancelRef.current = cancel
  }, [persistResultIfNeeded, uiSettings.defaultView])

  const handleClarificationSubmit = useCallback(async (clarificationData) => {
    if (!requirementId) return

    const answers = (clarificationData.answers || []).filter(item => item?.answer?.trim())
    const optimisticUnderstanding = applyClarificationAnswers(partialResults.understanding, answers)
    const lastContent = loadedHistory?.requirement_content || window.lastAnalysisContent || ''
    const lastContext = loadedHistory?.project_context || window.lastAnalysisContext || ''

    setSubmittingClarification(true)
    setLoading(true)
    setError(null)
    setClarificationNeeded(false)
    setViewMode(uiSettings.defaultView)

    if (optimisticUnderstanding) {
      setPartialResults(prev => ({
        ...prev,
        understanding: optimisticUnderstanding
      }))
    }

    setProgressSteps(prev => buildClarificationResumeSteps(prev, false))

    try {
      const continueResult = await continueAnalysis(requirementId, answers, false)
      setResult(continueResult)
      setProgressSteps(continueResult.steps)
      setPartialResults({
        understanding: continueResult.understanding,
        analysis: continueResult.analysis,
        output: continueResult.output
      })
      setLoading(false)

      if (lastContent) {
        persistResultIfNeeded({
          requirement_content: lastContent,
          project_context: lastContext,
          result: continueResult
        })
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      setError({
        title: detail?.type === 'context_not_found' ? '分析会话已过期' : '继续分析失败',
        message: detail?.message || err.message || '无法继续完成分析',
        suggestion: detail?.suggestion || '请重试，或重新发起一次分析'
      })
      setLoading(false)
    } finally {
      setSubmittingClarification(false)
    }
  }, [loadedHistory, partialResults.understanding, persistResultIfNeeded, requirementId, uiSettings.defaultView])

  const handleClarificationSkip = useCallback(async () => {
    if (!requirementId) return

    setSubmittingClarification(true)
    setLoading(true)
    setError(null)
    setClarificationNeeded(false)
    setViewMode(uiSettings.defaultView)
    setProgressSteps(prev => buildClarificationResumeSteps(prev, true))

    try {
      const continueResult = await continueAnalysis(requirementId, [], true)
      setResult(continueResult)
      setProgressSteps(continueResult.steps)
      setPartialResults({
        understanding: continueResult.understanding,
        analysis: continueResult.analysis,
        output: continueResult.output
      })
      setLoading(false)

      const lastContent = loadedHistory?.requirement_content || window.lastAnalysisContent || ''
      const lastContext = loadedHistory?.project_context || window.lastAnalysisContext || ''
      if (lastContent) {
        persistResultIfNeeded({
          requirement_content: lastContent,
          project_context: lastContext,
          result: continueResult
        })
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      setError({
        title: detail?.type === 'context_not_found' ? '分析会话已过期' : '继续分析失败',
        message: detail?.message || err.message || '无法跳过澄清后继续分析',
        suggestion: detail?.suggestion || '请重试，或重新发起一次分析'
      })
      setLoading(false)
    } finally {
      setSubmittingClarification(false)
    }
  }, [loadedHistory, persistResultIfNeeded, requirementId, uiSettings.defaultView])

  const handleExport = useCallback(async (format, mode = 'full') => {
    if (!result) return

    setExportMenuOpen(false)

    try {
      switch (format) {
        case 'md':
          await exportToMarkdown(result, mode)
          break
        case 'docx':
          await exportToDocx(result, mode)
          break
        case 'txt':
          await exportToTxt(result, mode)
          break
        case 'pdf':
          await exportToPdf(result, mode)
          break
        default:
          break
      }
    } catch (err) {
      setError({
        title: '导出失败',
        message: err.message || '无法导出文件',
        suggestion: '请重试或更换一种导出格式'
      })
    }
  }, [result])

  const showUnderstanding = partialResults.understanding || result?.understanding
  const showAnalysis = partialResults.analysis || result?.analysis
  const showOutput = partialResults.output || result?.output
  const displayedSteps = progressSteps?.length ? progressSteps : (result?.steps || null)

  return (
    <div>
      <header className="header">
        <div className="header-content">
          <div>
            <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={24} color="#1677ff" />
              AI 需求分析系统
            </div>
            <div className="header-subtitle">将模糊需求转化为结构化、可执行的分析结果</div>
          </div>

          <div className="typography-body-sm" style={{ display: 'flex', gap: 12, color: '#666', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 12,
                background: backendStatus?.ok ? '#f6ffed' : '#fff2f0',
                color: backendStatus?.ok ? '#389e0d' : '#cf1322',
                fontSize: 'var(--font-size-caption)',
                cursor: backendStatus?.ok ? 'default' : 'pointer'
              }}
              onClick={!backendStatus?.ok ? checkBackend : undefined}
              title={backendStatus?.ok ? `AI 服务商: ${backendStatus.llm_provider || '未知'}` : '点击重新检测后端状态'}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: backendStatus?.ok ? '#52c41a' : '#ff4d4f',
                  display: 'inline-block'
                }}
              />
              {backendStatus === null ? '检测中...' : backendStatus?.ok ? '后端正常' : '后端未连接'}
            </div>

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
                fontSize: 'var(--font-size-caption)',
                cursor: 'pointer'
              }}
            >
              <History size={14} />
              历史记录
              {historyList.length > 0 && (
                <span
                  style={{
                    background: '#1677ff',
                    color: 'white',
                    borderRadius: 10,
                    padding: '0 6px',
                    fontSize: '11px'
                  }}
                >
                  {historyList.length}
                </span>
              )}
            </button>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setSettingsOpen(prev => !prev)
                  setExportMenuOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 12,
                  background: '#f5f5f5',
                  border: '1px solid #e8e8e8',
                  color: '#444',
                  fontSize: 'var(--font-size-caption)',
                  cursor: 'pointer'
                }}
              >
                <SlidersHorizontal size={14} />
                设置
              </button>

              {settingsOpen && (
                <SettingsPanel
                  settings={uiSettings}
                  onChange={handleSettingChange}
                  onClose={() => setSettingsOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        <InputForm
          onSubmit={handleAnalyze}
          loading={loading}
          initialContent={loadedHistory?.requirement_content || ''}
          initialContext={loadedHistory?.project_context || ''}
          onClear={handleClearLoadedHistory}
        />

        {loading && <AnalysisProgress steps={progressSteps} error={null} />}

        {error && !loading && (
          <div className="card" style={{ borderLeft: '4px solid #ff4d4f' }}>
            <div className="typography-body" style={{ color: '#cf1322', fontWeight: 600, marginBottom: 8 }}>
              {error.title}
            </div>
            {error.message && (
              <div className="typography-body" style={{ color: '#595959', marginBottom: error.suggestion ? 12 : 0 }}>
                {error.message}
              </div>
            )}
            {error.suggestion && (
              <div
                className="typography-body-sm"
                style={{
                  padding: '10px 14px',
                  background: '#f6ffed',
                  borderRadius: 8,
                  color: '#389e0d',
                  whiteSpace: 'pre-line'
                }}
              >
                <strong>解决建议：</strong>
                {error.suggestion}
              </div>
            )}
          </div>
        )}

        {(result || partialResults.understanding) && (
          <>
            <div
              className="typography-body-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                padding: '12px 16px',
                background: '#e6f4ff',
                borderRadius: 8,
                color: '#0958d9'
              }}
            >
              <Clock size={16} />
              <span>需求 ID: <strong>{result?.requirement_id || displayedSteps?.[0]?.requirement_id || '分析中...'}</strong></span>
              {result?.processing_time_ms && (
                <>
                  <span>·</span>
                  <span>处理耗时: <strong>{result.processing_time_ms}ms</strong></span>
                </>
              )}
              <span>·</span>
              <span>状态: <strong style={{ color: result ? '#52c41a' : '#1677ff' }}>{result ? '分析完成' : '分析中...'}</strong></span>

              {result && (
                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                  <button
                    onClick={() => {
                      setExportMenuOpen(prev => !prev)
                      setSettingsOpen(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #d9d9d9',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-body-sm)'
                    }}
                  >
                    <Download size={14} />
                    导出
                  </button>

                  {exportMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: 4,
                        background: 'white',
                        border: '1px solid #e8e8e8',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 100,
                        minWidth: 160
                      }}
                    >
                      {[
                        {
                          key: 'full',
                          title: '完整结果',
                          items: [
                            { format: 'md', label: 'Markdown (.md)' },
                            { format: 'docx', label: 'Word (.docx)' },
                            { format: 'txt', label: '文本 (.txt)' },
                            { format: 'pdf', label: 'PDF (.pdf)' }
                          ]
                        },
                        {
                          key: 'compact',
                          title: '精简结果',
                          items: [
                            { format: 'md', label: 'Markdown (.md)' },
                            { format: 'docx', label: 'Word (.docx)' },
                            { format: 'txt', label: '文本 (.txt)' },
                            { format: 'pdf', label: 'PDF (.pdf)' }
                          ]
                        }
                      ].map(group => (
                        <div key={group.key}>
                          <div
                            style={{
                              padding: '10px 16px 6px',
                              fontSize: 'var(--font-size-caption)',
                              fontWeight: 600,
                              color: '#8c8c8c',
                              background: '#fafafa',
                              borderBottom: '1px solid #f0f0f0'
                            }}
                          >
                            {group.title}
                          </div>
                          {group.items.map(item => (
                            <div
                              key={`${group.key}-${item.format}`}
                              onClick={() => handleExport(item.format, group.key)}
                              style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                fontSize: 'var(--font-size-body-sm)',
                                borderBottom: '1px solid #f0f0f0',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                            >
                              {item.label}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {result && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
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
                <button
                  onClick={() => setViewMode('compact')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: viewMode === 'compact' ? '2px solid #1677ff' : '1px solid #d9d9d9',
                    background: viewMode === 'compact' ? '#e6f4ff' : 'white',
                    color: viewMode === 'compact' ? '#1677ff' : '#666',
                    fontWeight: viewMode === 'compact' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Sparkles size={16} />
                  精简结果
                </button>
              </div>
            )}

            {viewMode === 'process' ? (
              displayedSteps && displayedSteps.length > 0 && <AnalysisProgress steps={displayedSteps} />
            ) : viewMode === 'compact' ? (
              <CompactResult
                understanding={partialResults.understanding || result?.understanding}
                analysis={partialResults.analysis || result?.analysis}
                output={partialResults.output || result?.output}
              />
            ) : (
              <>
                {showUnderstanding && (
                  <div style={{ marginBottom: 16, border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
                    <div
                      onClick={() => setCollapsedPanels(prev => ({ ...prev, understanding: !prev.understanding }))}
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
                      <div className="typography-caption" style={{ color: '#888' }}>
                        {collapsedPanels.understanding ? '点击展开' : '点击折叠'}
                      </div>
                    </div>
                    {!collapsedPanels.understanding && <UnderstandingResult data={partialResults.understanding || result?.understanding} />}
                  </div>
                )}

                {showAnalysis && (
                  <div style={{ marginBottom: 16, border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
                    <div
                      onClick={() => setCollapsedPanels(prev => ({ ...prev, analysis: !prev.analysis }))}
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
                      <div className="typography-caption" style={{ color: '#888' }}>
                        {collapsedPanels.analysis ? '点击展开' : '点击折叠'}
                      </div>
                    </div>
                    {!collapsedPanels.analysis && <AnalysisResult data={partialResults.analysis || result?.analysis} />}
                  </div>
                )}

                {showOutput && (
                  <div style={{ marginBottom: 16, border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
                    <div
                      onClick={() => setCollapsedPanels(prev => ({ ...prev, output: !prev.output }))}
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
                      <div className="typography-caption" style={{ color: '#888' }}>
                        {collapsedPanels.output ? '点击展开' : '点击折叠'}
                      </div>
                    </div>
                    {!collapsedPanels.output && <OutputResult data={partialResults.output || result?.output} />}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!result && !loading && !error && !partialResults.understanding && (
          <div className="card empty-state">
            <div className="empty-state-icon">📘</div>
            <div className="typography-body" style={{ color: '#666', marginBottom: 8 }}>
              输入你的需求描述，AI 会为你生成结构化分析结果
            </div>
            <div className="typography-body-sm" style={{ color: '#999' }}>
              支持功能需求、问题反馈、解决方案设想等多种需求类型
            </div>
          </div>
        )}

        <HistorySidebar
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          history={historyList}
          onLoadHistory={handleLoadHistory}
          onRefreshHistory={() => setHistoryList(getHistory())}
        />

        {clarificationNeeded && (
          <ClarificationModal
            fuzzyPoints={fuzzyPoints}
            onSubmit={handleClarificationSubmit}
            onSkip={handleClarificationSkip}
            onClose={handleClarificationClose}
            isLoading={submittingClarification}
            error={error}
          />
        )}

        {(exportMenuOpen || settingsOpen) && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 50 }}
            onClick={() => {
              setExportMenuOpen(false)
              setSettingsOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App
