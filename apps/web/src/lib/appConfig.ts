export function getAppBaseUrl(): string {
  return (
    import.meta.env.VITE_APP_URL?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  )
}

export function getNurseryName(): string {
  return import.meta.env.VITE_NURSERY_NAME || 'Питомник'
}

export function buildWorkFormUrlBySectionCode(sectionCode: string): string {
  return `${getAppBaseUrl()}/work-form/${encodeURIComponent(sectionCode)}`
}

export function buildWorkFormUrl(objectId: number, sectionId: number): string {
  return `${getAppBaseUrl()}/work-form?objectId=${objectId}&sectionId=${sectionId}`
}

export function buildCheckOutUrl(): string {
  return `${getAppBaseUrl()}/attendance/check-out`
}

export function buildMapLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

export function buildQrImageUrl(sectionCode: string): string {
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3001/api'
  const origin = base.replace(/\/api$/, '') || 'http://localhost:3001'
  return `${origin}/api/qr/${encodeURIComponent(sectionCode)}`
}

export function buildCheckOutQrImageUrl(): string {
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3001/api'
  const origin = base.replace(/\/api$/, '') || 'http://localhost:3001'
  return `${origin}/api/qr/checkout`
}
