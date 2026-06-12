import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { QrPrintCard } from '@/components/QrPrintCard'
import type { Section } from '@/lib/types'

interface Props {
  section: Section | null
  objectName: string
  formUrl: string
  onClose: () => void
  autoPrint?: boolean
}

export function QrPrintModal({ section, objectName, formUrl, onClose, autoPrint }: Props) {
  useEffect(() => {
    if (!section || !autoPrint) return
    const t = window.setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [section, autoPrint, formUrl])

  if (!section) return null

  return createPortal(
    <>
      <div
        className="no-print fixed inset-0 z-40 bg-black/40"
        aria-hidden
        onClick={onClose}
      />
      <div className="no-print fixed right-4 top-4 z-50">
        <button
          type="button"
          onClick={onClose}
          className="no-print flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-slate-700 shadow-md ring-1 ring-slate-200 hover:bg-slate-50"
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>
      <QrPrintCard
        section={section}
        objectName={objectName}
        formUrl={formUrl}
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
      />
      <div className="no-print fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-800"
        >
          Печать
        </button>
      </div>
    </>,
    document.body
  )
}
