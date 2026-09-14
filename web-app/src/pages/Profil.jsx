import { useState } from 'react'
import apiClient from '../api/client'
import { theme, s } from '../styles/theme'
import { useAuthStore } from '../context/authStore'
import { useAlert } from '../context/ConfirmContext'

const FORM_VIDE = { mot_de_passe_actuel: '', nouveau_mot_de_passe: '', nouveau_mot_de_passe_confirmation: '' }

export default function Profil() {
  const user = useAuthStore((state) => state.user)
  const alerter = useAlert()

  const [formulaire, setFormulaire] = useState(FORM_VIDE)
  const [erreur, setErreur] = useState(null)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur(null)

    if (formulaire.nouveau_mot_de_passe !== formulaire.nouveau_mot_de_passe_confirmation) {
      setErreur('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }

    setEnvoiEnCours(true)
    try {
      await apiClient.patch('/me/mot-de-passe', formulaire)
      setFormulaire(FORM_VIDE)
      await alerter({ titre: 'Mot de passe modifié', message: 'Ton mot de passe a bien été mis à jour.', type: 'succes' })
    } catch (err) {
      const messages = err.response?.data?.errors
      setErreur(messages ? Object.values(messages).flat().join(' ') : err.response?.data?.message || 'Échec de la modification.')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  const initiales = (user?.nom || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ maxWidth: 520 }}>
      {/* Carte d'identité */}
      <div style={{ ...s.card, display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div style={styles.avatar}>{initiales}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px', color: theme.colors.textPrimary }}>{user?.nom}</div>
          <div style={{ fontSize: '13px', color: theme.colors.textSecondary }}>{user?.email}</div>
          <div style={{ fontSize: '12px', color: theme.colors.textMuted, marginTop: '2px' }}>
            {user?.role === 'admin' ? 'Administrateur' : 'Inspecteur'}
          </div>
        </div>
      </div>

      {/* Changement de mot de passe */}
      <div style={s.card}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Changer mon mot de passe</h2>
        <p style={{ fontSize: '13px', color: theme.colors.textSecondary, margin: '0 0 18px' }}>
          Saisis ton mot de passe actuel puis le nouveau, à deux reprises pour confirmation.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={s.label}>
            Mot de passe actuel
            <input
              type="password"
              value={formulaire.mot_de_passe_actuel}
              onChange={(e) => setFormulaire({ ...formulaire, mot_de_passe_actuel: e.target.value })}
              required
              style={s.input}
            />
          </label>

          <label style={s.label}>
            Nouveau mot de passe
            <input
              type="password"
              value={formulaire.nouveau_mot_de_passe}
              onChange={(e) => setFormulaire({ ...formulaire, nouveau_mot_de_passe: e.target.value })}
              required
              minLength={8}
              style={s.input}
            />
          </label>

          <label style={s.label}>
            Confirmer le nouveau mot de passe
            <input
              type="password"
              value={formulaire.nouveau_mot_de_passe_confirmation}
              onChange={(e) => setFormulaire({ ...formulaire, nouveau_mot_de_passe_confirmation: e.target.value })}
              required
              minLength={8}
              style={s.input}
            />
          </label>

          {erreur && (
            <div style={{ background: theme.colors.dangerSoft, color: theme.colors.danger, padding: '10px 12px', borderRadius: theme.radius.md, fontSize: '13px', fontWeight: 600 }}>
              {erreur}
            </div>
          )}

          <button type="submit" disabled={envoiEnCours} style={{ ...s.btnPrimary, alignSelf: 'flex-start' }}>
            {envoiEnCours ? 'Enregistrement…' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  avatar: {
    width: 56, height: 56, borderRadius: '50%', background: theme.colors.navy500,
    color: '#fff', fontSize: '18px', fontWeight: 700, display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
}
