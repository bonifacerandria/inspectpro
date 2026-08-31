import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const login = useAuthStore((state) => state.login)
  const chargement = useAuthStore((state) => state.chargement)
  const erreur = useAuthStore((state) => state.erreur)

  // Redirige vers la page initialement demandée si l'utilisateur a été
  // renvoyé ici par RouteProtegee (voir state.from), sinon vers l'accueil.
  const destination = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    const succes = await login(email, motDePasse)
    if (succes) {
      navigate(destination, { replace: true })
    }
  }

  return (
    <div style={styles.conteneur}>
      <form onSubmit={handleSubmit} style={styles.formulaire}>
        <h1 style={styles.titre}>Inspection Équipements de Levage</h1>
        <p style={styles.sousTitre}>Connexion à l'espace d'administration</p>

        <label style={styles.label}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            required
            style={styles.input}
          />
        </label>

        {erreur && <p style={styles.erreur}>{erreur}</p>}

        <button type="submit" disabled={chargement} style={styles.bouton}>
          {chargement ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}

const styles = {
  conteneur: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fafafa',
  },
  formulaire: {
    width: 360,
    padding: '2rem',
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  titre: { fontSize: '1.15rem', margin: 0 },
  sousTitre: { margin: '0 0 0.5rem', color: '#666', fontSize: '0.9rem' },
  label: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' },
  input: { padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc', fontSize: '1rem' },
  bouton: {
    marginTop: '0.5rem',
    padding: '0.6rem',
    borderRadius: 4,
    border: 'none',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  erreur: { color: '#c0392b', fontSize: '0.85rem', margin: 0 },
}
