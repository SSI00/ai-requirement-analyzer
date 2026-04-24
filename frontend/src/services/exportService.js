/**
 * Export service
 * Supports full and compact exports for markdown, txt, docx, and print-friendly pdf.
 */

function generateFilename(extension, requirementId, mode = 'full') {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '')
  const id = requirementId || 'unknown'
  const modeLabel = mode === 'compact' ? '精简结果' : '完整结果'
  return `需求分析_${modeLabel}_${id}_${date}_${time}.${extension}`
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeXml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getSubRequirementMap(result) {
  const items = result?.analysis?.sub_requirements || []
  return new Map(items.filter(item => item?.id).map(item => [item.id, item]))
}

function getCompactTopPriorities(result) {
  const priorities = result?.analysis?.priorities || []
  const subRequirements = result?.analysis?.sub_requirements || []
  const subRequirementMap = getSubRequirementMap(result)

  if (priorities.length > 0) {
    return priorities.slice(0, 5).map(item => {
      const linked = subRequirementMap.get(item?.requirement_id)
      return {
        rank: null,
        requirement_id: item?.requirement_id || linked?.id || '',
        title: linked?.title || item?.title || item?.requirement_id || '未关联需求',
        description: linked?.description || item?.description || '',
        moscow: item?.moscow || linked?.priority || '',
        score: item?.score
      }
    })
  }

  return subRequirements
    .filter(item => item?.priority === 'Must Have' || item?.priority === 'Should Have')
    .slice(0, 5)
    .map(item => ({
      rank: null,
      requirement_id: item.id,
      title: item.title || item.id,
      description: item.description || '',
      moscow: item.priority || '',
      score: null
    }))
}

function mergeRequirementsWithPriority(result) {
  const subRequirements = result?.analysis?.sub_requirements || []
  const priorities = result?.analysis?.priorities || []
  const priorityMap = new Map(priorities.map((item, index) => [item.requirement_id, { ...item, rank: index + 1 }]))

  return subRequirements.map(item => ({
    ...item,
    priorityDetail: priorityMap.get(item.id) || null
  }))
}

function buildFullSections(result) {
  const sections = []

  if (result?.understanding) {
    const { intent, entities, implied_requirements, fuzzy_points } = result.understanding
    sections.push({
      title: '需求理解结果',
      groups: [
        {
          title: '意图识别',
          items: intent ? [
            `类型：${intent.type || '未知'}`,
            `置信度：${intent.confidence || '未知'}`,
            `描述：${intent.description || 'N/A'}`,
            ...(intent.deep_intent ? [`深层目标：${intent.deep_intent}`] : [])
          ] : ['暂无相关数据']
        },
        {
          title: '实体抽取',
          items: entities?.length
            ? entities.map(entity => `${entity.name} | ${entity.type} | 置信度 ${entity.confidence}`)
            : ['暂无相关数据']
        },
        {
          title: '隐含需求',
          items: implied_requirements?.length
            ? implied_requirements.map(item => `${item.description} | 来源：${item.source} | 状态：${item.status} | 置信度 ${item.confidence}`)
            : ['暂无相关数据']
        },
        {
          title: '需要澄清的问题',
          items: fuzzy_points?.length
            ? fuzzy_points.map(item => {
              const lines = [
                item.fuzzy_point,
                item.user_answer ? `当前答案：${item.user_answer}` : null,
                item.options?.length ? `参考选项：${item.options.join(' / ')}` : null,
                item.recommendation ? `建议：${item.recommendation}` : null
              ].filter(Boolean)
              return lines.join(' | ')
            })
            : ['暂无相关数据']
        }
      ]
    })
  }

  if (result?.analysis) {
    const { conflicts } = result.analysis
    const mergedRequirements = mergeRequirementsWithPriority(result)
    sections.push({
      title: '需求分析结果',
      groups: [
        {
          title: '需求拆解',
          items: mergedRequirements.length
            ? mergedRequirements.map(item => {
              const rank = item.priorityDetail?.rank ? ` | 排名 #${item.priorityDetail.rank}` : ''
              const score = typeof item.priorityDetail?.score === 'number' ? ` | 评分 ${item.priorityDetail.score}` : ''
              return `[${item.id}] ${item.title} | ${item.description} | ${item.priority} | ${item.category}${rank}${score}`
            })
            : ['暂无相关数据']
        },
        {
          title: '检测到的矛盾',
          items: conflicts?.length
            ? conflicts.map(item => {
              const solutions = item.suggested_solutions?.length
                ? `建议方案：${item.suggested_solutions.map(sol => `${sol.description}(优点:${sol.pros}; 缺点:${sol.cons})`).join('；')}`
                : null
              return [
                item.description,
                `类型：${item.conflict_type}`,
                `影响：${item.impact_level}`,
                item.involved_requirements?.length ? `涉及：${item.involved_requirements.join(', ')}` : null,
                solutions
              ].filter(Boolean).join(' | ')
            })
            : ['暂无相关数据']
        }
      ]
    })
  }

  if (result?.output) {
    const { user_stories, acceptance_criteria, clarification_questions, technical_suggestions, risk_list } = result.output
    sections.push({
      title: '结构化输出',
      groups: [
        {
          title: '用户故事',
          items: user_stories?.length
            ? user_stories.map(item => `[${item.priority}] 角色：${item.role} | 诉求：${item.action} | 价值：${item.value}`)
            : ['暂无相关数据']
        },
        {
          title: '验收标准',
          items: acceptance_criteria?.length
            ? acceptance_criteria.map(item => `${item.scenario} [${item.category}] | 前提条件 ${item.given} | 执行动作 ${item.when} | 预期结果 ${item.then}`)
            : ['暂无相关数据']
        },
        {
          title: '澄清问题',
          items: clarification_questions?.length
            ? clarification_questions.map(item => `${item.fuzzy_point}${item.options?.length ? ` | 选项：${item.options.join(' / ')}` : ''}${item.recommendation ? ` | 建议：${item.recommendation}` : ''}`)
            : ['暂无相关数据']
        },
        {
          title: '技术建议',
          items: technical_suggestions?.length
            ? technical_suggestions.map(item => `${item.area} | ${item.suggestion} | 风险 ${item.risk_level} | 缓解方案：${item.mitigation}`)
            : ['暂无相关数据']
        },
        {
          title: '风险清单',
          items: risk_list?.length
            ? risk_list.map(item => `${item.risk} | 概率 ${item.probability} | 影响 ${item.impact} | 应对策略：${item.mitigation}`)
            : ['暂无相关数据']
        }
      ]
    })
  }

  return sections
}

