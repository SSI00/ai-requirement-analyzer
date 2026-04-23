import React, { useState } from 'react'
import { HelpCircle, SkipForward, Send, AlertCircle } from 'lucide-react'

function ClarificationModal({ fuzzyPoints, onSubmit, onSkip, isLoading }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [customInput, setCustomInput] = useState('')

  if (!fuzzyPoints || fuzzyPoints.length === 0) return null

  const currentPoint = fuzzyPoints[currentIndex]
  const totalPoints = fuzzyPoints.length

  const handleSelectOption = (option) => {
    setAnswers(prev => ({
      ...prev,
      [currentPoint.fuzzy_point]: option
    }))
  }

  const handleCustomInput = () => {
    if (customInput.trim()) {
      setAnswers(prev => ({
        ...prev,
        [currentPoint.fuzzy_point]: customInput.trim()
      }))
      setCustomInput('')
    }
  }

  const handleNext = () => {
    if (currentIndex < totalPoints - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleSubmit = () => {
    // 整理所有回答
    const clarificationData = {
      answers: Object.entries(answers).map(([question, answer]) => ({
        question,
        answer
      })),
      skipped: false
    }
    onSubmit(clarificationData)
  }

  const handleSkipAll = () => {
    onSkip()
  }

  const currentAnswer = answers[currentPoint?.fuzzy_point]

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
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        width: '90%',
        maxWidth: 560,
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 8px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
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
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#333' }}>
              需要澄清的问题
            </div>
            <div style={{ fontSize: 13, color: '#999' }}>
              请回答以下 {totalPoints} 个问题以帮助我们更准确地分析需求
            </div>
          </div>
        </div>

        {/* Progress */}
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
          <span style={{ fontSize: 12, color: '#666', minWidth: 60 }}>
            {currentIndex + 1} / {totalPoints}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Question */}
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

          {/* Options */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>请选择或输入:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currentPoint.options?.map((option, i) => {
                const isSelected = currentAnswer === option
                return (
                  <div
                    key={i}
                    onClick={() => handleSelectOption(option)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: isSelected ? '2px solid #1677ff' : '1px solid #d9d9d9',
                      background: isSelected ? '#e6f4ff' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {option}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Custom input option */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>或者自定义回答:</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="输入您的回答..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid #d9d9d9',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
              <button
                onClick={handleCustomInput}
                style={{
                  padding: '10px 16px',
                  borderRadius: 6,
                  background: '#f5f5f5',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                确认
              </button>
            </div>
          </div>

          {/* Current answer display */}
          {currentAnswer && (
            <div style={{
              padding: '10px 12px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 13,
              color: '#52c41a'
            }}>
              已选择: {currentAnswer}
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={handlePrev}
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
                onClick={handleNext}
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
                提交回答
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e8e8e8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: 12, color: '#999' }}>
            已回答 {Object.keys(answers).length} / {totalPoints} 个问题
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
            跳过全部，使用默认值继续
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClarificationModal