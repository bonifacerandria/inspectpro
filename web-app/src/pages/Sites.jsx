import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { theme, s } from '../styles/theme'
import { useConfirm } from '../context/ConfirmContext'

const SITE_VIDE = { client_id: '', nom: '', adresse: '' }

export default function Sites() {
  const confirmer = useConfirm()
  const [sites, setSites] = useState([])
  const [clients, setClients] = useState([])
  const [filtreClientId, setFiltreClientId] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [siteEnEdition, setSiteEnEdition] = useState(null)
  const [formulaire, setFormulaire] = useState(SITE_VIDE)
  const [erreurFormulaire, setErreurFormulaire] = useState(null)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  async function charger() {
    setChargement(true)
    setErreur(null)
    try {
      const [{ data: st }, { data: cl }] = await Promise.all([
        apiClient.get('/sites'),
        apiClient.get('/clients', { params: { per_page: 200 } }),
      ])
      setSites(st)
      setClients(cl.data ?? cl)
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de chargement.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  function ouvrirCreation() {
    setSiteEnEdition(null)
    setFormulaire({ ...SITE_VIDE, client_id: filtreClientId || '' })
    setErreurFormulaire(null)
    setModaleOuverte(true)
  }

  function ouvrirEdition(site) {
    setSiteEnEdition(site)
    setFormulaire({ client_id: site.client_id, nom: site.nom, adresse: site.adresse || '' })
    setErreurFormulaire(null)
    setModaleOuverte(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreurFormulaire(null)
    try {
      const payload = { ...formulaire, client_id: Number(formulaire.client_id) }
      if (siteEnEdition) await apiClient.put(`/sites/${siteEnEdition.id}`, payload)
      else await apiClient.post('/sites', payload)
      setModaleOuverte(false)
      await charger()
    } catch (err) {
      const messages = err.response?.data?.errors
      setErreurFormulaire(messages ? Object.values(messages).flat().join(' ') : "Échec de l'enregistrement.")
    } finally {
      setEnvoiEnCours(false)
    }
  }

  async function handleSupprimer(site) {
    const ok = await confirmer({
      titre: 'Supprimer ce site ?',
      message: `"${site.nom}" sera définitivement supprimé. Cette action est irréversible.`,
      libelleConfirmer: 'Supprimer',
    })
    if (!ok) return
    try {
      await apiClient.delete(`/sites/${site.id}`)
      await charger()
    } catch (err) {
      alert(err.response?.data?.message || 'Suppression impossible.')
    }
  }

  const sitesAffiches = filtreClientId ? sites.filter((s) => String(s.client_id) === String(filtreClientId)) : sites

  if (chargement) return <p>Chargement…</p>
  if (erreur) return <p style={{ color: theme.colors.danger }}>{erreur}</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '12px' }}>
        <select value={filtreClientId} onChange={(e) => setFiltreClientId(e.target.value)} style={{ ...s.input, width: 260 }}>
          <option value="">Tous les clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <button onClick={ouvrirCreation} style={s.btnPrimary}>+ Nouveau site</button>
      </div>

      <div style={s.card}>
        {sitesAffiches.length === 0 ? (
          <EmptyState
            icon="📍"
            title="Aucun site"
            description="Un équipement doit être rattaché à un site. Crée ton premier site pour pouvoir ensuite ajouter des équipements."
            action={<button onClick={ouvrirCreation} style={s.btnPrimary}>+ Nouveau site</button>}
          />
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Nom du site</th>
                <th style={s.th}>Client</th>
                <th style={s.th}>Adresse</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {sitesAffiches.map((site) => (
                <tr key={site.id}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{site.nom}</td>
                  <td style={s.td}>{site.client?.nom}</td>
                  <td style={s.td}>{site.adresse || '—'}</td>
                  <td style={{ ...s.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => ouvrirEdition(site)} style={s.btnGhost}>Modifier</button>
                    <button onClick={() => handleSupprimer(site)} style={s.btnDanger}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modaleOuverte && (
        <Modal titre={siteEnEdition ? 'Modifier le site' : 'Nouveau site'} onFermer={() => setModaleOuverte(false)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={s.label}>
              Client
              <select value={formulaire.client_id} onChange={(e) => setFormulaire({ ...formulaire, client_id: e.target.value })} required style={s.input}>
                <option value="">— Choisir un client —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </label>
            <label style={s.label}>
              Nom du site
              <input value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })} required placeholder="Ex : Usine Antananarivo" style={s.input} />
            </label>
            <label style={s.label}>
              Adresse
              <input value={formulaire.adresse} onChange={(e) => setFormulaire({ ...formulaire, adresse: e.target.value })} style={s.input} />
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
