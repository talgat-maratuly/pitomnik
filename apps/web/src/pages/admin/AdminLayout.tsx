import { NavLink, Outlet } from 'react-router-dom'
import { getNurseryName } from '@/lib/appConfig'

const nav = [
  { to: '/admin', end: true, label: 'Главная' },
  { to: '/admin/work-logs', label: 'Журнал работ' },
  { to: '/admin/map', label: 'Карта работ' },
  { to: '/admin/objects', label: 'Объекты и участки' },
  { to: '/admin/work-types', label: 'Виды работ' },
  { to: '/admin/qr', label: 'QR-коды' },
  { to: '/admin/form-settings', label: 'Настройки формы' },
  { to: '/admin/export', label: 'Экспорт Excel' },
  { to: '/admin/photos', label: 'Фотоотчёты' },
  { to: '/admin/seed', label: 'Seed запуск' },
]

export function AdminLayout() {
  return (
    <div className="no-print flex min-h-screen flex-col md:flex-row">
      <aside className="no-print border-b border-slate-200 bg-white md:w-56 md:border-b-0 md:border-r">
        <div className="border-b border-slate-100 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Админ-панель</p>
          <p className="font-bold text-emerald-800">{getNurseryName()}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="no-print flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
