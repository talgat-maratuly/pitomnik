import { NavLink, Outlet } from 'react-router-dom'
import { getNurseryName } from '@/lib/appConfig'
import { useAuth } from '@/context/AuthContext'
import { ROLE_LABELS, type UserRole } from '@/lib/auth'

type NavItem = {
  to: string
  end?: boolean
  label: string
  roles?: UserRole[]
}

const nav: NavItem[] = [
  { to: '/admin', end: true, label: 'Главная' },
  { to: '/admin/work-logs', label: 'Журнал работ', roles: ['ADMIN', 'BRIGADIER', 'AGRONOMIST'] },
  { to: '/admin/attendance', label: 'Табель', roles: ['ADMIN', 'BRIGADIER', 'AGRONOMIST'] },
  { to: '/admin/map', label: 'Карта работ', roles: ['ADMIN', 'BRIGADIER', 'AGRONOMIST'] },
  { to: '/admin/tasks', label: 'Задачи', roles: ['ADMIN', 'BRIGADIER', 'AGRONOMIST'] },
  { to: '/admin/objects', label: 'Объекты и участки', roles: ['ADMIN', 'AGRONOMIST'] },
  { to: '/admin/work-types', label: 'Виды работ', roles: ['ADMIN'] },
  { to: '/admin/qr', label: 'QR-коды', roles: ['ADMIN'] },
  { to: '/admin/brigades', label: 'Бригады', roles: ['ADMIN', 'BRIGADIER'] },
  { to: '/admin/users', label: 'Пользователи', roles: ['ADMIN'] },
  { to: '/admin/form-settings', label: 'Настройки формы', roles: ['ADMIN'] },
  { to: '/admin/export', label: 'Экспорт Excel', roles: ['ADMIN'] },
  { to: '/admin/photos', label: 'Фотоотчёты', roles: ['ADMIN', 'BRIGADIER', 'AGRONOMIST'] },
  { to: '/admin/seed', label: 'Seed запуск', roles: ['ADMIN'] },
]

export function AdminLayout() {
  const { user, logout, hasRole } = useAuth()
  const visibleNav = nav.filter((item) => !item.roles || hasRole(...item.roles))

  return (
    <div className="no-print flex min-h-screen flex-col md:flex-row">
      <aside className="no-print border-b border-slate-200 bg-white md:w-56 md:border-b-0 md:border-r">
        <div className="border-b border-slate-100 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Админ-панель</p>
          <p className="font-bold text-emerald-800">{getNurseryName()}</p>
          {user && (
            <p className="mt-2 text-xs text-slate-600">
              {user.fullName}
              <br />
              {ROLE_LABELS[user.role]}
            </p>
          )}
        </div>
        <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col">
          {visibleNav.map((item) => (
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
        <div className="border-t border-slate-100 p-2">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
          >
            Выйти
          </button>
        </div>
      </aside>
      <main className="no-print flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
