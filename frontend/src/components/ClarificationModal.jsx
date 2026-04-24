import React, { useEffect, useState } from 'react'
import { HelpCircle, SkipForward, Send, AlertCircle, X } from 'lucide-react'

function ClarificationModal({ fuzzyPoints, onSubmit, onSkip, onClose, isLoading, error }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})

  useEffect(() => {
    setCurrentIndex(0)
    setAnswers({})
  }, [fuzzyPoints])

  if (!fuzzyPoints || fuzzyPoints.length === 0) return null

  const currentPoint = fuzzyPoints[currentIndex]
  const totalPoints = fuzzyPoints.length
  const currentAnswer = answers[currentPoint?.fuzzy_point] || ''
  const answeredCount = fuzzyPoints.filter(point => answers[point.fuzzy_point]?.trim()).length

  const handleSelectOption = (option) => {
    setAnswers(prev => ({
      ...prev,
      [currentPoint.fuzzy_point]: option
    }))
  }

  const handleAnswerChange = (value) => {
    setAnswers(prev => ({
      ...prev,
      [currentPoint.fuzzy_point]: value
    }))
  }

  const handleSubmit = () => {
    const answersList = fuzzyPoints
      .map(point => ({
        question: point.fuzzy_point,
        answer: (answers[point.fuzzy_point] || '').trim()
      }))
      .filter(item => item.answer)

    onSubmit({ answers: answersList, skipped: false })
  }

  const handleSkipAll = () => {
    onSkip()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        position: 'relative',
        width: '90%',
        maxWidth: 560
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: -18,
            right: -18,
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.95)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(0,0,0,0.18)'
          }}
          title="关闭"
        >
          <X size={18} color="#666" />
        </button>

        <div style={{
          background: 'white',
          borderRadius: 12,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e8e8e8',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#fff7e6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HelpCircle size={20} color="#fa8c16" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: '#333' }}>
                需要澄清的问题
              </div>
              <div style={{ fontSize: 13, color: '#999' }}>
                可以直接选推荐项，也可以手动输入更准确的答案
              </div>
            </div>
          </div>

          <div style={{
            padding: '12px 24px',
            background: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{ flex: 1, height: 4, background: '#e8e8e8', borderRadius: 2 }}>
              <div style={{
                width: `${((currentIndex + 1) / totalPoints) * 100}%`,
                height: '100%',
                background: '#1677ff',
                borderRadius: 2,
                transition: 'width 0.3s'
              }} />
            </div>
            <span style={{ fontSize: 12, color: '#666', minWidth: 72 }}>
              {currentIndex + 1} / {totalPoints}
            </span>
          </div>

          <div style={{ padding: '24px' }}>
            {error && (
              <div style={{
                padding: '12px 16px',
                background: '#fff2f0',
                border: '1px solid #ffccc7',
                borderRadius: 8,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8
              }}>
                <AlertCircle size={16} color="#ff4d4f" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: '#cf1322', marginBottom: 4 }}>
                    {error.title || '提交失败'}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {error.message}
                  </div>
                  {error.suggestion && (
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      建议: {error.suggestion}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{
              padding: '16px',
              background: '#f9f9f9',
              borderRadius: 8,
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertCircle size={16} color="#fa8c16" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 500, color: '#333', marginBottom: 4 }}>
                    {currentPoint.fuzzy_point}
                  </div>
                  {currentPoint.impact && (
                    <div style={{ fontSize: 12, color: '#666' }}>
                      影响: {currentPoint.impact}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>推荐选项</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentPoint.options?.map((option, i) => {
                  const isSelected = currentAnswer === option

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectOption(option)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: isSelected ? '2px solid #1677ff' : '1px solid #d9d9d9',
                        background: isSelected ? '#e6f4ff' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        fontSize: 13
                      }}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>手动输入</div>
              <textarea
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="如果推荐选项不完全符合，可以在这里输入更准确的说明..."
                rows={4}
                style={{
                  width: '100%',
                  resize: 'vertical',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid #d9d9d9',
                  fontSize: 13,
                  lineHeight: 1.6,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                点击选项会自动填入，你也可以继续修改成自己的表述。
              </div>
            </div>

            {currentAnswer.trim() && (
              <div style={{
                padding: '10px 12px',
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 13,
                color: '#389e0d'
              }}>
                当前答案: {currentAnswer}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                style={{
                  padding: '10px 20px',
                  borderRadius: 6,
                  border: '1px solid #d9d9d9',
                  background: 'white',
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentIndex === 0 ? 0.5 : 1
                }}
              >
                上一个
              </button>

              {currentIndex < totalPoints - 1 ? (
                <button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#1677ff',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  下一个
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#52c41a',
                    color: 'white',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Send size={14} />
                  确认并提交
                </button>
              )}
            </div>
          </div>

          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e8e8e8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: 12, color: '#999' }}>
              已填写 {answeredCount} / {totalPoints} 个问题
            </div>
            <button
              onClick={handleSkipAll}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #d9d9d9',
                background: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: '#666'
              }}
            >
              <SkipForward size={14} />
              跳过全部
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClarificationModal
