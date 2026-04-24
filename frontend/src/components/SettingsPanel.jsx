import React from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import {
  DEFAULT_VIEW_OPTIONS,
  DENSITY_OPTIONS,
  FONT_SCALE_OPTIONS
} from '../services/settings'

function SettingsPanel({ settings, onChange, onClose }) {
  if (!settings) return null

  const renderSelect = (label, value, options, field) => (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <div className="typography-body-sm" style={{ color: '#666', marginBottom: 8 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="typography-body-sm"
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #d9d9d9',
          background: 'white'
        }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        width: 360,
        background: 'white',
        border: '1px solid #e8e8e8',
        borderRadius: 12,
        boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
        zIndex: 120
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 18px',
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: '#f0f5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1677ff'
            }}
          >
            <SlidersHorizontal size={16} />
          </div>
          <div className="typography-heading-md" style={{ fontSize: '18px', fontWeight: 600 }}>
            界面设置
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: '#666',
            padding: 4
          }}
          title="关闭设置"
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: 18, maxHeight: '70vh', overflowY: 'auto' }}>
        <div style={{ marginBottom: 18 }}>
          <div className="typography-heading-md" style={{ fontSize: '16px', marginBottom: 12 }}>常用设置</div>
          {renderSelect('默认结果视图', settings.defaultView, DEFAULT_VIEW_OPTIONS, 'defaultView')}
          {renderSelect('字号大小', settings.fontScale, FONT_SCALE_OPTIONS, 'fontScale')}
          {renderSelect('界面密度', settings.density, DENSITY_OPTIONS, 'density')}

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 12px',
              border: '1px solid #f0f0f0',
              borderRadius: 8
            }}
          >
            <div>
              <div className="typography-body-sm" style={{ fontWeight: 600 }}>自动保存历史</div>
              <div className="typography-caption" style={{ color: '#8c8c8c' }}>分析完成后自动加入历史记录</div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSaveHistory}
              onChange={(e) => onChange('autoSaveHistory', e.target.checked)}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
