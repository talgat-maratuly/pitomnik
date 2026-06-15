import { useEffect, useState } from 'react'
import {
  fetchMyTask,
  fetchMyTasks,
  PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type WorkerTask,
} from '@/api/tasksApi'

export function WorkerTasksPage() {
  const [tasks, setTasks] = useState<WorkerTask[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<WorkerTask | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchMyTasks()
      .then(setTasks)
      .catch((err) => {
        console.error('[worker/tasks]', err)
        setError('Не удалось загрузить задачи')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null)
      return
    }
    void fetchMyTask(selectedId)
      .then(setDetail)
      .catch((err) => {
        console.error('[worker/task]', err)
        setError('Не удалось загрузить задачу')
      })
  }, [selectedId])

  if (loading) {
    return <p className="text-center text-slate-500">Загрузка…</p>
  }

  if (detail && selectedId != null) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="text-sm text-emerald-700 underline"
        >
          ← К списку задач
        </button>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold">{detail.sectionName}</h1>
          <p className="text-sm text-slate-500">{detail.objectName}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Дата</dt>
              <dd className="font-medium">{detail.dueDate ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Вид работы</dt>
              <dd className="font-medium">{detail.workTypeName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Статус</dt>
              <dd className="font-medium">{TASK_STATUS_LABELS[detail.status]}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Приоритет</dt>
              <dd className="font-medium">{PRIORITY_LABELS[detail.priority]}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Описание</dt>
              <dd>{detail.description || '—'}</dd>
            </div>
          </dl>
        </article>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Здесь только ваши назначенные задачи. Отчёт о выполненной работе отправляйте через QR-код на участке.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
          Назначенных задач пока нет
        </p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelectedId(t.id)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{t.sectionName}</p>
                    <p className="text-sm text-slate-500">{t.workTypeName ?? 'Без вида работы'}</p>
                  </div>
                  <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {TASK_STATUS_LABELS[t.status]}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {t.dueDate ? `Срок: ${t.dueDate}` : 'Без срока'} · {PRIORITY_LABELS[t.priority]}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
