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
    QRCode.toCanvas(canvasRef.current, formUrl, { width: 512, margin: 2 })
  }, [formUrl])

  return (
    <div
      className={`qr-print-card mx-auto max-w-sm rounded-xl border-2 border-slate-800 bg-white p-6 text-center ${className}`}
    >
      <p className="qr-print-nursery text-lg font-bold">{getNurseryName()}</p>
      <p className="qr-print-object mt-1 text-sm text-slate-600">{objectName}</p>
      <p className="qr-print-section mt-2 text-xl font-semibold">{section.name}</p>
      <p className="qr-print-code mt-1 font-mono text-sm text-slate-500">Код: {section.code}</p>
      <div className="my-4 flex justify-center">
        <canvas ref={canvasRef} className="h-[200px] w-[200px]" />
      </div>
      <p className="qr-print-instruction text-sm leading-snug text-slate-700">
        <strong>Отсканируйте QR-код</strong>, заполните форму и отправьте отчёт о выполненной работе.
      </p>
    </div>
  )
}
