import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../context/authStore'
import { theme } from '../../styles/theme'

const MENU = [
  { to: '/', label: 'Tableau de bord', icon: '🏠', fin: true },
  { to: '/inspections', label: 'Inspections', icon: '🔍' },
  { to: '/rapports', label: 'Rapports', icon: '📄' },
  { to: '/clients', label: 'Clients', icon: '🏢' },
  { to: '/equipements', label: 'Équipements', icon: '⚙️' },
  { to: '/types-equipement', label: "Types d'équipement", icon: '🧩' },
  { to: '/statistiques', label: 'Statistiques', icon: '📊' },
]

const SOUS_MENU_PARAMETRES = [
  { to: '/parametres/sites', label: 'Gestion des sites' },
  { to: '/parametres/utilisateurs', label: 'Gestion des utilisateurs' },
]

const TITRES = {
  '/': 'Tableau de bord',
  '/inspections': 'Inspections',
  '/rapports': 'Rapports',
  '/clients': 'Clients',
  '/equipements': 'Équipements',
  '/types-equipement': "Types d'équipement",
  '/statistiques': 'Statistiques',
  '/parametres/sites': 'Gestion des sites',
  '/parametres/utilisateurs': 'Gestion des utilisateurs',
}

export default function LayoutPrincipal() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()

  const [parametresOuvert, setParametresOuvert] = useState(location.pathname.startsWith('/parametres'))

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const titre = TITRES[location.pathname] || 'InspectPro'
  const initiales = (user?.nom || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const dansParametres = location.pathname.startsWith('/parametres')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.colors.bgPage }}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.logoMark}>IP</div>
          <span style={styles.brandText}>InspectPro</span>
        </div>

        <nav style={styles.nav}>
          {MENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.fin}
              style={({ isActive }) => ({
                ...styles.navItem,
                background: isActive ? 'rgba(37,99,235,0.18)' : 'transparent',
                color: isActive ? '#fff' : theme.colors.textOnDarkMuted,
                borderLeft: isActive ? `3px solid ${theme.colors.accent}` : '3px solid transparent',
              })}
            >
              <span style={{ fontSize: '16px', width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {/* Paramètres — menu déroulant */}
          <button
            onClick={() => setParametresOuvert((v) => !v)}
            style={{
              ...styles.navItem, width: '100%', border: 'none', cursor: 'pointer',
              background: dansParametres ? 'rgba(37,99,235,0.18)' : 'transparent',
              color: dansParametres ? '#fff' : theme.colors.textOnDarkMuted,
              borderLeft: dansParametres ? `3px solid ${theme.colors.accent}` : '3px solid transparent',
            }}
          >
            <span style={{ fontSize: '16px', width: 20, textAlign: 'center' }}>⚙️</span>
            <span style={{ flex: 1, textAlign: 'left' }}>Paramètres</span>
            <span style={{ fontSize: '11px', transform: parametresOuvert ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
          </button>

          {parametresOuvert && (
            <div style={styles.sousMenu}>
              {SOUS_MENU_PARAMETRES.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    ...styles.sousMenuItem,
                    color: isActive ? '#fff' : theme.colors.textOnDarkMuted,
                    fontWeight: isActive ? 700 : 500,
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div style={styles.userBox}>
          <div style={styles.avatar}>{initiales}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.userName}>{user?.nom}</div>
            <div style={styles.userRole}>{user?.role === 'admin' ? 'Administrateur' : 'Inspecteur'}</div>
          </div>
          <button onClick={handleLogout} title="Se déconnecter" style={styles.logoutBtn}>⏻</button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={styles.topbar}>
          <h1 style={styles.topbarTitle}>{titre}</h1>
        </header>
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const styles = {
  sidebar: {
    width: 248, flexShrink: 0, background: `linear-gradient(180deg, ${theme.colors.navy900}, ${theme.colors.navy800})`,
    display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', padding: '22px 20px 18px' },
  logoMark: {
    width: 32, height: 32, borderRadius: theme.radius.sm, background: theme.colors.accent,
    color: '#fff', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  brandText: { color: '#fff', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 12px', overflowY: 'auto' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
    borderRadius: theme.radius.md, fontSize: '14px', fontWeight: 600, transition: 'all 0.15s ease',
  },
  sousMenu: { display: 'flex', flexDirection: 'column', paddingLeft: '32px', gap: '2px', marginBottom: '4px' },
  sousMenuItem: { padding: '8px 12px', fontSize: '13px', borderRadius: theme.radius.sm },
  userBox: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', background: theme.colors.navy500,
    color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  userName: { color: '#fff', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { color: theme.colors.textOnDarkMuted, fontSize: '11px' },
  logoutBtn: { border: 'none', background: 'transparent', color: theme.colors.textOnDarkMuted, cursor: 'pointer', fontSize: '16px', padding: '4px' },
  topbar: {
    height: 64, flexShrink: 0, background: theme.colors.surface, borderBottom: `1px solid ${theme.colors.border}`,
    display: 'flex', alignItems: 'center', padding: '0 32px', position: 'sticky', top: 0, zIndex: 10,
  },
  topbarTitle: { fontSize: '17px', fontWeight: 700, color: theme.colors.textPrimary, margin: 0 },
  content: { flex: 1, padding: '28px 32px' },
}
