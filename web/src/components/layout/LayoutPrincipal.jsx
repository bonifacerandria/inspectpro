import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../context/authStore'

const MENU = [
  { to: '/', label: 'Tableau de bord', fin: true },
  { to: '/inspections', label: 'Inspections' },
  { to: '/rapports', label: 'Rapports' },
  { to: '/clients', label: 'Clients' },
  { to: '/equipements', label: 'Équipements' },
  { to: '/types-equipement', label: "Types d'équipement" },
  { to: '/statistiques', label: 'Statistiques' },
]

export default function LayoutPrincipal() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 240, borderRight: '1px solid #e2e2e2', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', fontWeight: 600 }}>
          Inspection Levage
        </div>
        <nav style={{ flex: 1 }}>
          {MENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.fin}
              style={({ isActive }) => ({
                display: 'block',
                padding: '0.6rem 1rem',
                textDecoration: 'none',
                background: isActive ? '#f0f0f0' : 'transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid #e2e2e2', fontSize: '0.85rem' }}>
          <div style={{ marginBottom: '0.5rem', color: '#666' }}>
            {user?.nom} {user?.role ? `(${user.role})` : ''}
          </div>
          <button onClick={handleLogout} style={{ cursor: 'pointer' }}>
            Se déconnecter
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '1.5rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