function buildCompactSections(result) {
  const intent = result?.understanding?.intent
  const fuzzyPoints = result?.understanding?.fuzzy_points || []
  const mergedRequirements = mergeRequirementsWithPriority(result)
  const userStories = result?.output?.user_stories || []
  const acceptanceCriteria = result?.output?.acceptance_criteria || []

  return [
    {
      title: '核心诉求',
      items: intent ? [
        `类型：${intent.type || '未知'}`,
        `置信度：${intent.confidence || '未知'}`,
        `结论：${intent.description || '暂无总结'}`,
        ...(intent.deep_intent ? [`深层目标：${intent.deep_intent}`] : [])
      ] : ['暂无相关数据']
    },
    {
      title: '关键澄清点',
      items: fuzzyPoints.length
        ? fuzzyPoints.map(item => {
          const state = item.user_answer ? `已确认：${item.user_answer}` : '待澄清'
          return `${item.fuzzy_point} | ${state}`
        })
        : ['当前没有需要额外澄清的关键问题']
    },
    {
      title: '核心需求项',
      items: mergedRequirements.length
        ? mergedRequirements.map(item => {
          const rank = item.priorityDetail?.rank ? ` | 排名 #${item.priorityDetail.rank}` : ''
          const score = typeof item.priorityDetail?.score === 'number' ? ` | 评分 ${item.priorityDetail.score}` : ''
          return `${item.title || item.id} | ${item.description || '暂无描述'}${item.priority ? ` | ${item.priority}` : ''}${rank}${score}`
        })
        : ['暂无相关数据']
    },
    {
      title: '用户故事',
      items: userStories.length
        ? userStories.map(item => `[${item.priority}] 角色：${item.role} | 诉求：${item.action} | 价值：${item.value}`)
        : ['暂无相关数据']
    },
    {
      title: '验收标准',
      items: acceptanceCriteria.length
        ? acceptanceCriteria.map(item => `${item.scenario} [${item.category}] | 前提条件 ${item.given} | 执行动作 ${item.when} | 预期结果 ${item.then}`)
        : ['暂无相关数据']
    }
  ]
}

function getExportPayload(result, mode = 'full') {
  return {
    title: mode === 'compact' ? 'AI需求分析精简结果' : 'AI需求分析完整结果',
    requirementId: result?.requirement_id || 'N/A',
    processingTime: result?.processing_time_ms ? `${result.processing_time_ms}ms` : 'N/A',
    sections: mode === 'compact' ? buildCompactSections(result) : buildFullSections(result)
  }
}

function buildMarkdownContent(result, mode = 'full') {
  const payload = getExportPayload(result, mode)
  const lines = [
    `# ${payload.title}`,
    '',
    `**需求ID**: ${payload.requirementId}`,
    `**处理耗时**: ${payload.processingTime}`,
    ''
  ]

  payload.sections.forEach((section, sectionIndex) => {
    lines.push(`## ${sectionIndex + 1}. ${section.title}`)
    lines.push('')
    section.groups?.forEach(group => {
      lines.push(`### ${group.title}`)
      lines.push('')
      group.items.forEach(item => lines.push(`- ${item}`))
      lines.push('')
    })

    if (section.items) {
      section.items.forEach(item => lines.push(`- ${item}`))
      lines.push('')
    }
  })

  return lines.join('\n')
}

