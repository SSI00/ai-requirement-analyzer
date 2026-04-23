import React from 'react'
import { GitBranch, AlertTriangle, BarChart3 } from 'lucide-react'

function AnalysisResult({ data }) {
  if (!data) return null

  const { sub_requirements, conflicts, priorities } = data

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
      {/* 移除外层重复标题 */}

      {/* 子需求列表 */}
      {sub_requirements && sub_requirements.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <GitBranch size={16} />
            需求拆解 ({sub_requirements.length}个)
          </div>
          {sub_requirements.map((req, i) => (
            <div key={i} className="list-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>
                  {req.id} · {req.title}
                </span>
                <span className={`tag ${getPriorityColor(req.priority)}`}>
                  {req.priority}
                </span>
              </div>
              <div className="list-item-desc">{req.description}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <span className="tag tag-blue">{req.category}</span>
                {req.sub_category && <span className="tag tag-purple">{req.sub_category}</span>}
                <span style={{ fontSize: 12, color: '#888' }}>来源: {req.source}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 矛盾检测 */}
      {conflicts && conflicts.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={16} color="#ff4d4f" />
            检测到矛盾 ({conflicts.length}个)
          </div>
          {conflicts.map((conflict, i) => (
            <div key={i} className="list-item conflict-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="tag tag-red">{conflict.conflict_type}</span>
                <span className={`tag ${getImpactColor(conflict.impact_level)}`}>
                  影响: {conflict.impact_level}
                </span>
              </div>
              <div className="list-item-title">{conflict.description}</div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>涉及需求:</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {conflict.involved_requirements?.map((req, j) => (
                    <span key={j} className="tag tag-orange">{req}</span>
                  ))}
                </div>
              </div>
              {conflict.suggested_solutions && conflict.suggested_solutions.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>建议方案:</div>
                  {conflict.suggested_solutions.map((sol, j) => (
                    <div key={j} style={{
                      background: 'white',
                      borderRadius: 6,
                      padding: '8px 12px',
                      marginBottom: 6,
                      fontSize: 13
                    }}>
                      <div style={{ fontWeight: 500 }}>{sol.description}</div>
                      <div style={{ fontSize: 12, color: '#52c41a', marginTop: 2 }}>优点: {sol.pros}</div>
                      <div style={{ fontSize: 12, color: '#ff4d4f', marginTop: 2 }}>缺点: {sol.cons}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 优先级排序 */}
      {priorities && priorities.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 size={16} />
            优先级排序
          </div>
          {priorities.map((p, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              background: '#fafafa',
              borderRadius: 8,
              marginBottom: 6
            }}>
              <span style={{ fontWeight: 600, color: '#1677ff', minWidth: 24 }}>#{i + 1}</span>
              <span style={{ flex: 1, fontSize: 14 }}>{p.requirement_id}</span>
              <span className={`tag ${getPriorityColor(p.moscow)}`}>{p.moscow}</span>
              <span style={{ fontSize: 13, color: '#666', minWidth: 40, textAlign: 'right' }}>
                评分: {p.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AnalysisResult
