import type { FormSettings } from './types'

const STORAGE_KEY = 'nursery_form_settings'

export const defaultFormSettings: Omit<FormSettings, 'id' | 'created_at' | 'updated_at'> = {
  form_title: 'Отчет о выполненной работе',
  form_description: 'Заполните форму после выполнения работы на участке',
  form_submit_text: 'Отправить',
  form_success_text: 'Отчет успешно отправлен',
  form_hints: 'Отсканируйте QR-код, заполните форму и отправьте отчет о выполненной работе.',
}

export function readFormSettings(): Omit<FormSettings, 'id' | 'created_at' | 'updated_at'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultFormSettings
    return { ...defaultFormSettings, ...JSON.parse(raw) }
  } catch {
    return defaultFormSettings
  }
}

export function saveFormSettings(
  settings: Omit<FormSettings, 'id' | 'created_at' | 'updated_at'>
): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
