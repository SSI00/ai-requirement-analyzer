/**
 * 导出服务
 * 功能: 将分析结果导出为多种格式
 */

// 生成文件名
function generateFilename(extension, requirementId) {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '')
  const id = requirementId || 'unknown'
  return `需求分析_${id}_${date}_${time}.${extension}`
}

// 下载文件
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

// 转义XML特殊字符
function escapeXml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// 导出为 Markdown 格式
export async function exportToMarkdown(result) {
  const lines = []

  lines.push('# AI需求分析结果')
  lines.push('')
  lines.push(`**需求ID**: ${result.requirement_id || 'N/A'}`)
  lines.push(`**处理耗时**: ${result.processing_time_ms ? `${result.processing_time_ms}ms` : 'N/A'}`)
  lines.push('')

  if (result.understanding) {
    const { intent, entities, implied_requirements, fuzzy_points } = result.understanding

    lines.push('## 一、需求理解')
    lines.push('')

    if (intent) {
      lines.push('### （一）意图识别')
      lines.push('')
      lines.push(`- **类型**: ${intent.type || '未知'}`)
      lines.push(`- **置信度**: ${intent.confidence || '中'}`)
      lines.push(`- **描述**: ${intent.description || 'N/A'}`)
      if (intent.deep_intent) {
        lines.push(`- **深层意图**: ${intent.deep_intent}`)
      }
      lines.push('')

      // 如果意图类型为"未知"，说明输入无效，跳过后续分析
      if (intent.type === '未知' || intent.type === 'unknown') {
        lines.push('**提示**: 由于需求描述不够明确，无法进行深入分析。请提供更详细的需求描述。')
        lines.push('')
        lines.push('### （二）实体抽取')
        lines.push('')
        lines.push('暂无相关数据')
        lines.push('')
        lines.push('### （三）隐含需求')
        lines.push('')
        lines.push('暂无相关数据')
        lines.push('')
        lines.push('### （四）模糊点')
        lines.push('')
        lines.push('暂无相关数据')
        lines.push('')
      } else {
        // 意图有效，继续后续分析
        if (entities && entities.length > 0) {
          lines.push('### （二）实体抽取')
          lines.push('')
          lines.push('| 实体名称 | 类型 | 置信度 |')
          lines.push('|----------|------|--------|')
          entities.forEach(e => {
            lines.push(`| ${e.name} | ${e.type} | ${e.confidence} |`)
          })
          lines.push('')
        } else {
          lines.push('### （二）实体抽取')
          lines.push('')
          lines.push('暂无相关数据')
          lines.push('')
        }

        if (implied_requirements && implied_requirements.length > 0) {
          lines.push('### （三）隐含需求')
          lines.push('')
          implied_requirements.forEach((req, i) => {
            lines.push(`${i + 1}. ${req.description}`)
            lines.push(`   来源: ${req.source} | 状态: ${req.status} | 置信度: ${req.confidence}`)
          })
          lines.push('')
        } else {
          lines.push('### （三）隐含需求')
          lines.push('')
          lines.push('暂无相关数据')
          lines.push('')
        }

        if (fuzzy_points && fuzzy_points.length > 0) {
          lines.push('### （四）模糊点')
          lines.push('')
          fuzzy_points.forEach((point, i) => {
            lines.push(`${i + 1}. **${point.fuzzy_point}**`)
            if (point.options && point.options.length > 0) {
              lines.push(`   选项: ${point.options.join(' / ')}`)
            }
            if (point.recommendation) {
              lines.push(`   建议: ${point.recommendation}`)
            }
          })
          lines.push('')
        } else {
          lines.push('### （四）模糊点')
          lines.push('')
          lines.push('暂无相关数据')
          lines.push('')
        }
      }
    }
  }

  if (result.analysis) {
    const { sub_requirements, conflicts, priorities } = result.analysis

    lines.push('## 二、需求分析')
    lines.push('')

    if (sub_requirements && sub_requirements.length > 0) {
      lines.push('### （一）需求拆解')
      lines.push('')
      sub_requirements.forEach(req => {
        lines.push(`- **[${req.id}] ${req.title}**`)
        lines.push(`  描述: ${req.description}`)
        lines.push(`  优先级: ${req.priority} | 分类: ${req.category} | 来源: ${req.source}`)
        lines.push('')
      })
    }

    if (conflicts && conflicts.length > 0) {
      lines.push('### （二）矛盾检测')
      lines.push('')
      conflicts.forEach((conflict, i) => {
        lines.push(`${i + 1}. **${conflict.description}**`)
        lines.push(`   类型: ${conflict.conflict_type} | 影响: ${conflict.impact_level}`)
        lines.push(`   涉及需求: ${conflict.involved_requirements?.join(', ')}`)
        if (conflict.suggested_solutions && conflict.suggested_solutions.length > 0) {
          lines.push('   建议方案:')
          conflict.suggested_solutions.forEach(sol => {
            lines.push(`     - ${sol.description} (优点: ${sol.pros}, 缺点: ${sol.cons})`)
          })
        }
        lines.push('')
      })
    }

    if (priorities && priorities.length > 0) {
      lines.push('### （三）优先级排序')
      lines.push('')
      lines.push('| 排名 | 需求ID | MoSCoW | 评分 |')
      lines.push('|------|--------|--------|------|')
      priorities.forEach((p, i) => {
        lines.push(`| ${i + 1} | ${p.requirement_id} | ${p.moscow} | ${p.score} |`)
      })
      lines.push('')
    }
  }

  if (result.output) {
    const { user_stories, acceptance_criteria, technical_suggestions, risk_list } = result.output

    lines.push('## 三、结构化输出')
    lines.push('')

    if (user_stories && user_stories.length > 0) {
      lines.push('### （一）用户故事')
      lines.push('')
      user_stories.forEach((story, i) => {
        lines.push(`${i + 1}. **${story.priority}**`)
        lines.push(`   作为一个${story.role}，我希望${story.action}，以便${story.value}`)
        lines.push('')
      })
    }

    if (acceptance_criteria && acceptance_criteria.length > 0) {
      lines.push('### （二）验收标准')
      lines.push('')
      acceptance_criteria.forEach((ac, i) => {
        lines.push(`${i + 1}. **${ac.scenario}** [${ac.category}]`)
        lines.push(`   Given: ${ac.given}`)
        lines.push(`   When: ${ac.when}`)
        lines.push(`   Then: ${ac.then}`)
        lines.push('')
      })
    }

    if (technical_suggestions && technical_suggestions.length > 0) {
      lines.push('### （三）技术建议')
      lines.push('')
      technical_suggestions.forEach((ts, i) => {
        lines.push(`${i + 1}. **${ts.area}** (风险: ${ts.risk_level})`)
        lines.push(`   建议: ${ts.suggestion}`)
        lines.push(`   缓解方案: ${ts.mitigation}`)
        lines.push('')
      })
    }

    if (risk_list && risk_list.length > 0) {
      lines.push('### （四）风险清单')
      lines.push('')
      lines.push('| 风险 | 概率 | 影响 | 缓解策略 |')
      lines.push('|------|------|------|----------|')
      risk_list.forEach(risk => {
        lines.push(`| ${risk.risk} | ${risk.probability} | ${risk.impact} | ${risk.mitigation} |`)
      })
      lines.push('')
    }
  }

  const content = lines.join('\n')
  downloadFile(content, generateFilename('md', result.requirement_id), 'text/markdown;charset=utf-8')
}

