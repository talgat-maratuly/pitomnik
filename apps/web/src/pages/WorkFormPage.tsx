import { FormEvent, useEffect, useState, type ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
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
import { fetchOpenTasksForSection, type ApiTask } from '@/api/tasksApi'
import { useAuth } from '@/context/AuthContext'
import type { Section, WorkType } from '@/lib/types'

type FormSettings = typeof defaultFormSettings
const completionOptions = ['25%', '50%', '75%', '100%'] as const
const OTHER_COMPLETION = 'OTHER'

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

function clearFormFields(setters: {
  setWorkerName: (v: string) => void
  setWorkTypeId: (v: string) => void
  setTaskId: (v: string) => void
  setCustomWorkType: (v: string) => void
  setCompletionPercent: (v: string) => void
  setCustomCompletionPercent: (v: string) => void
  setComment: (v: string) => void
  setPhotos: (v: FileList | null) => void
}) {
  setters.setWorkerName('')
  setters.setWorkTypeId('')
  setters.setTaskId('')
  setters.setCustomWorkType('')
  setters.setCompletionPercent('')
  setters.setCustomCompletionPercent('')
  setters.setComment('')
  setters.setPhotos(null)
}

export function WorkFormPage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const { sectionCode } = useParams<{ sectionCode: string }>()

  const objectId = Number(params.get('objectId'))
  const legacySectionId = Number(params.get('sectionId'))

  const [section, setSection] = useState<Section | null>(null)
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
  const [openTasks, setOpenTasks] = useState<ApiTask[]>([])
  const [settings, setSettings] = useState<FormSettings>(defaultFormSettings)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [closeHint, setCloseHint] = useState(false)

  const [workerName, setWorkerName] = useState('')
  const [workTypeId, setWorkTypeId] = useState('')
  const [taskId, setTaskId] = useState('')
  const [customWorkType, setCustomWorkType] = useState('')
  const [completionPercent, setCompletionPercent] = useState('')
  const [customCompletionPercent, setCustomCompletionPercent] = useState('')
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<FileList | null>(null)

  const { geo, requestGeolocation } = useGeolocation()
  const selectedType = workTypes.find((w) => String(w.id) === workTypeId)
  const isOther = selectedType?.is_other ?? selectedType?.name === OTHER_WORK_TYPE
  const sessionWorkerName = user?.fullName ?? ''
  const selectedCompletionValue =
    completionPercent === OTHER_COMPLETION
      ? customCompletionPercent.trim()
      : completionPercent

  async function loadWorkTypes() {
    const active = await fetchActiveWorkTypes()
    setWorkTypes(active)
  }

  function createNewReport() {
    setSuccess(false)
    setSubmittedAt(null)
    setError(null)
    setCloseHint(false)
    clearFormFields({
      setWorkerName,
      setWorkTypeId,
      setTaskId,
      setCustomWorkType,
      setCompletionPercent,
      setCustomCompletionPercent,
      setComment,
      setPhotos,
    })
    if (sessionWorkerName) {
      setWorkerName(sessionWorkerName)
    }
    void loadWorkTypes()
  }

  function closePage() {
    setCloseHint(false)
    window.close()
    window.setTimeout(() => setCloseHint(true), 300)
  }

  useEffect(() => {
    if (sessionWorkerName && !workerName.trim()) {
      setWorkerName(sessionWorkerName)
    }
  }, [sessionWorkerName, workerName])

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
        const tasks = await fetchOpenTasksForSection(sec.id).catch(() => [])
        setOpenTasks(tasks)
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
    if (!sessionWorkerName && !workerName.trim()) {
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
    if (!completionPercent) {
      setError('Укажите процент выполнения')
      return
    }
    if (completionPercent === OTHER_COMPLETION) {
      const parsed = Number(customCompletionPercent)
      if (!customCompletionPercent.trim() || !Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
        setError('Укажите процент выполнения от 1 до 100')
        return
      }
    }
    if (!selectedCompletionValue) {
      setError('Укажите процент выполнения')
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
        taskId: taskId ? Number(taskId) : undefined,
        customWorkType: isOther ? customWorkType.trim() : null,
        workVolume: `${selectedCompletionValue.replace('%', '')}%`,
        comment: comment.trim() || '',
        photoUrls,
        latitude: geoResult.latitude,
        longitude: geoResult.longitude,
        locationAccuracy: geoResult.accuracy,
        locationAllowed: geoResult.status === 'granted' && hasCoords,
      })

      clearFormFields({
        setWorkerName,
        setWorkTypeId,
        setTaskId,
        setCustomWorkType,
        setCompletionPercent,
        setCustomCompletionPercent,
        setComment,
        setPhotos,
      })
      setSubmittedAt(created.submitted_at)
      setSuccess(true)
      setCloseHint(false)
    } catch (err) {
      console.error('[work-form] submit:', err)
      setError(toUserMessage(err, 'Не удалось сохранить отчет'))
    } finally {
      setSubmitting(false)
    }
  }

  const shell = (children: ReactNode) => (
    <div className="mx-auto min-h-screen max-w-lg p-4 pb-8 pt-4">{children}</div>
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
          onClick={closePage}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Закрыть страницу
        </button>
        {closeHint && (
          <p className="text-sm text-slate-600">Теперь можно просто закрыть эту вкладку.</p>
        )}
      </div>
    )
  }

  if (success && section && submittedAt) {
    const objectName = section.objects?.name ?? '—'

    return shell(
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 py-6 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="text-xl font-bold text-emerald-800">Отчет успешно отправлен</h1>
        <p className="text-sm text-slate-600">Спасибо! Ваш отчет успешно сохранен.</p>
        <dl className="space-y-1 text-sm text-slate-700">
          <div>
            <dt className="inline font-medium">Объект: </dt>
            <dd className="inline">{objectName}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Участок: </dt>
            <dd className="inline">{section.name}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Дата и время: </dt>
            <dd className="inline">
              {formatSubmittedDate(submittedAt)} {formatSubmittedTime(submittedAt)}
            </dd>
          </div>
        </dl>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={createNewReport}
            className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Отправить еще один отчет
          </button>
          <button
            type="button"
            onClick={closePage}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Закрыть страницу
          </button>
        </div>
        {closeHint && (
          <p className="text-sm text-slate-600">
            Отчет успешно отправлен. Теперь можно просто закрыть эту вкладку.
          </p>
        )}
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
          readOnly={!!sessionWorkerName}
          className={sessionWorkerName ? 'bg-slate-50 text-slate-600' : ''}
          required
        />
        {sessionWorkerName && (
          <p className="-mt-3 text-xs text-slate-500">
            Используется текущая сессия: {sessionWorkerName}
          </p>
        )}

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

        {openTasks.length > 0 && (
          <Select
            label="Выберите задачу"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            options={[
              { value: '', label: '— без задачи —' },
              ...openTasks.map((t) => ({
                value: String(t.id),
                label: `${t.workType?.name ?? 'Задача'} · ${t.description || 'без описания'}`,
              })),
            ]}
          />
        )}

        <div>
          <p className="mb-2 block text-sm font-medium text-slate-700">Процент выполнения *</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {completionOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setCompletionPercent(option)
                  setCustomCompletionPercent('')
                }}
                className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                  completionPercent === option
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400'
                }`}
              >
                {option}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCompletionPercent(OTHER_COMPLETION)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                completionPercent === OTHER_COMPLETION
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400'
              }`}
            >
              Другое
            </button>
          </div>
          {completionPercent === OTHER_COMPLETION && (
            <Input
              label="Введите процент выполнения *"
              type="number"
              min={1}
              max={100}
              inputMode="numeric"
              value={customCompletionPercent}
              onChange={(e) => setCustomCompletionPercent(e.target.value)}
              placeholder="Например, 60"
              className="mt-3"
              required
            />
          )}
        </div>

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
