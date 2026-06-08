import { FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { defaultFormSettings, readFormSettings, saveFormSettings } from '@/lib/formSettings'

export function FormSettingsPage() {
  const [formTitle, setFormTitle] = useState(defaultFormSettings.form_title)
  const [formDescription, setFormDescription] = useState(defaultFormSettings.form_description ?? '')
  const [formSubmitText, setFormSubmitText] = useState(defaultFormSettings.form_submit_text)
  const [formSuccessText, setFormSuccessText] = useState(defaultFormSettings.form_success_text)
  const [formHints, setFormHints] = useState(defaultFormSettings.form_hints ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const s = readFormSettings()
    setFormTitle(s.form_title)
    setFormDescription(s.form_description ?? '')
    setFormSubmitText(s.form_submit_text)
    setFormSuccessText(s.form_success_text)
    setFormHints(s.form_hints ?? '')
  }, [])

  function handleSave(e: FormEvent) {
    e.preventDefault()
    saveFormSettings({
      form_title: formTitle.trim(),
      form_description: formDescription.trim() || null,
      form_submit_text: formSubmitText.trim(),
      form_success_text: formSuccessText.trim(),
      form_hints: formHints.trim() || null,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Настройки формы</h1>
      <p className="text-sm text-slate-600">
        Тексты формы рабочего сохраняются в браузере (localStorage). Остальные данные — на сервере.
      </p>

      <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Input label="Заголовок формы" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
        <Textarea label="Описание формы" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
        <Input label="Текст кнопки отправки" value={formSubmitText} onChange={(e) => setFormSubmitText(e.target.value)} required />
        <Input label="Текст после успешной отправки" value={formSuccessText} onChange={(e) => setFormSuccessText(e.target.value)} required />
        <Textarea label="Подсказки для рабочих" value={formHints} onChange={(e) => setFormHints(e.target.value)} />
        {saved && <p className="text-sm text-emerald-700">Сохранено</p>}
        <Button type="submit">Сохранить</Button>
      </form>
    </div>
  )
}
