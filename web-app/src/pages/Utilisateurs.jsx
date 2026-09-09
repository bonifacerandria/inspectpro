import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import DataTable from '../components/ui/DataTable'
import { theme, s } from '../styles/theme'
import { useAuthStore } from '../context/authStore'
import { useConfirm, useAlert } from '../context/ConfirmContext'

const USER_VIDE = { nom: '', email: '', password: '', role: 'inspecteur', telephone: '', actif: true }

export default function Utilisateurs() {
  const confirmer = useConfirm()
  const alerter = useAlert()
  const moi = useAuthStore((state) => state.user)
  const [users, setUsers] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [userEnEdition, setUserEnEdition] = useState(null)
  const [formulaire, setFormulaire] = useState(USER_VIDE)
  const [erreurFormulaire, setErreurFormulaire] = useState(null)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  async function charger() {
    setChargement(true)
    setErreur(null)
    try {
      const { data } = await apiClient.get('/users')
      setUsers(data)
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de chargement.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  function ouvrirCreation() {
    setUserEnEdition(null)
    setFormulaire(USER_VIDE)
    setErreurFormulaire(null)
    setModaleOuverte(true)
  }

  function ouvrirEdition(user) {
    setUserEnEdition(user)
    setFormulaire({ nom: user.nom, email: user.email, password: '', role: user.role, telephone: user.telephone || '', actif: user.actif })
    setErreurFormulaire(null)
    setModaleOuverte(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreurFormulaire(null)
    try {
      const payload = { ...formulaire }
      if (userEnEdition && !payload.password) delete payload.password // ne pas écraser si vide en édition
      if (userEnEdition) await apiClient.put(`/users/${userEnEdition.id}`, payload)
      else await apiClient.post('/users', payload)
      setModaleOuverte(false)
      await charger()
    } catch (err) {
      const messages = err.response?.data?.errors
      setErreurFormulaire(messages ? Object.values(messages).flat().join(' ') : "Échec de l'enregistrement.")
    } finally {
      setEnvoiEnCours(false)
    }
  }

  async function handleSupprimer(user) {
    const ok = await confirmer({
      titre: 'Supprimer ce compte ?',
      message: `Le compte de "${user.nom}" sera définitivement supprimé.`,
      libelleConfirmer: 'Supprimer',
    })
    if (!ok) return
    try {
      await apiClient.delete(`/users/${user.id}`)
      await charger()
    } catch (err) {
      await alerter({ message: err.response?.data?.message || 'Suppression impossible.' })
    }
  }

  if (moi && moi.role !== 'admin') {
    return <p style={{ color: theme.colors.danger }}>Accès réservé aux administrateurs.</p>
  }

  if (chargement) return <p>Chargement…</p>
  if (erreur) return <p style={{ color: theme.colors.danger }}>{erreur}</p>

  const colonnesUsers = [
    { key: 'nom', label: 'Nom', render: (u) => <span style={{ fontWeight: 600 }}>{u.nom}</span> },
    { key: 'email', label: 'Email' },
    {
      key: 'role', label: 'Rôle', filterType: 'select',
      filterOptions: [{ value: 'admin', label: 'Administrateur' }, { value: 'inspecteur', label: 'Inspecteur' }],
      render: (u) => <Badge variant={u.role === 'admin' ? 'accent' : 'neutral'}>{u.role === 'admin' ? 'Administrateur' : 'Inspecteur'}</Badge>,
    },
    {
      key: 'actif', label: 'Statut', filterType: 'select',
      accessor: (u) => (u.actif ? '1' : '0'),
      filterOptions: [{ value: '1', label: 'Actif' }, { value: '0', label: 'Désactivé' }],
      render: (u) => <Badge variant={u.actif ? 'success' : 'neutral'}>{u.actif ? 'Actif' : 'Désactivé'}</Badge>,
    },
    {
      key: 'actions', label: '', sortable: false, filterable: false, align: 'right',
      render: (u) => (
        <span onClick={(e) => e.stopPropagation()}>
          <button onClick={() => ouvrirEdition(u)} style={s.btnGhost}>Modifier</button>
          {u.id !== moi?.id && <button onClick={() => handleSupprimer(u)} style={s.btnDanger}>Supprimer</button>}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
        <button onClick={ouvrirCreation} style={s.btnPrimary}>+ Nouvel utilisateur</button>
      </div>

      <div style={s.card}>
        <DataTable columns={colonnesUsers} rows={users} texteVide="Aucun utilisateur." />
      </div>

      {modaleOuverte && (
        <Modal titre={userEnEdition ? "Modifier l'utilisateur" : 'Nouvel utilisateur'} onFermer={() => setModaleOuverte(false)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={s.label}>
              Nom complet
              <input value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })} required style={s.input} />
            </label>
            <label style={s.label}>
              Email
              <input type="email" value={formulaire.email} onChange={(e) => setFormulaire({ ...formulaire, email: e.target.value })} required style={s.input} />
            </label>
            <label style={s.label}>
              {userEnEdition ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
              <input
                type="password" value={formulaire.password}
                onChange={(e) => setFormulaire({ ...formulaire, password: e.target.value })}
                required={!userEnEdition} minLength={8} style={s.input}
              />
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ ...s.label, flex: 1 }}>
                Rôle
                <select value={formulaire.role} onChange={(e) => setFormulaire({ ...formulaire, role: e.target.value })} style={s.input}>
                  <option value="inspecteur">Inspecteur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </label>
              <label style={{ ...s.label, flex: 1 }}>
                Téléphone
                <input value={formulaire.telephone} onChange={(e) => setFormulaire({ ...formulaire, telephone: e.target.value })} style={s.input} />
              </label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: theme.colors.textSecondary }}>
              <input type="checkbox" checked={formulaire.actif} onChange={(e) => setFormulaire({ ...formulaire, actif: e.target.checked })} />
              Compte actif (peut se connecter)
            </label>

            {erreurFormulaire && (
              <div style={{ background: theme.colors.dangerSoft, color: theme.colors.danger, padding: '10px 12px', borderRadius: theme.radius.md, fontSize: '13px', fontWeight: 600 }}>
                {erreurFormulaire}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setModaleOuverte(false)} style={s.btnSecondary}>Annuler</button>
              <button type="submit" disabled={envoiEnCours} style={s.btnPrimary}>
                {envoiEnCours ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
