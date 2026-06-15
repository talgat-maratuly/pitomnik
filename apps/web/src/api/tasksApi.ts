import { apiRequest } from './client'

export type TaskStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'REJECTED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type TaskCategory = 'WORK' | 'AGRO'

export type ApiTask = {
  id: number
  sectionId: number
  workTypeId: number | null
  assigneeUserId: number | null
  brigadeId: number | null
  dueDate: string | null
  priority: TaskPriority
  description: string
  status: TaskStatus
  category: TaskCategory
  createdById: number | null
  createdAt: string
  updatedAt: string
  section?: { id: number; name: string; code: string; object?: { name: string } }
  workType?: { id: number; name: string } | null
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  ASSIGNED: 'Назначена',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Выполнена',
  VERIFIED: 'Проверена',
  REJECTED: 'Отклонена',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
}

export type WorkerTask = {
  id: number
  dueDate: string | null
  status: TaskStatus
  priority: TaskPriority
  description: string
  sectionName: string
  sectionCode: string
  objectName: string
  workTypeName: string | null
}

export async function fetchMyTasks(): Promise<WorkerTask[]> {
  return apiRequest<WorkerTask[]>('/tasks/my')
}

export async function fetchMyTask(id: number): Promise<WorkerTask> {
  return apiRequest<WorkerTask>(`/tasks/my/${id}`)
}

export async function fetchTasks(): Promise<ApiTask[]> {
  return apiRequest<ApiTask[]>('/tasks')
}

export async function fetchOpenTasksForSection(sectionId: number): Promise<ApiTask[]> {
  return apiRequest<ApiTask[]>(`/tasks/open?sectionId=${sectionId}`)
}

export async function createTask(payload: {
  sectionId: number
  workTypeId?: number
  assigneeUserId?: number
  brigadeId?: number
  dueDate?: string
  priority?: TaskPriority
  description?: string
  status?: TaskStatus
  category?: TaskCategory
}): Promise<ApiTask> {
  return apiRequest<ApiTask>('/tasks', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateTask(
  id: number,
  payload: Partial<{
    sectionId: number
    workTypeId: number | null
    assigneeUserId: number | null
    brigadeId: number | null
    dueDate: string | null
    priority: TaskPriority
    description: string
    status: TaskStatus
    category: TaskCategory
  }>
): Promise<ApiTask> {
  return apiRequest<ApiTask>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteTask(id: number): Promise<void> {
  await apiRequest(`/tasks/${id}`, { method: 'DELETE' })
}
