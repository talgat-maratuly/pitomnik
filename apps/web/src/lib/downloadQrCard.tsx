import { type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import { QrPrintCard } from '@/components/QrPrintCard'
import type { Section } from '@/lib/types'

export interface DownloadQrCardOptions {
  objectName: string
  formUrl: string
  filename: string
  section?: Section
  title?: string
  code?: string
  description?: ReactNode
}

export async function downloadQrPrintCardPng({
  objectName,
  formUrl,
  filename,
  section,
  title,
  code,
  description,
}: DownloadQrCardOptions): Promise<void> {
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-1;'
  document.body.appendChild(container)

  const root = createRoot(container)

  try {
    await new Promise<void>((resolve) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve())
        })
      }

      root.render(
        <QrPrintCard
          section={section}
          objectName={objectName}
          formUrl={formUrl}
          title={title}
          code={code}
          description={description}
          onReady={done}
        />
      )

      window.setTimeout(done, 2000)
    })

    const card = container.querySelector('.qr-print-card')
    if (!card) {
      throw new Error('QR card element not found')
    }

    const canvas = await html2canvas(card as HTMLElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    })

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) {
      throw new Error('Failed to create PNG')
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    root.unmount()
    container.remove()
  }
}