function buildTxtContent(result, mode = 'full') {
  const payload = getExportPayload(result, mode)
  const lines = [
    '='.repeat(60),
    payload.title,
    '='.repeat(60),
    `需求ID: ${payload.requirementId}`,
    `处理耗时: ${payload.processingTime}`,
    ''
  ]

  payload.sections.forEach((section, sectionIndex) => {
    lines.push(`${sectionIndex + 1}. ${section.title}`)
    lines.push('-'.repeat(60))
    if (section.groups) {
      section.groups.forEach(group => {
        lines.push(`${group.title}:`)
        group.items.forEach((item, index) => lines.push(`${index + 1}. ${item}`))
        lines.push('')
      })
    } else if (section.items) {
      section.items.forEach((item, index) => lines.push(`${index + 1}. ${item}`))
      lines.push('')
    }
  })

  return lines.join('\n')
}

function buildHtmlContent(result, mode = 'full') {
  const payload = getExportPayload(result, mode)
  const sectionsHtml = payload.sections.map((section, sectionIndex) => {
    const groupHtml = section.groups
      ? section.groups.map(group => `
          <div class="group">
            <h3>${escapeHtml(group.title)}</h3>
            <ul>${group.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
          </div>
        `).join('')
      : ''

    const itemHtml = section.items
      ? `<ul>${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : ''

    return `
      <section class="section">
        <h2>${sectionIndex + 1}. ${escapeHtml(section.title)}</h2>
        ${groupHtml}
        ${itemHtml}
      </section>
    `
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(payload.title)} - ${escapeHtml(payload.requirementId)}</title>
  <style>
    @page { margin: 18mm; }
body { font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif; color: #1f1f1f; line-height: 1.7; }
h1, h2 { font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif; }
h1 { font-size: 24px; margin-bottom: 8px; color: #1677ff; }
h2 { font-size: 18px; margin-top: 24px; border-left: 4px solid #1677ff; padding-left: 10px; }
h3 { font-size: 14px; margin-top: 16px; color: #434343; font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif; }
    .meta { color: #595959; margin-bottom: 20px; }
    .section { margin-bottom: 20px; }
    .group { margin-bottom: 12px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(payload.title)}</h1>
  <div class="meta">需求ID: ${escapeHtml(payload.requirementId)} | 处理耗时: ${escapeHtml(payload.processingTime)}</div>
  ${sectionsHtml}
</body>
</html>`
}

function buildDocXmlFromText(title, plainText) {
  const paragraphs = plainText
    .split('\n')
    .map(line => line.trimEnd())
    .map(line => {
      const safeText = escapeXml(line || ' ')
      const bold = line === title || /^\d+\.\s/.test(line)
      return `
        <w:p>
          <w:r>
            <w:rPr>
              <w:rFonts w:eastAsia="宋体" w:ascii="Calibri" w:hAnsi="Calibri"/>
              ${bold ? '<w:b/>' : ''}
              <w:sz w:val="${line === title ? '32' : '22'}"/>
              <w:szCs w:val="${line === title ? '32' : '22'}"/>
            </w:rPr>
            <w:t xml:space="preserve">${safeText}</w:t>
          </w:r>
        </w:p>
      `
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`
}

async function createDocxBlob(result, mode = 'full') {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const payload = getExportPayload(result, mode)
  const plainText = buildTxtContent(result, mode)
  const documentXml = buildDocXmlFromText(payload.title, plainText)

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)

  zip.file('word/document.xml', documentXml)
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`)

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  })
}

export async function exportToMarkdown(result, mode = 'full') {
  const content = buildMarkdownContent(result, mode)
  downloadFile(content, generateFilename('md', result?.requirement_id, mode), 'text/markdown;charset=utf-8')
}

export async function exportToTxt(result, mode = 'full') {
  const content = buildTxtContent(result, mode)
  downloadFile(content, generateFilename('txt', result?.requirement_id, mode), 'text/plain;charset=utf-8')
}

export async function exportToDocx(result, mode = 'full') {
  try {
    const blob = await createDocxBlob(result, mode)
    downloadFile(
      blob,
      generateFilename('docx', result?.requirement_id, mode),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  } catch (error) {
    console.error('DOCX export failed:', error)
    throw new Error('DOCX 导出失败')
  }
}

export async function exportToPdf(result, mode = 'full') {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('无法打开打印窗口，请检查浏览器弹窗设置')
  }

  const htmlContent = buildHtmlContent(result, mode)
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 400)
  }
}
