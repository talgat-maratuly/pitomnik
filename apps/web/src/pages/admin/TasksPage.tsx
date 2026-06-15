import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  createTask,
  deleteTask,
  fetchTasks,
  TASK_STATUS_LABELS,
  type ApiTask,
  type TaskCategory,
  type TaskPriority,
} from '@/api/tasksApi'
import { fetchObjectsWithSections, type NurseryObjectWithSections } from '@/api/objectsApi'
import { fetchAllWorkTypes } from '@/api/workTypesApi'
import { fetchBrigades } from '@/api/brigadesApi'
import { toUserMessage } from '@/api/client'
import { useAuth } from '@/context/AuthContext'

export function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [objects, setObjects] = useState<NurseryObjectWithSections[]>([])
  const [workTypes, setWorkTypes] = useState<{ id: number; name: string }[]>([])
  const [brigades, setBrigades] = useState<{ id: number; name: string }[]>([])
  const [objectId, setObjectId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [workTypeId, setWorkTypeId] = useState('')
  const [brigadeId, setBrigadeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TaskCategory>(user?.role === 'AGRONOMIST' ? 'AGRO' : 'WORK')
  const [error, setError] = useState<string | null>(null)

  const selectedObject = useMemo(
    () => objects.find((o) => o.id === Number(objectId)),
    [objects, objectId],
  )

  const objectSections = useMemo(
    () => selectedObject?.sections ?? [],
    [selectedObject],
  )

  async function reload() {
    const [t, o, w, b] = await Promise.all([
      fetchTasks(),
      fetchObjectsWithSections(),
      fetchAllWorkTypes(),
      fetchBrigades(),
    ])
    setTasks(t)
    setObjects(o)
    setWorkTypes(w.map((x) => ({ id: x.id, name: x.name })))
    setBrigades(b.map((x) => ({ id: x.id, name: x.name })))
  }

  useEffect(() => {
    void reload().catch((err) => setError(toUserMessage(err)))
  }, [])

  function handleObjectChange(nextObjectId: string) {
    setObjectId(nextObjectId)
    setSectionId('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!objectId || !sectionId) return
    try {
      await createTask({
        sectionId: Number(sectionId),
        workTypeId: workTypeId ? Number(workTypeId) : undefined,
        brigadeId: brigadeId ? Number(brigadeId) : undefined,
        dueDate: dueDate || undefined,
        priority,
        description: description.trim(),
        category,
      })
      setDescription('')
      setSectionId('')
      await reload()
    } catch (err) {
      console.error('[tasks]', err)
      setError(toUserMessage(err))
    }
  }

  const canCreateTask = Boolean(objectId && sectionId)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Задачи</h1>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Объект *</label>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={objectId}
            onChange={(e) => handleObjectChange(e.target.value)}
            required
          >
            <option value="">— выберите объект —</option>
            {objects.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          {objects.length === 0 && (
            <p className="mt-2 text-sm text-amber-700">
              Объекты ещё не созданы. Администратор должен добавить их в разделе «Объекты и участки».
            </p>
          )}
        </div>

        {selectedObject && (
          <div className="sm:col-span-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Описание объекта</p>
            <p className="mt-1 text-sm text-slate-700">
              {selectedObject.description?.trim() || 'Описание не указано'}
            </p>
            {objectSections.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Участков: {objectSections.length}
              </p>
            )}
          </div>
        )}

        {selectedObject && (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Участок *</label>
            {objectSections.length > 0 ? (
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                required
              >
                <option value="">— выберите участок —</option>
                {objectSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                У этого объекта нет участков. Создайте участок в разделе «Объекты и участки».
              </p>
            )}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Вид работы</label>
          <select className="w-full rounded-lg border px-3 py-2" value={workTypeId} onChange={(e) => setWorkTypeId(e.target.value)}>
            <option value="">— вид работы —</option>
            {workTypes.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Бригада</label>
          <select className="w-full rounded-lg border px-3 py-2" value={brigadeId} onChange={(e) => setBrigadeId(e.target.value)}>
            <option value="">— бригада —</option>
            {brigades.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Срок</label>
          <input type="date" className="w-full rounded-lg border px-3 py-2" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Приоритет</label>
          <select className="w-full rounded-lg border px-3 py-2" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            <option value="LOW">Низкий</option>
            <option value="MEDIUM">Средний</option>
            <option value="HIGH">Высокий</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Тип задачи</label>
          <select className="w-full rounded-lg border px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>
            <option value="WORK">Рабочая</option>
            <option value="AGRO">Агро</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Описание</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Описание задачи"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={!canCreateTask}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
        >
          Создать задачу
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Объект</th>
              <th className="px-3 py-2 text-left">Участок</th>
              <th className="px-3 py-2 text-left">Вид работы</th>
              <th className="px-3 py-2 text-left">Срок</th>
              <th className="px-3 py-2 text-left">Статус</th>
              <th className="px-3 py-2 text-left">Тип</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((t) => (
              <tr key={t.id}>
                <td className="px-3 py-2">{t.section?.object?.name ?? '—'}</td>
                <td className="px-3 py-2">{t.section?.name ?? t.sectionId}</td>
                <td className="px-3 py-2">{t.workType?.name ?? '—'}</td>
                <td className="px-3 py-2">{t.dueDate ?? '—'}</td>
                <td className="px-3 py-2">{TASK_STATUS_LABELS[t.status]}</td>
                <td className="px-3 py-2">{t.category === 'AGRO' ? 'Агро' : 'Рабочая'}</td>
                <td className="px-3 py-2">
                  <button type="button" className="text-xs text-red-600" onClick={() => void deleteTask(t.id).then(reload)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
