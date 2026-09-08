import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { theme, s, STATUT_INSPECTION } from '../styles/theme'
import Badge from '../components/ui/Badge'
import DataTable from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import { formatDate } from '../utils/date'

const OPTIONS_STATUT = Object.entries(STATUT_INSPECTION).map(([value, v]) => ({ value, label: v.label }))

export default function Inspections() {
  const navigate = useNavigate()
  const [inspections, setInspections] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  // --- Modale "Nouvelle inspection" (sélection client -> site -> équipement) ---
  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [clients, setClients] = useState([])
  const [sites, setSites] = useState([])
  const [equipements, setEquipements] = useState([])
  const [clientId, setClientId] = useState('')
  const [siteId, setSiteId] = useState('')
  const [equipementId, setEquipementId] = useState('')
  const [chargementModale, setChargementModale] = useState(false)

  async function charger() {
    setChargement(true)
    setErreur(null)
    try {
      const { data } = await apiClient.get('/inspections', { params: { per_page: 500 } })
      setInspections(data.data ?? data)
    } catch {
      setErreur('Erreur de chargement des inspections.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  async function ouvrirModaleCreation() {
    setClientId(''); setSiteId(''); setEquipementId('')
    setSites([]); setEquipements([])
    setModaleOuverte(true)
    if (clients.length === 0) {
      const { data } = await apiClient.get('/clients', { params: { per_page: 500 } })
      setClients(data.data ?? data)
    }
  }

  async function handleChangerClient(id) {
    setClientId(id); setSiteId(''); setEquipementId(''); setEquipements([])
    if (!id) { setSites([]); return }
    setChargementModale(true)
    const { data } = await apiClient.get('/sites', { params: { client_id: id } })
    setSites(data)
    setChargementModale(false)
  }

  async function handleChangerSite(id) {
    setSiteId(id); setEquipementId('')
    if (!id) { setEquipements([]); return }
    setChargementModale(true)
    const { data } = await apiClient.get('/equipements', { params: { site_id: id, per_page: 200 } })
    setEquipements(data.data ?? data)
    setChargementModale(false)
  }

  function demarrerInspection() {
    navigate(`/inspections/nouvelle?equipement_id=${equipementId}`)
  }

  const colonnes = [
    {
      key: 'equipement', label: 'Équipement', filterType: 'text',
      accessor: (r) => r.equipement?.type_equipement?.libelle,
      render: (r) => <span style={{ fontWeight: 600 }}>{r.equipement?.type_equipement?.libelle}</span>,
    },
    {
      key: 'client', label: 'Client / Site', filterType: 'text',
      accessor: (r) => `${r.equipement?.site?.client?.nom} ${r.equipement?.site?.nom}`,
      render: (r) => <>{r.equipement?.site?.client?.nom} — {r.equipement?.site?.nom}</>,
    },
    {
      key: 'inspecteur', label: 'Inspecteur', filterType: 'text',
      accessor: (r) => r.inspecteur?.nom,
    },
    {
      key: 'date_inspection', label: 'Date', filterable: false,
      render: (r) => formatDate(r.date_inspection),
    },
    {
      key: 'avis', label: 'Avis', filterable: false,
      accessor: (r) => r.conclusion || r.avis_propose,
      render: (r) => (
        <span style={{ fontSize: '12px', color: theme.colors.textSecondary }}>{r.conclusion || r.avis_propose || ''}</span>
      ),
    },
    {
      key: 'statut', label: 'Statut', filterType: 'select', filterOptions: OPTIONS_STATUT,
      render: (r) => {
        const st = STATUT_INSPECTION[r.statut] || STATUT_INSPECTION.en_cours
        return <Badge variant={st.variant}>{st.label}</Badge>
      },
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <p style={s.pageSubtitle}>{inspections.length} inspection(s) — clique sur un en-tête pour trier, filtre sous chaque colonne</p>
        <button onClick={ouvrirModaleCreation} style={s.btnPrimary}>+ Nouvelle inspection</button>
      </div>

      <div style={s.card}>
        {chargement ? (
          <p>Chargement…</p>
        ) : erreur ? (
          <p style={{ color: theme.colors.danger }}>{erreur}</p>
        ) : (
          <DataTable
            columns={colonnes}
            rows={inspections}
            onRowClick={(insp) => navigate(`/inspections/${insp.id}`)}
            texteVide="Aucune inspection — crée-en une avec le bouton ci-dessus."
          />
        )}
      </div>

      {modaleOuverte && (
        <Modal titre="Nouvelle inspection" onFermer={() => setModaleOuverte(false)} width={480}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={s.label}>
              Client
              <select value={clientId} onChange={(e) => handleChangerClient(e.target.value)} style={s.input}>
                <option value="">— Choisir un client —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </label>

            <label style={s.label}>
              Site
              <select value={siteId} onChange={(e) => handleChangerSite(e.target.value)} disabled={!clientId} style={s.input}>
                <option value="">— Choisir un site —</option>
                {sites.map((st) => <option key={st.id} value={st.id}>{st.nom}</option>)}
              </select>
            </label>

            <label style={s.label}>
              Équipement
              <select value={equipementId} onChange={(e) => setEquipementId(e.target.value)} disabled={!siteId} style={s.input}>
                <option value="">— Choisir un équipement —</option>
                {equipements.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.type_equipement?.libelle} {eq.numero_serie ? `(${eq.numero_serie})` : ''}
                  </option>
                ))}
              </select>
            </label>

            {siteId && equipements.length === 0 && !chargementModale && (
              <p style={{ fontSize: '13px', color: theme.colors.textMuted }}>
                Aucun équipement sur ce site. Ajoute-en un depuis le menu Équipements.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button type="button" onClick={() => setModaleOuverte(false)} style={s.btnSecondary}>Annuler</button>
              <button type="button" onClick={demarrerInspection} disabled={!equipementId} style={s.btnPrimary}>
                Démarrer l'inspection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