// 导出为 TXT 格式 - 分段显示，不用小点
export async function exportToTxt(result) {
  const lines = []

  lines.push('═'.repeat(50))
  lines.push('AI需求分析结果')
  lines.push('═'.repeat(50))
  lines.push('')
  lines.push(`需求ID: ${result.requirement_id || 'N/A'}`)
  lines.push(`处理耗时: ${result.processing_time_ms ? `${result.processing_time_ms}ms` : 'N/A'}`)
  lines.push('')
  lines.push('─'.repeat(50))

  if (result.understanding) {
    const { intent, entities, implied_requirements, fuzzy_points } = result.understanding

    lines.push('')
    lines.push('一、需求理解')
    lines.push('')

    if (intent) {
      lines.push('（一）意图识别')
      lines.push('')
      lines.push(`类型: ${intent.type || '未知'}`)
      lines.push(`置信度: ${intent.confidence || '中'}`)
      lines.push(`描述: ${intent.description || 'N/A'}`)
      if (intent.deep_intent) {
        lines.push(`深层意图: ${intent.deep_intent}`)
      }
      lines.push('')

      // 如果意图类型为"未知"，说明输入无效，跳过后续分析
      if (intent.type === '未知' || intent.type === 'unknown') {
        lines.push('提示: 由于需求描述不够明确，无法进行深入分析。请提供更详细的需求描述。')
        lines.push('')
        lines.push('（二）实体抽取')
        lines.push('')
        lines.push('暂无相关数据')
        lines.push('')
        lines.push('（三）隐含需求')
        lines.push('')
        lines.push('暂无相关数据')
        lines.push('')
        lines.push('（四）模糊点')
        lines.push('')
        lines.push('暂无相关数据')
        lines.push('')
      } else {
        // 意图有效，继续后续分析
        if (entities && entities.length > 0) {
          lines.push('（二）实体抽取')
          lines.push('')
          entities.forEach(e => {
            lines.push(`${e.name} (${e.type}, ${e.confidence})`)
          })
          lines.push('')
        } else {
          lines.push('（二）实体抽取')
          lines.push('')
          lines.push('暂无相关数据')
          lines.push('')
        }

        if (implied_requirements && implied_requirements.length > 0) {
          lines.push('（三）隐含需求')
          lines.push('')
          implied_requirements.forEach((req, i) => {
            lines.push(`${i + 1}. ${req.description}`)
            lines.push(`   来源: ${req.source} | 状态: ${req.status} | 置信度: ${req.confidence}`)
            lines.push('')
          })
        } else {
          lines.push('（三）隐含需求')
          lines.push('')
          lines.push('暂无相关数据')
          lines.push('')
        }

        if (fuzzy_points && fuzzy_points.length > 0) {
          lines.push('（四）模糊点')
          lines.push('')
          fuzzy_points.forEach((point, i) => {
            lines.push(`${i + 1}. ${point.fuzzy_point}`)
            if (point.options && point.options.length > 0) {
              lines.push(`   选项: ${point.options.join(' / ')}`)
            }
            if (point.recommendation) {
              lines.push(`   建议: ${point.recommendation}`)
            }
            lines.push('')
          })
        } else {
          lines.push('（四）模糊点')
          lines.push('')
          lines.push('暂无相关数据')
          lines.push('')
        }
      }
    }
  }

  if (result.analysis) {
    const { sub_requirements, conflicts, priorities } = result.analysis

    lines.push('')
    lines.push('二、需求分析')
    lines.push('')

    if (sub_requirements && sub_requirements.length > 0) {
      lines.push('（一）需求拆解')
      lines.push('')
      sub_requirements.forEach(req => {
        lines.push(`[${req.id}] ${req.title}`)
        lines.push(`描述: ${req.description}`)
        lines.push(`优先级: ${req.priority} | 分类: ${req.category} | 来源: ${req.source}`)
        lines.push('')
      })
    }

    if (conflicts && conflicts.length > 0) {
      lines.push('（二）矛盾检测')
      lines.push('')
      conflicts.forEach((conflict, i) => {
        lines.push(`${i + 1}. ${conflict.description}`)
        lines.push(`   类型: ${conflict.conflict_type} | 影响: ${conflict.impact_level}`)
        lines.push(`   涉及需求: ${conflict.involved_requirements?.join(', ')}`)
        lines.push('')
      })
    }

    if (priorities && priorities.length > 0) {
      lines.push('（三）优先级排序')
      lines.push('')
      priorities.forEach((p, i) => {
        lines.push(`${i + 1}. ${p.requirement_id} | ${p.moscow} | 评分: ${p.score}`)
      })
      lines.push('')
    }
  }

  if (result.output) {
    const { user_stories, acceptance_criteria, technical_suggestions, risk_list } = result.output

    lines.push('')
    lines.push('三、结构化输出')
    lines.push('')

    if (user_stories && user_stories.length > 0) {
      lines.push('（一）用户故事')
      lines.push('')
      user_stories.forEach((story, i) => {
        lines.push(`${i + 1}. [${story.priority}]`)
        lines.push(`作为一个${story.role}，我希望${story.action}，以便${story.value}`)
        lines.push('')
      })
    }

    if (acceptance_criteria && acceptance_criteria.length > 0) {
      lines.push('（二）验收标准')
      lines.push('')
      acceptance_criteria.forEach((ac, i) => {
        lines.push(`${i + 1}. ${ac.scenario} [${ac.category}]`)
        lines.push(`Given: ${ac.given}`)
        lines.push(`When: ${ac.when}`)
        lines.push(`Then: ${ac.then}`)
        lines.push('')
      })
    }

    if (technical_suggestions && technical_suggestions.length > 0) {
      lines.push('（三）技术建议')
      lines.push('')
      technical_suggestions.forEach((ts, i) => {
        lines.push(`${i + 1}. ${ts.area} (风险: ${ts.risk_level})`)
        lines.push(`建议: ${ts.suggestion}`)
        lines.push(`缓解方案: ${ts.mitigation}`)
        lines.push('')
      })
    }

    if (risk_list && risk_list.length > 0) {
      lines.push('（四）风险清单')
      lines.push('')
      risk_list.forEach(risk => {
        lines.push(`${risk.risk}`)
        lines.push(`概率: ${risk.probability} | 影响: ${risk.impact}`)
        lines.push(`缓解策略: ${risk.mitigation}`)
        lines.push('')
      })
    }
  }

  const content = lines.join('\n')
  downloadFile(content, generateFilename('txt', result.requirement_id), 'text/plain;charset=utf-8')
}

