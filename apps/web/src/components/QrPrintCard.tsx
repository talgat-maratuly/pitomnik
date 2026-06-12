import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { getNurseryName } from '@/lib/appConfig'
import type { Section } from '@/lib/types'

interface Props {
  section: Section
  objectName: string
  formUrl: string
  className?: string
}

export function QrPrintCard({ section, objectName, formUrl, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, formUrl, { width: 200, margin: 2 })
  }, [formUrl])

  return (
    <div
      className={`qr-print-card mx-auto w-full max-w-sm rounded-xl border-2 border-slate-800 bg-white p-6 text-center ${className}`}
    >
      <p className="text-lg font-bold">{getNurseryName()}</p>
      <p className="mt-1 text-sm text-slate-600">{objectName}</p>
      <h2 className="mt-2 text-xl font-semibold">{section.name}</h2>
      <p className="mt-1 font-mono text-sm text-slate-500">Код: {section.code}</p>
      <div className="my-4 flex justify-center">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-sm leading-snug text-slate-700">
        <strong>Отсканируйте QR-код</strong>, заполните форму и отправьте отчёт о выполненной работе.
      </p>
    </div>
  )
}
