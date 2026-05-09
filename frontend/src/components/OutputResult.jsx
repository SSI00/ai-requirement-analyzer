import React from 'react'
import { BookOpen, CheckSquare, HelpCircle, Lightbulb, ShieldAlert, FileCheck2 } from 'lucide-react'

function OutputResult({ data }) {
  if (!data) return null

  const {
    user_stories,
    acceptance_criteria,
    clarification_questions,
    technical_suggestions,
    risk_list,
    final_requirement_doc
  } = data

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Must Have': return 'tag-red'
      case 'Should Have': return 'tag-orange'
      case 'Could Have': return 'tag-blue'
      case "Won't Have": return 'tag-green'
      default: return 'tag-blue'
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
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
      {user_stories && user_stories.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={16} />
            用户故事 ({user_stories.length}项)
          </div>
          {user_stories.map((story, index) => (
            <div key={index} className="list-item story-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span className={`tag ${getPriorityColor(story.priority)}`}>{story.priority}</span>
              </div>
              <div className="typography-body">
                <div><span className="typography-label">角色</span> {story.role}</div>
                <div><span className="typography-label">诉求</span> {story.action}</div>
                <div><span className="typography-label">价值</span> {story.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {acceptance_criteria && acceptance_criteria.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckSquare size={16} />
            验收标准 ({acceptance_criteria.length}项)
          </div>
          {acceptance_criteria.map((item, index) => (
            <div key={index} className="list-item criteria-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="typography-body" style={{ fontWeight: 500 }}>{item.scenario}</span>
                <span className={`tag ${getCategoryColor(item.category)}`}>{item.category}</span>
              </div>
              <div className="typography-body-sm" style={{ color: '#444' }}>
                <div><span className="typography-label" style={{ color: '#722ed1' }}>前提条件</span> {item.given}</div>
                <div><span className="typography-label" style={{ color: '#722ed1' }}>执行动作</span> {item.when}</div>
                <div><span className="typography-label" style={{ color: '#722ed1' }}>预期结果</span> {item.then}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {clarification_questions && clarification_questions.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <HelpCircle size={16} />
            澄清问题 ({clarification_questions.length}项)
          </div>
          {clarification_questions.map((item, index) => (
            <div key={index} className="list-item question-item">
              <div className="list-item-title">{item.fuzzy_point}</div>
              <div style={{ marginTop: 8 }}>
                {item.options?.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className="typography-body-sm"
                    style={{
                      padding: '6px 10px',
                      background: 'white',
                      borderRadius: 6,
                      marginBottom: 6,
                      border: '1px solid #d9d9d9'
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
              {item.recommendation && (
                <div className="typography-caption" style={{ marginTop: 8, color: '#1677ff' }}>
                  建议: {item.recommendation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {technical_suggestions && technical_suggestions.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lightbulb size={16} />
            技术建议 ({technical_suggestions.length}项)
          </div>
          {technical_suggestions.map((item, index) => (
            <div key={index} className="list-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span className="typography-body" style={{ fontWeight: 500 }}>{item.area}</span>
                <span className={`tag ${getRiskColor(item.risk_level)}`}>风险: {item.risk_level}</span>
              </div>
              <div className="list-item-desc">{item.suggestion}</div>
              <div className="typography-caption" style={{ marginTop: 6, color: '#1677ff' }}>
                缓解方案: {item.mitigation}
              </div>
            </div>
          ))}
        </div>
      )}



      {final_requirement_doc && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileCheck2 size={16} />
            最终精选需求文档
          </div>
          <div className="list-item" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <div className="list-item-title">{final_requirement_doc.executive_summary || '待补充摘要'}</div>
            {final_requirement_doc.user_intent_statement && <div className="typography-body-sm" style={{ marginTop: 6 }}>真实意图：{final_requirement_doc.user_intent_statement}</div>}
            <div className="typography-caption" style={{ marginTop: 10, color: '#666' }}>精选需求</div>
            {(final_requirement_doc.selected_requirements || []).map((item, i) => <div key={i} className="typography-body-sm">• {item}</div>)}
            <div className="typography-caption" style={{ marginTop: 10, color: '#666' }}>范围外</div>
            {(final_requirement_doc.out_of_scope || []).map((item, i) => <div key={i} className="typography-body-sm">• {item}</div>)}
          </div>
        </div>
      )}

      {risk_list && risk_list.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={16} />
            风险清单 ({risk_list.length}项)
          </div>
          {risk_list.map((item, index) => (
            <div
              key={index}
              className={`list-item risk-${item.impact === '高' ? 'high' : item.impact === '中' ? 'medium' : 'low'}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span className="typography-body" style={{ fontWeight: 500 }}>{item.risk}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className={`tag ${getRiskColor(item.probability)}`}>概率: {item.probability}</span>
                  <span className={`tag ${getRiskColor(item.impact)}`}>影响: {item.impact}</span>
                </div>
              </div>
              <div className="typography-caption" style={{ marginTop: 6, color: '#1677ff' }}>
                应对策略: {item.mitigation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OutputResult
