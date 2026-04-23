import React from 'react'
import { Brain, Target, Puzzle, HelpCircle } from 'lucide-react'

function UnderstandingResult({ data }) {
  if (!data) return null

  const { intent, entities, implied_requirements, fuzzy_points } = data

  const getConfidenceColor = (level) => {
    switch (level) {
      case '高': return 'tag-green'
      case '中': return 'tag-orange'
      case '低': return 'tag-red'
      default: return 'tag-blue'
    }
  }

  return (
    <div className="card">
      <div className="card-title">
        <Brain size={20} />
        需求理解结果
      </div>

      {/* 意图识别 */}
      <div className="section">
        <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Target size={16} />
          意图识别
        </div>
        <div className="list-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="tag tag-blue">{intent?.type || '未知'}</span>
            <span className={`tag ${getConfidenceColor(intent?.confidence)}`}>
              置信度: {intent?.confidence || '中'}
            </span>
          </div>
          <div className="list-item-desc">{intent?.description}</div>
          {intent?.deep_intent && (
            <div className="list-item-desc" style={{ marginTop: 4, color: '#1677ff' }}>
              💡 深层意图: {intent.deep_intent}
            </div>
          )}
        </div>
      </div>

      {/* 实体抽取 */}
      {entities && entities.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Puzzle size={16} />
            实体抽取 ({entities.length}个)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {entities.map((entity, i) => (
              <div key={i} style={{
                background: '#f5f5f5',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13
              }}>
                <div style={{ fontWeight: 500 }}>{entity.name}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  {entity.type} · 置信度{entity.confidence}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 隐含需求 */}
      {implied_requirements && implied_requirements.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Puzzle size={16} />
            隐含需求 ({implied_requirements.length}个)
          </div>
          {implied_requirements.map((req, i) => (
            <div key={i} className="list-item implied-item">
              <div className="list-item-title">{req.description}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                <span className="tag tag-orange">{req.status}</span>
                <span className={`tag ${getConfidenceColor(req.confidence)}`}>
                  置信度: {req.confidence}
                </span>
                <span style={{ fontSize: 12, color: '#888' }}>来源: {req.source}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 模糊点与澄清问题 */}
      {fuzzy_points && fuzzy_points.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <HelpCircle size={16} />
            需要澄清的问题 ({fuzzy_points.length}个)
          </div>
          {fuzzy_points.map((point, i) => (
            <div key={i} className="list-item question-item">
              <div className="list-item-title">{point.fuzzy_point}</div>
              <div style={{ marginTop: 8 }}>
                {point.options?.map((opt, j) => (
                  <div key={j} style={{
                    padding: '6px 10px',
                    background: 'white',
                    borderRadius: 6,
                    marginBottom: 6,
                    fontSize: 13,
                    border: '1px solid #d9d9d9'
                  }}>
                    {opt}
                  </div>
                ))}
              </div>
              {point.recommendation && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#1677ff' }}>
                  💡 建议: {point.recommendation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UnderstandingResult
