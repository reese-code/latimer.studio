import { createElement as h } from 'react'
import { set } from 'sanity'

// Shape of each option, drawn at the same area so the three read as a set.
const OPTIONS = [
  { value: '3:4', label: '3:4', w: 30, h: 40 },
  { value: '1:1', label: '1:1', w: 35, h: 35 },
  { value: '4:3', label: '4:3', w: 40, h: 30 },
]

// Radio-style picker with a small outline of each aspect ratio.
export default function AspectRatioInput({ value, onChange, readOnly }) {
  return h(
    'div',
    { style: { display: 'flex', gap: 12 } },
    OPTIONS.map((o) => {
      const selected = value === o.value
      return h(
        'button',
        {
          key: o.value,
          type: 'button',
          disabled: readOnly,
          onClick: () => onChange(set(o.value)),
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: '12px 18px',
            minWidth: 84,
            cursor: readOnly ? 'default' : 'pointer',
            background: 'transparent',
            color: 'inherit',
            font: 'inherit',
            borderRadius: 4,
            border: `2px solid ${selected ? '#2276fc' : 'rgba(128,128,128,0.35)'}`,
          },
        },
        h(
          'div',
          { style: { width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          h('div', {
            style: {
              width: o.w,
              height: o.h,
              borderRadius: 3,
              background: selected ? '#2276fc' : 'rgba(128,128,128,0.45)',
            },
          })
        ),
        h('span', { style: { fontSize: 13, fontWeight: selected ? 600 : 400 } }, o.label)
      )
    })
  )
}
