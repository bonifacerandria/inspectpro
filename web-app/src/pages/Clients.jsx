import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRessourceCrud } from '../hooks/useRessourceCrud'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { theme, s } from '../styles/theme'
import { useConfirm } from '../context/ConfirmContext'

const CLIENT_VIDE = {
  nom: '', adresse: '', contact: '', telephone: '', email: '', reference_client: '',
}

export default function Clients() {
  const confirmer = useConfirm()
  const { items: clients, chargement, erreur, creer, modifier, supprimer } = useRessourceCrud('/clients')

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [clientEnEdition, setClientEnEdition] = useState(null)
  const [formulaire, setFormulaire] = useState(CLIENT_VIDE)
  const [erreurFormulaire, setErreurFormulaire] = useState(null)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  function ouvrirCreation() {
    setClientEnEdition(null)
    setFormulaire(CLIENT_VIDE)
    setErreurFormulaire(null)
    setModaleOuverte(true)
  }

  function ouvrirEdition(client) {
    setClientEnEdition(client)
    setFormulaire({
      nom: client.nom || '', adresse: client.adresse || '', contact: client.contact || '',
      telephone: client.telephone || '', email: client.email || '', reference_client: client.reference_client || '',
    })
    setErreurFormulaire(null)
    setModaleOuverte(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreurFormulaire(null)
    try {
      if (clientEnEdition) await modifier(clientEnEdition.id, formulaire)
      else await creer(formulaire)
      setModaleOuverte(false)
    } catch (err) {
      const messages = err.response?.data?.errors
      setErreurFormulaire(messages ? Object.values(messages).flat().join(' ') : "Échec de l'enregistrement.")
    } finally {
      setEnvoiEnCours(false)
    }
  }

  async function handleSupprimer(client) {
    const ok = await confirmer({
      titre: 'Supprimer ce client ?',
      message: `"${client.nom}" sera définitivement supprimé. Cette action est irréversible.`,
      libelleConfirmer: 'Supprimer',
    })
    if (!ok) return
    try {
      await supprimer(client.id)
    } catch (err) {
      alert(err.response?.data?.message || 'Suppression impossible.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <p style={s.pageSubtitle}>{clients.length} client(s)</p>
        <button onClick={ouvrirCreation} style={s.btnPrimary}>+ Nouveau client</button>
      </div>

      <div style={s.card}>
        {chargement ? (
          <p>Chargement…</p>
        ) : erreur ? (
          <p style={{ color: theme.colors.danger }}>{erreur}</p>
        ) : clients.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="Aucun client"
            description="Ajoute ton premier client pour commencer à créer des sites et des équipements."
            action={<button onClick={ouvrirCreation} style={s.btnPrimary}>+ Nouveau client</button>}
          />
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Nom</th>
                <th style={s.th}>Contact</th>
                <th style={s.th}>Téléphone</th>
                <th style={s.th}>Sites</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{client.nom}</td>
                  <td style={s.td}>{client.contact || '—'}</td>
                  <td style={s.td}>{client.telephone || '—'}</td>
                  <td style={s.td}>
                    <Link to={`/clients/${client.id}/sites`} style={{ color: theme.colors.accent, fontWeight: 600 }}>
                      {client.sites_count ?? 0} site(s)
                    </Link>
                  </td>
                  <td style={{ ...s.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => ouvrirEdition(client)} style={s.btnGhost}>Modifier</button>
                    <button onClick={() => handleSupprimer(client)} style={s.btnDanger}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modaleOuverte && (
        <Modal titre={clientEnEdition ? 'Modifier le client' : 'Nouveau client'} onFermer={() => setModaleOuverte(false)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Champ label="Nom" value={formulaire.nom} onChange={(v) => setFormulaire({ ...formulaire, nom: v })} requis />
            <Champ label="Adresse" value={formulaire.adresse} onChange={(v) => setFormulaire({ ...formulaire, adresse: v })} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <Champ label="Contact" value={formulaire.contact} onChange={(v) => setFormulaire({ ...formulaire, contact: v })} />
              <Champ label="Téléphone" value={formulaire.telephone} onChange={(v) => setFormulaire({ ...formulaire, telephone: v })} />
            </div>
            <Champ label="Email" type="email" value={formulaire.email} onChange={(v) => setFormulaire({ ...formulaire, email: v })} />
            <Champ label="Référence client" value={formulaire.reference_client} onChange={(v) => setFormulaire({ ...formulaire, reference_client: v })} />

            {erreurFormulaire && <div style={styles.erreur}>{erreurFormulaire}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
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

function Champ({ label, value, onChange, type = 'text', requis = false }) {
  return (
    <label style={{ ...s.label, flex: 1 }}>
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={requis} style={s.input} />
    </label>
  )
}

const styles = {
  erreur: {
    background: theme.colors.dangerSoft, color: theme.colors.danger,
    padding: '10px 12px', borderRadius: theme.radius.md, fontSize: '13px', fontWeight: 600,
  },
}
