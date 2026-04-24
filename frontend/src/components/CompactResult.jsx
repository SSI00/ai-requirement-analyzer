import React from 'react'
import { Target, HelpCircle, GitBranch, BookOpen, CheckSquare } from 'lucide-react'

function CompactSection({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="card" style={{ marginBottom: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: '#e6f4ff',
            color: '#1677ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon size={18} />
        </div>
        <div>
          <div className="typography-heading-md" style={{ fontWeight: 600, color: '#1f1f1f' }}>{title}</div>
          {subtitle && <div className="typography-body-sm" style={{ color: '#8c8c8c', marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}

function CompactList({ items, renderItem, emptyText }) {
  if (!items?.length) {
    return (
      <div
        className="typography-body-sm"
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          background: '#fafafa',
          border: '1px dashed #d9d9d9',
          color: '#8c8c8c'
        }}
      >
        {emptyText}
      </div>
    )
  }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{items.map(renderItem)}</div>
}

function CompactResult({ understanding, analysis, output }) {
  if (!understanding && !analysis && !output) return null

  const coreIntent = understanding?.intent
  const fuzzyPoints = understanding?.fuzzy_points || []
  const subRequirements = analysis?.sub_requirements || []
  const priorities = analysis?.priorities || []
  const userStories = output?.user_stories || []
  const acceptanceCriteria = output?.acceptance_criteria || []

  const priorityMap = new Map((priorities || []).map((item, index) => [item.requirement_id, { ...item, rank: index + 1 }]))
  const mergedRequirements = subRequirements.map(item => ({
    ...item,
    priorityDetail: priorityMap.get(item.id) || null
  }))

  return (
    <div>
      <CompactSection
        icon={Target}
        title="核心诉求"
        subtitle="先回答用户最关心的问题：系统理解到的真实目标是什么"
      >
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            background: '#f8fbff',
            border: '1px solid #d6e4ff'
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {coreIntent?.type && <span className="tag tag-blue">{coreIntent.type}</span>}
            {coreIntent?.confidence && <span className="tag tag-green">置信度 {coreIntent.confidence}</span>}
          </div>
          <div className="typography-body" style={{ color: '#1f1f1f' }}>
            {coreIntent?.description || '暂无核心诉求总结'}
          </div>
          {coreIntent?.deep_intent && (
            <div
              className="typography-body-sm"
              style={{
                marginTop: 10,
                color: '#595959',
                paddingTop: 10,
                borderTop: '1px solid #e6f4ff'
              }}
            >
              深层目标：{coreIntent.deep_intent}
            </div>
          )}
        </div>
      </CompactSection>

      <CompactSection
        icon={HelpCircle}
        title="关键澄清点"
        subtitle="这些问题会直接影响结果是否准确"
      >
        <CompactList
          items={fuzzyPoints}
          emptyText="当前没有需要额外澄清的关键问题。"
          renderItem={(point, index) => {
            const resolved = Boolean(point?.resolved && point?.user_answer)
            return (
              <div
                key={`${point?.fuzzy_point || 'fuzzy'}-${index}`}
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: resolved ? '#f6ffed' : '#fffbe6',
                  border: `1px solid ${resolved ? '#b7eb8f' : '#ffe58f'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div className="typography-body" style={{ fontWeight: 500, color: '#1f1f1f' }}>
                    {point?.fuzzy_point}
                  </div>
                  <span className={`tag ${resolved ? 'tag-green' : 'tag-orange'}`}>
                    {resolved ? '已确认' : '待澄清'}
                  </span>
                </div>
                {point?.user_answer && (
                  <div className="typography-body-sm" style={{ marginTop: 10, color: '#237804' }}>
                    当前答案：{point.user_answer}
                  </div>
                )}
              </div>
            )
          }}
        />
      </CompactSection>

      <CompactSection
        icon={GitBranch}
        title="核心需求项"
        subtitle="把原始诉求拆成可执行的主要事项，并直接带出优先级信息"
      >
        <CompactList
          items={mergedRequirements}
          emptyText="当前没有可展示的需求拆解项。"
          renderItem={(item, index) => (
            <div
              key={`${item?.id || 'requirement'}-${index}`}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: '#fafafa',
                border: '1px solid #f0f0f0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                <div className="typography-body" style={{ fontWeight: 600, color: '#1f1f1f' }}>
                  {item?.title || item?.id || '未命名需求'}
                </div>
                {item?.priority && <span className="tag tag-blue">{item.priority}</span>}
              </div>
              {item?.description && (
                <div className="typography-body-sm" style={{ color: '#595959' }}>
                  {item.description}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {item?.id && <span className="typography-caption" style={{ color: '#8c8c8c' }}>{item.id}</span>}
                {item.priorityDetail?.rank && (
                  <span className="typography-caption" style={{ color: '#1677ff', fontWeight: 500 }}>
                    排名 #{item.priorityDetail.rank}
                  </span>
                )}
                {typeof item.priorityDetail?.score === 'number' && (
                  <span className="typography-caption" style={{ color: '#666' }}>
                    评分 {item.priorityDetail.score}
                  </span>
                )}
              </div>
            </div>
          )}
        />
      </CompactSection>

      <CompactSection
        icon={BookOpen}
        title="用户故事"
        subtitle="最适合拿去做沟通、评审和立项的表达方式"
      >
        <CompactList
          items={userStories}
          emptyText="当前没有可展示的用户故事。"
          renderItem={(story, index) => (
            <div
              key={`story-${index}`}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: '#f6ffed',
                border: '1px solid #d9f7be'
              }}
            >
              <div style={{ marginBottom: 8 }}>
                {story?.priority && <span className="tag tag-green">{story.priority}</span>}
              </div>
              <div className="typography-body" style={{ color: '#1f1f1f' }}>
                <div><span className="typography-label">角色</span> {story?.role || '相关角色'}</div>
                <div><span className="typography-label">诉求</span> {story?.action || '完成关键动作'}</div>
                <div><span className="typography-label">价值</span> {story?.value || '实现业务价值'}</div>
              </div>
            </div>
          )}
        />
      </CompactSection>

      <CompactSection
        icon={CheckSquare}
        title="验收标准"
        subtitle="结果是不是可验证，主要看这里"
      >
        <CompactList
          items={acceptanceCriteria}
          emptyText="当前没有可展示的验收标准。"
          renderItem={(item, index) => (
            <div
              key={`criteria-${index}`}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: '#f9f0ff',
                border: '1px solid #efdbff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                <div className="typography-body" style={{ fontWeight: 600, color: '#1f1f1f' }}>
                  {item?.scenario || `验收场景 ${index + 1}`}
                </div>
                {item?.category && <span className="tag tag-purple">{item.category}</span>}
              </div>
              <div className="typography-body-sm" style={{ display: 'grid', gap: 6, color: '#434343' }}>
                <div><span className="typography-label">前提条件</span> {item?.given || '-'}</div>
                <div><span className="typography-label">执行动作</span> {item?.when || '-'}</div>
                <div><span className="typography-label">预期结果</span> {item?.then || '-'}</div>
              </div>
            </div>
          )}
        />
      </CompactSection>
    </div>
  )
}

export default CompactResult