// 创建完整的DOCX文件（ZIP格式）
async function createDocxFile(result) {
  const JSZip = (await import('jszip')).default

  const zip = new JSZip()

  // [Content_Types].xml
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  // _rels/.rels
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  // word/document.xml - 带完整格式
  const docXml = buildDocXml(result)

  // word/_rels/document.xml.rels
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`

  zip.file('[Content_Types].xml', contentTypes)
  zip.file('_rels/.rels', rels)
  zip.file('word/document.xml', docXml)
  zip.file('word/_rels/document.xml.rels', docRels)

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

// 构建Word document.xml - 按要求格式化
function buildDocXml(result) {
  const lines = []

  lines.push(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
<w:body>
<w:sectPr>
  <w:pgSz w:w="12240" w:h="15840"/>
  <w:pgMar w:top="1440" w:right="1800" w:bottom="1440" w:left="1800" w:header="720" w:footer="720" w:gutter="0"/>
</w:sectPr>`)

  // 文档标题 - 一级标题：四号加粗（22pt=44半磅），居中
  lines.push(`<w:p>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:line="360" w:lineRule="auto"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:b/>
        <w:sz w:val="44"/>
        <w:szCs w:val="44"/>
      </w:rPr>
      <w:t>AI需求分析结果</w:t>
    </w:r>
  </w:p>`)

  // 需求ID和耗时
  lines.push(`<w:p>
    <w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
      <w:t>需求ID: ${escapeXml(result.requirement_id || 'N/A')}    处理耗时: ${result.processing_time_ms ? `${result.processing_time_ms}ms` : 'N/A'}</w:t>
    </w:r>
  </w:p>`)

  // 分页
  lines.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`)

  // ===== 一、需求理解 - 二级标题：小四加粗（24半磅），段前0.5行 =====
  if (result.understanding) {
    lines.push(`<w:p>
      <w:pPr>
        <w:spacing w:before="240" w:line="360" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="28"/>
          <w:szCs w:val="28"/>
        </w:rPr>
        <w:t>一、需求理解</w:t>
      </w:r>
    </w:p>`)

    const { intent, entities, implied_requirements, fuzzy_points } = result.understanding

    // （一）意图识别 - 三级标题
    if (intent) {
      lines.push(`<w:p>
        <w:pPr>
          <w:spacing w:before="120" w:line="360" w:lineRule="auto"/>
          <w:ind w:firstLine="480"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
          </w:rPr>
          <w:t>（一）意图识别</w:t>
        </w:r>
      </w:p>`)

      lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="480"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>类型: ${escapeXml(intent.type || '未知')}    置信度: ${escapeXml(intent.confidence || '中')}</w:t></w:r></w:p>`)

      lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="480"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>描述: ${escapeXml(intent.description || 'N/A')}</w:t></w:r></w:p>`)

      if (intent.deep_intent) {
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="480"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>深层意图: ${escapeXml(intent.deep_intent)}</w:t></w:r></w:p>`)
      }

      // 如果意图类型为"未知"，仍然显示所有二级标题，内容提示补充信息
      if (intent.type === '未知' || intent.type === 'unknown') {
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="480"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>提示: 由于需求描述不够明确，无法进行深入分析。请提供更详细的需求描述。</w:t></w:r></w:p>`)
      }

      // （二）实体抽取 - 三级标题
      lines.push(`<w:p>
        <w:pPr>
          <w:spacing w:before="120" w:line="360" w:lineRule="auto"/>
          <w:ind w:firstLine="480"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
          </w:rPr>
          <w:t>（二）实体抽取</w:t>
        </w:r>
      </w:p>`)

      if (entities && entities.length > 0) {
        // 表格
        lines.push(`<w:tbl>
          <w:tblPr>
            <w:tblW w:w="9000" w:type="dxa"/>
            <w:tblBorders>
              <w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>
              <w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>
              <w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>
              <w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>
              <w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>
              <w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>
            </w:tblBorders>
          </w:tblPr>
          <w:tblGrid>
            <w:gridCol w:w="3000"/>
            <w:gridCol w:w="3000"/>
            <w:gridCol w:w="3000"/>
          </w:tblGrid>`)

        // 表头
        lines.push(`<w:tr>
          <w:tc>
            <w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>
            <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>实体名称</w:t></w:r></w:p>
          </w:tc>
          <w:tc>
            <w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>
            <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>类型</w:t></w:r></w:p>
          </w:tc>
          <w:tc>
            <w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>
            <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>置信度</w:t></w:r></w:p>
          </w:tc>
        </w:tr>`)

        // 数据行
        entities.forEach(e => {
          lines.push(`<w:tr>
            <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>${escapeXml(e.name)}</w:t></w:r></w:p></w:tc>
            <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>${escapeXml(e.type)}</w:t></w:r></w:p></w:tc>
            <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>${escapeXml(e.confidence)}</w:t></w:r></w:p></w:tc>
          </w:tr>`)
        })

        lines.push(`</w:tbl>`)
      } else {
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="480"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>暂无相关数据</w:t></w:r></w:p>`)
      }

    // （三）隐含需求 - 三级标题
      lines.push(`<w:p>
        <w:pPr>
          <w:spacing w:before="120" w:line="360" w:lineRule="auto"/>
          <w:ind w:firstLine="480"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
          </w:rPr>
          <w:t>（三）隐含需求</w:t>
        </w:r>
      </w:p>`)

      if (implied_requirements && implied_requirements.length > 0) {
        implied_requirements.forEach((req, i) => {
          lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${i + 1}. ${escapeXml(req.description)}</w:t></w:r></w:p>`)
          lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>来源: ${escapeXml(req.source)} | 状态: ${escapeXml(req.status)} | 置信度: ${escapeXml(req.confidence)}</w:t></w:r></w:p>`)
        })
      } else {
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="480"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>暂无相关数据</w:t></w:r></w:p>`)
      }

    // （四）模糊点 - 三级标题
      lines.push(`<w:p>
        <w:pPr>
          <w:spacing w:before="120" w:line="360" w:lineRule="auto"/>
          <w:ind w:firstLine="480"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
          </w:rPr>
          <w:t>（四）模糊点</w:t>
        </w:r>
      </w:p>`)

      if (fuzzy_points && fuzzy_points.length > 0) {
        fuzzy_points.forEach((point, i) => {
          lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${i + 1}. ${escapeXml(point.fuzzy_point)}</w:t></w:r></w:p>`)
          if (point.options && point.options.length > 0) {
            lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>选项: ${point.options.map(o => escapeXml(o)).join(' / ')}</w:t></w:r></w:p>`)
          }
          if (point.recommendation) {
            lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>建议: ${escapeXml(point.recommendation)}</w:t></w:r></w:p>`)
          }
        })
      } else {
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="480"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>暂无相关数据</w:t></w:r></w:p>`)
      }
  }
}

  // 分页
  lines.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`)

  // ===== 二、需求分析 - 二级标题 =====
  if (result.analysis) {
    lines.push(`<w:p>
      <w:pPr>
        <w:spacing w:before="240" w:line="360" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="28"/>
          <w:szCs w:val="28"/>
        </w:rPr>
        <w:t>二、需求分析</w:t>
      </w:r>
    </w:p>`)

    const { sub_requirements, conflicts, priorities } = result.analysis

    // （一）需求拆解
    if (sub_requirements && sub_requirements.length > 0) {
      lines.push(`<w:p>
        <w:pPr>
          <w:spacing w:before="120" w:line="360" w:lineRule="auto"/>
          <w:ind w:firstLine="480"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
          </w:rPr>
          <w:t>（一）需求拆解</w:t>
        </w:r>
      </w:p>`)

      sub_requirements.forEach(req => {
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>[${escapeXml(req.id)}] ${escapeXml(req.title)}</w:t></w:r></w:p>`)
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>描述: ${escapeXml(req.description)}</w:t></w:r></w:p>`)
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>优先级: ${escapeXml(req.priority)} | 分类: ${escapeXml(req.category)} | 来源: ${escapeXml(req.source)}</w:t></w:r></w:p>`)
      })
    }

    // （二）矛盾检测
    if (conflicts && conflicts.length > 0) {
      lines.push(`<w:p>
        <w:pPr>
          <w:spacing w:before="120" w:line="360" w:lineRule="auto"/>
          <w:ind w:firstLine="480"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
          </w:rPr>
          <w:t>（二）矛盾检测</w:t>
        </w:r>
      </w:p>`)

      conflicts.forEach((conflict, i) => {
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${i + 1}. ${escapeXml(conflict.description)}</w:t></w:r></w:p>`)
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>类型: ${escapeXml(conflict.conflict_type)} | 影响: ${escapeXml(conflict.impact_level)}</w:t></w:r></w:p>`)
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>涉及需求: ${conflict.involved_requirements?.map(r => escapeXml(r)).join(', ')}</w:t></w:r></w:p>`)
      })
    }

    // （三）优先级排序
    if (priorities && priorities.length > 0) {
      lines.push(`<w:p>
        <w:pPr>
          <w:spacing w:before="120" w:line="360" w:lineRule="auto"/>
          <w:ind w:firstLine="480"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
          </w:rPr>
          <w:t>（三）优先级排序</w:t>
        </w:r>
      </w:p>`)

      lines.push(`<w:tbl>
        <w:tblPr>
          <w:tblW w:w="9000" w:type="dxa"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>
          </w:tblBorders>
        </w:tblPr>
        <w:tblGrid>
          <w:gridCol w:w="1500"/>
          <w:gridCol w:w="3000"/>
          <w:gridCol w:w="2250"/>
          <w:gridCol w:w="2250"/>
        </w:tblGrid>`)

      lines.push(`<w:tr>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>排名</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>需求ID</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="2250" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>MoSCoW</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="2250" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>评分</w:t></w:r></w:p></w:tc>
      </w:tr>`)

      priorities.forEach((p, i) => {
        lines.push(`<w:tr>
          <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>${i + 1}</w:t></w:r></w:p></w:tc>
          <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>${escapeXml(p.requirement_id)}</w:t></w:r></w:p></w:tc>
          <w:tc><w:tcPr><w:tcW w:w="2250" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>${escapeXml(p.moscow)}</w:t></w:r></w:p></w:tc>
          <w:tc><w:tcPr><w:tcW w:w="2250" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>${p.score}</w:t></w:r></w:p></w:tc>
        </w:tr>`)
      })

      lines.push(`</w:tbl>`)
    }
  }

  // 分页
  lines.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`)

  // ===== 三、结构化输出 - 二级标题 =====
  if (result.output) {
    lines.push(`<w:p>
      <w:pPr>
        <w:spacing w:before="240" w:line="360" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:b/>
          <w:sz w:val="28"/>
          <w:szCs w:val="28"/>
        </w:rPr>
        <w:t>三、结构化输出</w:t>
      </w:r>
    </w:p>`)

    const { user_stories, acceptance_criteria, technical_suggestions, risk_list } = result.output

    // （一）用户故事
    if (user_stories && user_stories.length > 0) {
      lines.push(`<w:p>
        <w:pPr>
          <w:spacing w:before="120" w:line="360" w:lineRule="auto"/>
          <w:ind w:firstLine="480"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
          </w:rPr>
          <w:t>（一）用户故事</w:t>
        </w:r>
      </w:p>`)

      user_stories.forEach((story, i) => {
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${i + 1}. [${escapeXml(story.priority)}]</w:t></w:r></w:p>`)
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>作为一个${escapeXml(story.role)}，我希望${escapeXml(story.action)}，以便${escapeXml(story.value)}</w:t></w:r></w:p>`)
      })
    }

    // （二）验收标准
    if (acceptance_criteria && acceptance_criteria.length > 0) {
      lines.push(`<w:p>
        <w:pPr>
          <w:spacing w:before="120" w:line="360" w:lineRule="auto"/>
          <w:ind w:firstLine="480"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
          </w:rPr>
          <w:t>（二）验收标准</w:t>
        </w:r>
      </w:p>`)

      acceptance_criteria.forEach((ac, i) => {
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${i + 1}. ${escapeXml(ac.scenario)} [${escapeXml(ac.category)}]</w:t></w:r></w:p>`)
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>Given: ${escapeXml(ac.given)}</w:t></w:r></w:p>`)
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>When: ${escapeXml(ac.when)}</w:t></w:r></w:p>`)
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>Then: ${escapeXml(ac.then)}</w:t></w:r></w:p>`)
      })
    }

    // （三）技术建议
    if (technical_suggestions && technical_suggestions.length > 0) {
      lines.push(`<w:p>
        <w:pPr>
          <w:spacing w:before="120" w:line="360" w:lineRule="auto"/>
          <w:ind w:firstLine="480"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
          </w:rPr>
          <w:t>（三）技术建议</w:t>
        </w:r>
      </w:p>`)

      technical_suggestions.forEach((ts, i) => {
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${i + 1}. ${escapeXml(ts.area)} (风险: ${escapeXml(ts.risk_level)})</w:t></w:r></w:p>`)
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>建议: ${escapeXml(ts.suggestion)}</w:t></w:r></w:p>`)
        lines.push(`<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto" w:ind w:firstLine="960"/><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>缓解方案: ${escapeXml(ts.mitigation)}</w:t></w:r></w:p>`)
      })
    }

    // （四）风险清单
    if (risk_list && risk_list.length > 0) {
      lines.push(`<w:p>
        <w:pPr>
          <w:spacing w:before="120" w:line="360" w:lineRule="auto"/>
          <w:ind w:firstLine="480"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
          </w:rPr>
          <w:t>（四）风险清单</w:t>
        </w:r>
      </w:p>`)

      lines.push(`<w:tbl>
        <w:tblPr>
          <w:tblW w:w="9000" w:type="dxa"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>
          </w:tblBorders>
        </w:tblPr>
        <w:tblGrid>
          <w:gridCol w:w="3000"/>
          <w:gridCol w:w="1500"/>
          <w:gridCol w:w="1500"/>
          <w:gridCol w:w="3000"/>
        </w:tblGrid>`)

      lines.push(`<w:tr>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>风险</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>概率</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>影响</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>缓解策略</w:t></w:r></w:p></w:tc>
      </w:tr>`)

      risk_list.forEach(risk => {
        lines.push(`<w:tr>
          <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>${escapeXml(risk.risk)}</w:t></w:r></w:p></w:tc>
          <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>${escapeXml(risk.probability)}</w:t></w:r></w:p></w:tc>
          <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>${escapeXml(risk.impact)}</w:t></w:r></w:p></w:tc>
          <w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:eastAsia="宋体" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr><w:t>${escapeXml(risk.mitigation)}</w:t></w:r></w:p></w:tc>
        </w:tr>`)
      })

      lines.push(`</w:tbl>`)
    }
  }

  lines.push(`</w:body></w:document>`)

  return lines.join('\n')
}

