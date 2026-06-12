import { useCallback, useEffect, useState } from 'react'
import { QrPrintModal } from '@/components/QrPrintModal'
import { DeleteSectionDialog } from '@/components/DeleteSectionDialog'
import { Toast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { fetchSections } from '@/api/sectionsApi'
import { API_ORIGIN, toUserMessage } from '@/api/client'
import { buildQrImageUrl, buildWorkFormUrlBySectionCode } from '@/lib/appConfig'
import { onSectionsChanged } from '@/lib/sectionEvents'
import type { Section } from '@/lib/types'

export function QrPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [printSectionCode, setPrintSectionCode] = useState<string | null>(null)
  const [autoPrint, setAutoPrint] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const loadSections = useCallback(async () => {
    try {
      const data = await fetchSections()
      setSections(data)
      setError(null)
    } catch (err) {
      console.error('[qr]', err)
      setError(toUserMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSections()
    return onSectionsChanged(() => {
      void loadSections()
    })
  }, [loadSections])

  const printSection = printSectionCode
    ? sections.find((s) => s.code === printSectionCode) ?? null
    : null

  function downloadQrPng(section: Section) {
    const a = document.createElement('a')
    a.href = buildQrImageUrl(section.code)
    a.download = `qr-${section.code}.png`
    a.click()
  }

  function handleSectionDeleted(id: number) {
    setSections((prev) => prev.filter((s) => s.id !== id))
    if (sectionToDelete?.id === id && printSectionCode === sectionToDelete.code) {
      setPrintSectionCode(null)
    }
    setToast('Участок успешно удален.')
  }

  function openPrint(section: Section) {
    setPrintSectionCode(section.code)
    setAutoPrint(true)
  }

  function closePrint() {
    setPrintSectionCode(null)
    setAutoPrint(false)
  }

  return (
    <div className="no-print space-y-6">
      <h1 className="text-2xl font-bold">QR-коды</h1>
      <p className="text-sm text-slate-500">QR генерируется сервером: {API_ORIGIN}/api/qr/&#123;код&#125;</p>

      {error && <p className="text-red-600">{error}</p>}
      {loading ? (
        <p className="text-slate-600">Загрузка…</p>
      ) : sections.length === 0 ? (
        <p className="text-slate-600">Участков пока нет</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-3">Объект</th>
                <th className="px-3 py-3">Участок</th>
                <th className="px-3 py-3">Код</th>
                <th className="px-3 py-3">Форма</th>
                <th className="px-3 py-3">QR</th>
                <th className="px-3 py-3">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sections.map((s) => {
                const formUrl = buildWorkFormUrlBySectionCode(s.code)
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3">{s.objects?.name ?? '—'}</td>
                    <td className="px-3 py-3">{s.name}</td>
                    <td className="px-3 py-3 font-mono text-xs">{s.code}</td>
                    <td className="px-3 py-3">
                      <a href={formUrl} target="_blank" rel="noreferrer" className="text-emerald-700 underline break-all">
                        {formUrl}
                      </a>
                    </td>
                    <td className="px-3 py-3">
                      <img src={buildQrImageUrl(s.code)} alt="QR" className="h-[90px] w-[90px]" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => downloadQrPng(s)}>
                          Скачать PNG
                        </Button>
                        <Button onClick={() => window.open(formUrl, '_blank')}>Открыть форму</Button>
                        <Button variant="ghost" onClick={() => openPrint(s)}>
                          Печать
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setSectionToDelete(s)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Удалить
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <QrPrintModal
        section={printSection}
        objectName={printSection?.objects?.name ?? '—'}
        formUrl={printSection ? buildWorkFormUrlBySectionCode(printSection.code) : ''}
        onClose={closePrint}
        autoPrint={autoPrint}
      />

      <DeleteSectionDialog
        section={sectionToDelete}
        onClose={() => setSectionToDelete(null)}
        onSuccess={handleSectionDeleted}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
