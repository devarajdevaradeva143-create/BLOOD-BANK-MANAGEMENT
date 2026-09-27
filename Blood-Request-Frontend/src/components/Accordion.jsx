import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function Accordion({ items, defaultOpen = 0 }) {
  const [openIndex, setOpenIndex] = useState(defaultOpen)

  function toggle(index) {
    setOpenIndex((prev) => (prev === index ? -1 : index))
  }

  return (
    <div className="card divide-y divide-slate-200/80 dark:divide-slate-800">
      {items.map((item, index) => {
        const open = openIndex === index
        return (
          <div key={index}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {item.q}
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 dark:text-slate-500 ${
                  open ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
            <div className={`accordion-panel${open ? ' open' : ''}`}>
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