// 导出为 DOCX 格式 - 使用完整的OOXML格式
export async function exportToDocx(result) {
  try {
    const blob = await createDocxFile(result)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = generateFilename('docx', result.requirement_id)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('DOCX导出失败:', err)
    throw new Error('DOCX导出失败')
  }
}

// 导出为 PDF 格式 - 使用浏览器原生打印功能
export async function exportToPdf(result) {
  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    throw new Error('无法打开打印窗口，请检查浏览器弹出窗口设置')
  }

  const htmlContent = buildPrintHtml(result)

  printWindow.document.write(htmlContent)
  printWindow.document.close()

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }
}

// 构建打印 HTML
function buildPrintHtml(result) {
  const escapeHtml = (str) => {
    if (!str) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AI需求分析结果 - ${escapeHtml(result.requirement_id || '')}</title>
  <style>
    @media print {
      @page { margin: 20mm; }
      h1 { page-break-before: always; }
      .page-break { page-break-before: always; }
    }
    body { font-family: "Microsoft YaHei", "SimHei", Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #333; }
    h1 { font-size: 24px; color: #1677ff; border-bottom: 2px solid #1677ff; padding-bottom: 8px; }
    h2 { font-size: 18px; color: #333; margin-top: 24px; border-left: 4px solid #1677ff; padding-left: 8px; }
    h3 { font-size: 14px; color: #555; margin-top: 16px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; font-weight: bold; }
    .meta { color: #666; margin-bottom: 16px; }
    .section { margin: 16px 0; }
    .user-story { background: #f9f9f9; padding: 12px; border-radius: 4px; margin: 8px 0; border-left: 4px solid #52c41a; }
    .criteria { background: #f9f9f9; padding: 12px; border-radius: 4px; margin: 8px 0; }
  </style>
</head>
<body>
  <h1>AI需求分析结果</h1>
  <div class="meta">
    <p>需求ID: ${escapeHtml(result.requirement_id)} | 处理耗时: ${result.processing_time_ms ? `${result.processing_time_ms}ms` : 'N/A'}</p>
  </div>`

  if (result.understanding) {
    const { intent, entities, implied_requirements, fuzzy_points } = result.understanding

    html += '<h2>一、需求理解</h2>'

    if (intent) {
      html += `
      <div class="section">
        <h3>（一）意图识别</h3>
        <p>类型: ${escapeHtml(intent.type)} | 置信度: ${escapeHtml(intent.confidence)}</p>
        <p>描述: ${escapeHtml(intent.description)}</p>
        ${intent.deep_intent ? `<p>深层意图: ${escapeHtml(intent.deep_intent)}</p>` : ''}
      </div>`
    }

    if (entities && entities.length > 0) {
      html += `
      <div class="section">
        <h3>（二）实体抽取</h3>
        <table>
          <tr><th>实体名称</th><th>类型</th><th>置信度</th></tr>
          ${entities.map(e => `<tr><td>${escapeHtml(e.name)}</td><td>${escapeHtml(e.type)}</td><td>${escapeHtml(e.confidence)}</td></tr>`).join('')}
        </table>
      </div>`
    }

    if (implied_requirements && implied_requirements.length > 0) {
      html += `
      <div class="section">
        <h3>（三）隐含需求</h3>
        <ol>
          ${implied_requirements.map(req => `<li>${escapeHtml(req.description)} (来源: ${escapeHtml(req.source)} | ${escapeHtml(req.status)})</li>`).join('')}
        </ol>
      </div>`
    }

    if (fuzzy_points && fuzzy_points.length > 0) {
      html += `
      <div class="section">
        <h3>（四）模糊点</h3>
        <ul>
          ${fuzzy_points.map(point => `<li><strong>${escapeHtml(point.fuzzy_point)}</strong>
            ${point.options && point.options.length > 0 ? `<br>选项: ${point.options.map(o => escapeHtml(o)).join(' / ')}` : ''}
            ${point.recommendation ? `<br><em>建议: ${escapeHtml(point.recommendation)}</em>` : ''}</li>`).join('')}
        </ul>
      </div>`
    }
  }

  if (result.analysis) {
    const { sub_requirements, conflicts, priorities } = result.analysis

    html += '<div class="page-break"><h2>二、需求分析</h2></div>'

    if (sub_requirements && sub_requirements.length > 0) {
      html += `
      <div class="section">
        <h3>（一）需求拆解</h3>
        ${sub_requirements.map(req => `
          <div class="criteria">
            <strong>[${escapeHtml(req.id)}] ${escapeHtml(req.title)}</strong>
            <p>${escapeHtml(req.description)}</p>
            <p><em>优先级: ${escapeHtml(req.priority)} | 分类: ${escapeHtml(req.category)} | 来源: ${escapeHtml(req.source)}</em></p>
          </div>
        `).join('')}
      </div>`
    }

    if (conflicts && conflicts.length > 0) {
      html += `
      <div class="section">
        <h3>（二）矛盾检测</h3>
        <ul>
          ${conflicts.map((c, i) => `<li><strong>${escapeHtml(c.description)}</strong> (${escapeHtml(c.conflict_type)} | 影响: ${escapeHtml(c.impact_level)})</li>`).join('')}
        </ul>
      </div>`
    }

    if (priorities && priorities.length > 0) {
      html += `
      <div class="section">
        <h3>（三）优先级排序</h3>
        <table>
          <tr><th>排名</th><th>需求ID</th><th>MoSCoW</th><th>评分</th></tr>
          ${priorities.map((p, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(p.requirement_id)}</td><td>${escapeHtml(p.moscow)}</td><td>${p.score}</td></tr>`).join('')}
        </table>
      </div>`
    }
  }

  if (result.output) {
    const { user_stories, acceptance_criteria, technical_suggestions, risk_list } = result.output

    html += '<div class="page-break"><h2>三、结构化输出</h2></div>'

    if (user_stories && user_stories.length > 0) {
      html += `
      <div class="section">
        <h3>（一）用户故事</h3>
        ${user_stories.map(story => `
          <div class="user-story">
            <p><strong>优先级:</strong> ${escapeHtml(story.priority)}</p>
            <p>作为一个${escapeHtml(story.role)}，我希望${escapeHtml(story.action)}，以便${escapeHtml(story.value)}</p>
          </div>
        `).join('')}
      </div>`
    }

    if (acceptance_criteria && acceptance_criteria.length > 0) {
      html += `
      <div class="section">
        <h3>（二）验收标准</h3>
        ${acceptance_criteria.map((ac, i) => `
          <div class="criteria">
            <p><strong>${i + 1}. ${escapeHtml(ac.scenario)}</strong> [${escapeHtml(ac.category)}]</p>
            <p>Given: ${escapeHtml(ac.given)}</p>
            <p>When: ${escapeHtml(ac.when)}</p>
            <p>Then: ${escapeHtml(ac.then)}</p>
          </div>
        `).join('')}
      </div>`
    }

    if (technical_suggestions && technical_suggestions.length > 0) {
      html += `
      <div class="section">
        <h3>（三）技术建议</h3>
        <ul>
          ${technical_suggestions.map((ts, i) => `<li><strong>${escapeHtml(ts.area)}</strong> (风险: ${escapeHtml(ts.risk_level)})<br>建议: ${escapeHtml(ts.suggestion)}<br>缓解方案: ${escapeHtml(ts.mitigation)}</li>`).join('')}
        </ul>
      </div>`
    }

    if (risk_list && risk_list.length > 0) {
      html += `
      <div class="section">
        <h3>（四）风险清单</h3>
        <table>
          <tr><th>风险</th><th>概率</th><th>影响</th><th>缓解策略</th></tr>
          ${risk_list.map(risk => `<tr><td>${escapeHtml(risk.risk)}</td><td>${escapeHtml(risk.probability)}</td><td>${escapeHtml(risk.impact)}</td><td>${escapeHtml(risk.mitigation)}</td></tr>`).join('')}
        </table>
      </div>`
    }
  }

  html += `
</body>
</html>`

  return html
}