import { FormEvent, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toUserMessage } from '@/api/client'
import { createWorkLog } from '@/api/workLogsApi'
import { fetchSectionByCode, fetchSectionById } from '@/api/sectionsApi'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useGeolocation } from '@/hooks/useGeolocation'
import { OTHER_WORK_TYPE } from '@/lib/constants'
import { formatSubmittedDate, formatSubmittedTime } from '@/lib/dateFilters'
import { defaultFormSettings, readFormSettings } from '@/lib/formSettings'
import { uploadWorkPhotos } from '@/lib/photos'
import { fetchActiveWorkTypes } from '@/lib/workTypesApi'
import type { Section, WorkType } from '@/lib/types'

type FormSettings = typeof defaultFormSettings

function SectionInfoHeader({ section }: { section: Section }) {
  const objectName = section.objects?.name ?? '—'
  return (
    <header className="mb-4 rounded-xl bg-emerald-800 px-4 py-4 text-white">
      <dl className="space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="opacity-80">Объект:</dt>
          <dd className="font-medium">{objectName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="opacity-80">Участок:</dt>
          <dd className="font-medium">{section.name}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="opacity-80">Культура:</dt>
          <dd className="font-medium">{section.culture ?? '—'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="opacity-80">Код участка:</dt>
          <dd className="font-mono font-semibold">{section.code}</dd>
        </div>
      </dl>
    </header>
  )
}

function FormNavigation({
  onBack,
  onHome,
  onClose,
}: {
  onBack: () => void
  onHome: () => void
  onClose: () => void
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed right-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg text-slate-700 shadow-md ring-1 ring-slate-200 hover:bg-slate-50"
        aria-label="Закрыть"
      >
        ✕
      </button>
      <nav className="mb-4 flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Назад
        </button>
        <button
          type="button"
          onClick={onHome}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          🏠 Главная
        </button>
      </nav>
    </>
  )
}

export function WorkFormPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { sectionCode } = useParams<{ sectionCode: string }>()

  const objectId = Number(params.get('objectId'))
  const legacySectionId = Number(params.get('sectionId'))

  const [section, setSection] = useState<Section | null>(null)
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
  const [settings, setSettings] = useState<FormSettings>(defaultFormSettings)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [workerName, setWorkerName] = useState('')
  const [workTypeId, setWorkTypeId] = useState('')
  const [customWorkType, setCustomWorkType] = useState('')
  const [volume, setVolume] = useState('')
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<FileList | null>(null)

  const { geo, requestGeolocation } = useGeolocation()
  const selectedType = workTypes.find((w) => String(w.id) === workTypeId)
  const isOther = selectedType?.is_other ?? selectedType?.name === OTHER_WORK_TYPE

  function goHome() {
    navigate('/')
  }

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else goHome()
  }

  async function loadWorkTypes() {
    const active = await fetchActiveWorkTypes()
    setWorkTypes(active)
  }

  function createNewReport() {
    setSuccess(false)
    setSubmittedAt(null)
    setError(null)
    void loadWorkTypes()
  }

  useEffect(() => {
    async function load() {
      const hasPath = !!sectionCode
      const hasLegacy = !!objectId && !!legacySectionId
      if (!hasPath && !hasLegacy) {
        setError('Неверная ссылка QR. Отсканируйте код на участке.')
        setLoading(false)
        return
      }

      setSettings(readFormSettings())
      try {
        const sec = hasPath
          ? await fetchSectionByCode(sectionCode!)
          : await fetchSectionById(legacySectionId)
        setSection(sec)
        await loadWorkTypes()
      } catch (err) {
        console.error('[work-form] load:', err)
        setError(toUserMessage(err, 'Участок не найден'))
      }
      setLoading(false)
      void requestGeolocation()
    }
    void load()
  }, [objectId, legacySectionId, requestGeolocation, sectionCode])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && section && !success) {
        void loadWorkTypes()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [section, success])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!section) return
    if (!workerName.trim()) {
      setError('Укажите ФИО работника')
      return
    }
    if (!workTypeId) {
      setError('Выберите вид работы')
      return
    }
    if (isOther && !customWorkType.trim()) {
      setError('Укажите вид работы вручную')
      return
    }
    if (!volume.trim()) {
      setError('Укажите объём выполненной работы')
      return
    }
    if (!photos?.length) {
      setError('Загрузите хотя бы одно фото')
      return
    }

    setSubmitting(true)
    try {
      const geoResult = geo.status === 'pending' ? await requestGeolocation() : geo
      const photoUrls = await uploadWorkPhotos(Array.from(photos))
      const hasCoords = geoResult.latitude != null && geoResult.longitude != null

      const created = await createWorkLog({
        sectionId: section.id,
        workerFullName: workerName.trim(),
        workTypeId: Number(workTypeId),
        customWorkType: isOther ? customWorkType.trim() : null,
        workVolume: volume.trim(),
        comment: comment.trim() || '',
        photoUrls,
        latitude: geoResult.latitude,
        longitude: geoResult.longitude,
        locationAccuracy: geoResult.accuracy,
        locationAllowed: geoResult.status === 'granted' && hasCoords,
      })

      setWorkerName('')
      setWorkTypeId('')
      setCustomWorkType('')
      setVolume('')
      setComment('')
      setPhotos(null)
      setSubmittedAt(created.submitted_at)
      setSuccess(true)
    } catch (err) {
      console.error('[work-form] submit:', err)
      setError(toUserMessage(err, 'Не удалось сохранить отчет'))
    } finally {
      setSubmitting(false)
    }
  }

  const shell = (children: ReactNode) => (
    <div className="relative mx-auto min-h-screen max-w-lg p-4 pb-8 pt-12">
      <FormNavigation onBack={goBack} onHome={goHome} onClose={goBack} />
      {children}
    </div>
  )

  if (loading) {
    return shell(
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-600">Загрузка формы...</p>
      </div>
    )
  }

  if (error && !section) {
    return shell(
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={goHome}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Вернуться на главную
        </button>
      </div>
    )
  }

  if (success && section && submittedAt) {
    const successText = settings.form_success_text ?? 'Отчет успешно отправлен'
    const objectName = section.objects?.name ?? '—'

    return shell(
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 py-6 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="text-xl font-bold text-emerald-800">{successText}</h1>
        <p className="text-sm text-slate-600">
          {section.name} · {objectName}
          <br />
          {formatSubmittedDate(submittedAt)} {formatSubmittedTime(submittedAt)}
        </p>
        <button
          type="button"
          onClick={createNewReport}
          className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Отправить ещё отчёт
        </button>
        <button type="button" onClick={goHome} className="text-sm text-emerald-700 underline">
          На главную
        </button>
      </div>
    )
  }

  if (!section) return null

  return shell(
    <>
      <SectionInfoHeader section={section} />

      {settings.form_description && (
        <p className="mb-4 text-sm text-slate-600">{settings.form_description}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="ФИО работника *"
          value={workerName}
          onChange={(e) => setWorkerName(e.target.value)}
          required
        />

        <Select
          label="Вид работы *"
          value={workTypeId}
          onChange={(e) => setWorkTypeId(e.target.value)}
          required
          options={[
            { value: '', label: '— выберите —' },
            ...workTypes.map((t) => ({ value: String(t.id), label: t.name })),
          ]}
        />

        {isOther && (
          <Input
            label="Укажите вид работы *"
            value={customWorkType}
            onChange={(e) => setCustomWorkType(e.target.value)}
            required
          />
        )}

        <Input
          label="Объём выполненной работы *"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          placeholder="300 м²"
          required
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Фото *</label>
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="w-full text-sm"
            onChange={(e) => setPhotos(e.target.files)}
            required
          />
        </div>

        <Textarea
          label="Комментарий"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Необязательно"
        />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span>
            Геолокация:{' '}
            {geo.status === 'granted'
              ? `получена${geo.accuracy != null ? ` (±${Math.round(geo.accuracy)} м)` : ''}`
              : geo.status === 'denied'
                ? 'не разрешена'
                : geo.status === 'unsupported'
                  ? 'не поддерживается'
                  : 'ожидание…'}
          </span>
          {geo.mapUrl && (
            <>
              <span className="mx-2">·</span>
              <a href={geo.mapUrl} target="_blank" rel="noreferrer" className="text-emerald-700 underline">
                на карте
              </a>
            </>
          )}
        </div>

        {settings.form_hints && (
          <p className="text-xs text-slate-500">{settings.form_hints}</p>
        )}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Отправка…' : settings.form_submit_text}
        </Button>
      </form>
    </>
  )
}
