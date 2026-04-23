import React from 'react'
import { BookOpen, CheckSquare, HelpCircle, Lightbulb, ShieldAlert } from 'lucide-react'

function OutputResult({ data }) {
  if (!data) return null

  const { user_stories, acceptance_criteria, clarification_questions, technical_suggestions, risk_list } = data

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Must Have': return 'tag-red'
      case 'Should Have': return 'tag-orange'
      case 'Could Have': return 'tag-blue'
      case "Won't Have": return 'tag-green'
      default: return 'tag-blue'
    }
  }

  const getCategoryColor = (cat) => {
    switch (cat) {
      case '正常场景': return 'tag-green'
      case '边界场景': return 'tag-orange'
      case '异常场景': return 'tag-red'
      default: return 'tag-blue'
    }
  }

  const getRiskColor = (level) => {
    switch (level) {
      case '高': return 'tag-red'
      case '中': return 'tag-orange'
      case '低': return 'tag-green'
      default: return 'tag-blue'
    }
  }

  return (
    <div className="card">
      <div className="card-title">
        <BookOpen size={20} />
        结构化输出
      </div>

      {/* 用户故事 */}
      {user_stories && user_stories.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={16} />
            用户故事 ({user_stories.length}个)
          </div>
          {user_stories.map((story, i) => (
            <div key={i} className="list-item story-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span className={`tag ${getPriorityColor(story.priority)}`}>{story.priority}</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                <div><strong>作为</strong> {story.role}</div>
                <div><strong>我希望</strong> {story.action}</div>
                <div><strong>以便</strong> {story.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 验收标准 */}
      {acceptance_criteria && acceptance_criteria.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckSquare size={16} />
            验收标准 ({acceptance_criteria.length}个)
          </div>
          {acceptance_criteria.map((ac, i) => (
            <div key={i} className="list-item criteria-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{ac.scenario}</span>
                <span className={`tag ${getCategoryColor(ac.category)}`}>{ac.category}</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: '#444' }}>
                <div><strong style={{ color: '#722ed1' }}>Given</strong> {ac.given}</div>
                <div><strong style={{ color: '#722ed1' }}>When</strong> {ac.when}</div>
                <div><strong style={{ color: '#722ed1' }}>Then</strong> {ac.then}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 澄清问题 */}
      {clarification_questions && clarification_questions.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <HelpCircle size={16} />
            澄清问题 ({clarification_questions.length}个)
          </div>
          {clarification_questions.map((q, i) => (
            <div key={i} className="list-item question-item">
              <div className="list-item-title">{q.fuzzy_point}</div>
              <div style={{ marginTop: 8 }}>
                {q.options?.map((opt, j) => (
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
              {q.recommendation && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#1677ff' }}>
                  💡 建议: {q.recommendation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 技术建议 */}
      {technical_suggestions && technical_suggestions.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lightbulb size={16} />
            技术建议 ({technical_suggestions.length}个)
          </div>
          {technical_suggestions.map((ts, i) => (
            <div key={i} className="list-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{ts.area}</span>
                <span className={`tag ${getRiskColor(ts.risk_level)}`}>风险: {ts.risk_level}</span>
              </div>
              <div className="list-item-desc">{ts.suggestion}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#1677ff' }}>
                缓解方案: {ts.mitigation}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 风险清单 */}
      {risk_list && risk_list.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={16} />
            风险清单 ({risk_list.length}个)
          </div>
          {risk_list.map((risk, i) => (
            <div key={i} className={`list-item risk-${risk.impact === '高' ? 'high' : risk.impact === '中' ? 'medium' : 'low'}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{risk.risk}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className={`tag ${getRiskColor(risk.probability)}`}>概率: {risk.probability}</span>
                  <span className={`tag ${getRiskColor(risk.impact)}`}>影响: {risk.impact}</span>
                </div>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#1677ff' }}>
                应对策略: {risk.mitigation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OutputResult
