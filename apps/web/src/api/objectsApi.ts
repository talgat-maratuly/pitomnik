import { apiRequest } from './client'
import { mapObject, type ApiObject } from './mappers'
import type { NurseryObject } from '@/lib/types'

export async function fetchObjects(): Promise<NurseryObject[]> {
  const data = await apiRequest<ApiObject[]>('/objects')
  return data.map(mapObject)
}

export async function createObject(payload: {
  name: string
  description?: string
}): Promise<NurseryObject> {
  const data = await apiRequest<ApiObject>('/objects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return mapObject(data)
}

export async function updateObject(
  id: number,
  payload: { name?: string; description?: string }
): Promise<NurseryObject> {
  const data = await apiRequest<ApiObject>(`/objects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return mapObject(data)
}

export async function deleteObject(id: number): Promise<void> {
  await apiRequest(`/objects/${id}`, { method: 'DELETE' })
}
