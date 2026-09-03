import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'
import { theme } from '../styles/theme'

export default function Login() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const login = useAuthStore((state) => state.login)
  const chargement = useAuthStore((state) => state.chargement)
  const erreur = useAuthStore((state) => state.erreur)

  const destination = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    const succes = await login(email, motDePasse)
    if (succes) navigate(destination, { replace: true })
  }

  return (
    <div style={styles.page}>
      {/* Panneau de marque, à gauche */}
      <div style={styles.brandPanel}>
        <div style={styles.brandGlow} />
        <div style={styles.brandContent}>
          <div style={styles.logoMark}>IP</div>
          <h1 style={styles.brandTitle}>InspectPro</h1>
          <p style={styles.brandTagline}>
            Moteur d'inspection configurable pour les équipements de levage —
            du contrôle terrain au rapport final.
          </p>
          <ul style={styles.brandList}>
            <li>✓ Points de contrôle configurables par type d'équipement</li>
            <li>✓ Anomalies et synthèse générées automatiquement</li>
            <li>✓ Rapport PDF conforme, en un clic</li>
          </ul>
        </div>
      </div>

      {/* Formulaire, à droite */}
      <div style={styles.formPanel}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.formTitle}>Connexion</h2>
          <p style={styles.formSubtitle}>Accède à ton espace InspectPro.</p>

          <label style={styles.label}>
            Adresse email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@bmoi.mg"
              required
              autoFocus
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Mot de passe
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </label>

          {erreur && <div style={styles.erreur}>{erreur}</div>}

          <button type="submit" disabled={chargement} style={styles.bouton}>
            {chargement ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.1fr 1fr',
    fontFamily: theme.font.family,
  },
  brandPanel: {
    position: 'relative', overflow: 'hidden',
    background: `linear-gradient(160deg, ${theme.colors.navy900} 0%, ${theme.colors.navy700} 100%)`,
    display: 'flex', alignItems: 'center', padding: '64px',
  },
  brandGlow: {
    position: 'absolute', width: 520, height: 520, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(37,99,235,0.35) 0%, rgba(37,99,235,0) 70%)',
    top: -120, right: -140,
  },
  brandContent: { position: 'relative', maxWidth: 440 },
  logoMark: {
    width: 52, height: 52, borderRadius: theme.radius.md,
    background: theme.colors.accent, color: '#fff', fontWeight: 800, fontSize: '18px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px',
    boxShadow: theme.shadow.navy,
  },
  brandTitle: {
    color: '#fff', fontSize: '34px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em',
  },
  brandTagline: {
    color: theme.colors.textOnDarkMuted, fontSize: '15px', lineHeight: 1.6, marginTop: '16px',
  },
  brandList: {
    listStyle: 'none', padding: 0, marginTop: '32px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  formPanel: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: theme.colors.bgPage, padding: '24px',
  },
  form: {
    width: 380, maxWidth: '100%', background: theme.colors.surface,
    borderRadius: theme.radius.xl, boxShadow: theme.shadow.lg,
    padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: '18px',
  },
  formTitle: { fontSize: '22px', fontWeight: 800, margin: 0, color: theme.colors.textPrimary },
  formSubtitle: { margin: '-10px 0 6px', color: theme.colors.textSecondary, fontSize: '14px' },
  label: { display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '13px', fontWeight: 600, color: theme.colors.textSecondary },
  input: {
    padding: '11px 14px', borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.borderStrong}`, fontSize: '14px', outline: 'none',
  },
  bouton: {
    marginTop: '6px', padding: '12px', borderRadius: theme.radius.md, border: 'none',
    background: theme.colors.accent, color: '#fff', fontSize: '15px', fontWeight: 700,
    cursor: 'pointer', boxShadow: theme.shadow.sm,
  },
  erreur: {
    background: theme.colors.dangerSoft, color: theme.colors.danger,
    padding: '10px 12px', borderRadius: theme.radius.md, fontSize: '13px', fontWeight: 600,
  },
}
