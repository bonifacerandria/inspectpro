import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRessourceCrud } from '../hooks/useRessourceCrud'
import Modal from '../components/ui/Modal'

const CLIENT_VIDE = {
  nom: '', adresse: '', contact: '', telephone: '', email: '', reference_client: '',
}

export default function Clients() {
  const { items: clients, chargement, erreur, creer, modifier, supprimer } =
    useRessourceCrud('/clients')

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [clientEnEdition, setClientEnEdition] = useState(null) // null = création
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
      nom: client.nom || '',
      adresse: client.adresse || '',
      contact: client.contact || '',
      telephone: client.telephone || '',
      email: client.email || '',
      reference_client: client.reference_client || '',
    })
    setErreurFormulaire(null)
    setModaleOuverte(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreurFormulaire(null)
    try {
      if (clientEnEdition) {
        await modifier(clientEnEdition.id, formulaire)
      } else {
        await creer(formulaire)
      }
      setModaleOuverte(false)
    } catch (err) {
      const messages = err.response?.data?.errors
      setErreurFormulaire(
        messages ? Object.values(messages).flat().join(' ') : "Échec de l'enregistrement."
      )
    } finally {
      setEnvoiEnCours(false)
    }
  }

  async function handleSupprimer(client) {
    if (!confirm(`Supprimer le client "${client.nom}" ?`)) return
    try {
      await supprimer(client.id)
    } catch (err) {
      alert(err.response?.data?.message || 'Suppression impossible.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Clients</h1>
        <button onClick={ouvrirCreation} style={styles.boutonPrincipal}>
          + Nouveau client
        </button>
      </div>

      {chargement && <p>Chargement…</p>}
      {erreur && <p style={{ color: '#c0392b' }}>{erreur}</p>}

      {!chargement && clients.length === 0 && <p>Aucun client pour l'instant.</p>}

      {clients.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nom</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Téléphone</th>
              <th style={styles.th}>Sites</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td style={styles.td}>{client.nom}</td>
                <td style={styles.td}>{client.contact || '—'}</td>
                <td style={styles.td}>{client.telephone || '—'}</td>
                <td style={styles.td}>
                  <Link to={`/clients/${client.id}/sites`}>
                    {client.sites_count ?? 0} site(s)
                  </Link>
                </td>
                <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button onClick={() => ouvrirEdition(client)} style={styles.boutonLien}>
                    Modifier
                  </button>
                  <button onClick={() => handleSupprimer(client)} style={{ ...styles.boutonLien, color: '#c0392b' }}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modaleOuverte && (
        <Modal
          titre={clientEnEdition ? 'Modifier le client' : 'Nouveau client'}
          onFermer={() => setModaleOuverte(false)}
        >
          <form onSubmit={handleSubmit} style={styles.formulaire}>
            <Champ label="Nom" value={formulaire.nom}
              onChange={(v) => setFormulaire({ ...formulaire, nom: v })} requis />
            <Champ label="Adresse" value={formulaire.adresse}
              onChange={(v) => setFormulaire({ ...formulaire, adresse: v })} />
            <Champ label="Contact" value={formulaire.contact}
              onChange={(v) => setFormulaire({ ...formulaire, contact: v })} />
            <Champ label="Téléphone" value={formulaire.telephone}
              onChange={(v) => setFormulaire({ ...formulaire, telephone: v })} />
            <Champ label="Email" type="email" value={formulaire.email}
              onChange={(v) => setFormulaire({ ...formulaire, email: v })} />
            <Champ label="Référence client" value={formulaire.reference_client}
              onChange={(v) => setFormulaire({ ...formulaire, reference_client: v })} />

            {erreurFormulaire && <p style={{ color: '#c0392b', fontSize: '0.85rem' }}>{erreurFormulaire}</p>}

            <button type="submit" disabled={envoiEnCours} style={styles.boutonPrincipal}>
              {envoiEnCours ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Champ({ label, value, onChange, type = 'text', requis = false }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={requis}
        style={{ padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
      />
    </label>
  )
}

const styles = {
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', borderBottom: '2px solid #e2e2e2', padding: '0.5rem', fontSize: '0.85rem', color: '#666' },
  td: { borderBottom: '1px solid #eee', padding: '0.5rem' },
  boutonPrincipal: {
    padding: '0.5rem 1rem', borderRadius: 4, border: 'none',
    background: '#1a1a1a', color: '#fff', cursor: 'pointer',
  },
  boutonLien: {
    border: 'none', background: 'none', cursor: 'pointer',
    textDecoration: 'underline', marginLeft: '0.75rem', fontSize: '0.85rem',
  },
  formulaire: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
}
