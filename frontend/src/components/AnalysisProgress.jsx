import React from 'react'
import { CheckCircle2, Circle, Loader2, AlertCircle, Zap } from 'lucide-react'

const STEP_CONFIG = [
  { key: 'intent_recognition', name: '意图识别', description: '分析用户核心意图' },
  { key: 'entity_extraction', name: '实体抽取', description: '提取关键业务实体' },
  { key: 'implied_mining', name: '隐含挖掘', description: '推导未明确需求' },
  { key: 'requirement_decomposition', name: '需求拆解', description: '拆分为可执行单元' },
  { key: 'conflict_detection', name: '矛盾检测', description: '识别需求间冲突' },
  { key: 'output_generation', name: '输出生成', description: '生成用户故事与验收标准' },
]

function AnalysisProgress({ steps, error }) {
  const hasSteps = steps && steps.length > 0

  // 将后端步骤数据与配置合并
  const mergedSteps = STEP_CONFIG.map(config => {
    const stepData = hasSteps ? (steps.find(s => s.step === config.key) || {}) : {}
    return {
      ...config,
      status: stepData.status || 'pending',
      message: stepData.message || ''
    }
  })

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={20} color="#52c41a" />
      case 'running':
        return <Loader2 size={20} color="#1677ff" className="spin-icon" />
      case 'failed':
        return <AlertCircle size={20} color="#ff4d4f" />
      default:
        return <Circle size={20} color="#d9d9d9" />
    }
  }

  const getStepStyle = (status) => {
    switch (status) {
      case 'completed':
        return { borderLeftColor: '#52c41a', background: '#f6ffed' }
      case 'running':
        return { borderLeftColor: '#1677ff', background: '#e6f4ff' }
      case 'failed':
        return { borderLeftColor: '#ff4d4f', background: '#fff2f0' }
      default:
        return { borderLeftColor: '#d9d9d9', background: '#fafafa' }
    }
  }

  const completedCount = mergedSteps.filter(s => s.status === 'completed').length
  const runningCount = mergedSteps.filter(s => s.status === 'running').length
  const totalCount = mergedSteps.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  // 判断是否还在进行中
  const isInProgress = runningCount > 0 || completedCount < totalCount

  return (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isInProgress ? (
            <Loader2 size={20} className="spin-icon" color="#1677ff" />
          ) : (
            <Zap size={20} color="#52c41a" />
          )}
          {isInProgress ? 'AI正在分析您的需求' : '分析完成'}
        </span>
        <span style={{ fontSize: 14, color: '#666' }}>
          {completedCount}/{totalCount} ({progressPercent}%)
        </span>
      </div>

      {/* 进度条 */}
      <div style={{
        width: '100%',
        height: 6,
        background: '#f0f0f0',
        borderRadius: 3,
        marginBottom: 20,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          background: isInProgress ? '#1677ff' : '#52c41a',
          borderRadius: 3,
          transition: 'width 0.5s ease, background 0.3s ease'
        }} />
      </div>

      {/* 步骤列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mergedSteps.map((step, index) => (
          <div
            key={step.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 8,
              borderLeft: '3px solid',
              transition: 'all 0.3s ease',
              ...getStepStyle(step.status)
            }}
          >
            <div style={{ flexShrink: 0 }}>
              {getStepIcon(step.status)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 14,
                fontWeight: step.status === 'running' ? 600 : 500,
                color: step.status === 'pending' ? '#999' : '#1a1a1a'
              }}>
                {step.name}
              </div>
              <div style={{
                fontSize: 12,
                color: step.status === 'pending' ? '#bbb' : '#666',
                marginTop: 2
              }}>
                {step.message || step.description}
              </div>
            </div>
            <div style={{
              fontSize: 12,
              color: step.status === 'completed' ? '#52c41a' : step.status === 'running' ? '#1677ff' : '#bbb',
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}>
              {step.status === 'completed' && '已完成'}
              {step.status === 'running' && '进行中...'}
              {step.status === 'failed' && '失败'}
              {step.status === 'pending' && '等待中'}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: 8,
          color: '#cf1322',
          fontSize: 13
        }}>
          <strong>分析出错：</strong>{error}
        </div>
      )}
    </div>
  )
}

export default AnalysisProgress
