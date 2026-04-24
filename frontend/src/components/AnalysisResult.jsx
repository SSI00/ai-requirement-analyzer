import React from 'react'
import { GitBranch, AlertTriangle } from 'lucide-react'

function AnalysisResult({ data }) {
  if (!data) return null

  const { sub_requirements, conflicts, priorities } = data
  const priorityMap = new Map((priorities || []).map((item, index) => [item.requirement_id, { ...item, rank: index + 1 }]))

  const mergedRequirements = (sub_requirements || []).map(item => ({
    ...item,
    priorityDetail: priorityMap.get(item.id) || null
  }))

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Must Have': return 'tag-red'
      case 'Should Have': return 'tag-orange'
      case 'Could Have': return 'tag-blue'
      case "Won't Have": return 'tag-green'
      default: return 'tag-blue'
    }
  }

  const getImpactColor = (level) => {
    switch (level) {
      case '高': return 'tag-red'
      case '中': return 'tag-orange'
      case '低': return 'tag-green'
      default: return 'tag-blue'
    }
  }

  return (
    <div className="card">
      {mergedRequirements.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <GitBranch size={16} />
            需求拆解 ({mergedRequirements.length}项)
          </div>
          {mergedRequirements.map((item, index) => (
            <div key={index} className="list-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
                <span className="typography-body" style={{ fontWeight: 500 }}>
                  {item.id} · {item.title}
                </span>
                <span className={`tag ${getPriorityColor(item.priority)}`}>
                  {item.priority}
                </span>
              </div>
              <div className="list-item-desc">{item.description}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="tag tag-blue">{item.category}</span>
                {item.sub_category && <span className="tag tag-purple">{item.sub_category}</span>}
                <span className="typography-caption" style={{ color: '#888' }}>来源: {item.source}</span>
                {item.priorityDetail?.rank && (
                  <span className="typography-caption" style={{ color: '#1677ff', fontWeight: 500 }}>
                    排名 #{item.priorityDetail.rank}
                  </span>
                )}
                {typeof item.priorityDetail?.score === 'number' && (
                  <span className="typography-caption" style={{ color: '#666' }}>
                    评分: {item.priorityDetail.score}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {conflicts && conflicts.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={16} color="#ff4d4f" />
            检测到的矛盾 ({conflicts.length}项)
          </div>
          {conflicts.map((conflict, index) => (
            <div key={index} className="list-item conflict-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="tag tag-red">{conflict.conflict_type}</span>
                <span className={`tag ${getImpactColor(conflict.impact_level)}`}>
                  影响: {conflict.impact_level}
                </span>
              </div>
              <div className="list-item-title">{conflict.description}</div>
              <div style={{ marginTop: 8 }}>
                <div className="typography-caption" style={{ color: '#666', marginBottom: 4 }}>涉及需求</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {conflict.involved_requirements?.map((item, itemIndex) => (
                    <span key={itemIndex} className="tag tag-orange">{item}</span>
                  ))}
                </div>
              </div>
              {conflict.suggested_solutions && conflict.suggested_solutions.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="typography-caption" style={{ color: '#666', marginBottom: 4 }}>建议方案</div>
                  {conflict.suggested_solutions.map((solution, solutionIndex) => (
                    <div
                      key={solutionIndex}
                      style={{
                        background: 'white',
                        borderRadius: 6,
                        padding: '8px 12px',
                        marginBottom: 6
                      }}
                    >
                      <div className="typography-body" style={{ fontWeight: 500 }}>{solution.description}</div>
                      <div className="typography-caption" style={{ color: '#52c41a', marginTop: 2 }}>优点: {solution.pros}</div>
                      <div className="typography-caption" style={{ color: '#ff4d4f', marginTop: 2 }}>缺点: {solution.cons}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AnalysisResult
