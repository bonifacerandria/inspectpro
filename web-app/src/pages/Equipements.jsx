import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import DataTable from '../components/ui/DataTable'
import { theme, s } from '../styles/theme'
import { useConfirm, useAlert } from '../context/ConfirmContext'
import { formatDate } from '../utils/date'

const IDENTIFICATION_VIDE = {
  marque: '', modele: '', numero_serie: '', numero_equipement: '',
  annee_fabrication: '', cmu_tonnes: '', constructeur: '', localisation: '',
}

const LIBELLES_CHAMPS_SUPPL = {
  type_elingue: "Type d'élingue", longueur_m: 'Longueur (m)', fabricant: 'Fabricant',
  date_fabrication: 'Date de fabrication', marquage: 'Marquage', nb_brins: 'Nombre de brins',
  diametre_chaine_mm: 'Diamètre chaîne (mm)', type_manille: 'Type de manille',
  diametre_axe_mm: "Diamètre de l'axe (mm)", type_crochet: 'Type de crochet',
  ouverture_bec_nominale_mm: 'Ouverture du bec nominale (mm)', portee_m: 'Portée (m)',
  hauteur_levage_m: 'Hauteur de levage (m)', vitesse_levage: 'Vitesse de levage',
}

export default function Equipements() {
  const navigate = useNavigate()
  const confirmer = useConfirm()
  const alerter = useAlert()
  const [equipements, setEquipements] = useState([])
  const [sites, setSites] = useState([])
  const [typesParFamille, setTypesParFamille] = useState({})
  const [familles, setFamilles] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [etape, setEtape] = useState(1)
  const [siteId, setSiteId] = useState('')
  const [typeSelectionne, setTypeSelectionne] = useState(null)
  const [identification, setIdentification] = useState(IDENTIFICATION_VIDE)
  const [champsSuppl, setChampsSuppl] = useState({})
  const [erreurFormulaire, setErreurFormulaire] = useState(null)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  async function charger() {
    setChargement(true)
    setErreur(null)
    try {
      const [{ data: eq }, { data: st }, { data: types }, { data: fam }] = await Promise.all([
        apiClient.get('/equipements', { params: { per_page: 500 } }),
        apiClient.get('/sites'),
        apiClient.get('/types-equipement'),
        apiClient.get('/familles-equipement'),
      ])
      setEquipements(eq.data ?? eq)
      setSites(st)
      setTypesParFamille(types)
      setFamilles(fam)
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de chargement.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  function ouvrirCreation() {
    setEtape(1); setSiteId(''); setTypeSelectionne(null)
    setIdentification(IDENTIFICATION_VIDE); setChampsSuppl({})
    setErreurFormulaire(null); setModaleOuverte(true)
  }

  function passerAIdentification(type) {
    setTypeSelectionne(type)
    setEtape(2)
  }

  async function soumettreIdentification(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreurFormulaire(null)
    try {
      await apiClient.post('/equipements', {
        site_id: Number(siteId), type_equipement_id: typeSelectionne.id, ...identification,
        annee_fabrication: identification.annee_fabrication || null,
        cmu_tonnes: identification.cmu_tonnes || null,
        champs_supplementaires: champsSuppl,
      })
      setModaleOuverte(false)
      await charger()
    } catch (err) {
      const messages = err.response?.data?.errors
      setErreurFormulaire(messages ? Object.values(messages).flat().join(' ') : "Échec de l'enregistrement.")
    } finally {
      setEnvoiEnCours(false)
    }
  }

  async function handleSupprimer(equipement) {
    const ok = await confirmer({
      titre: 'Supprimer cet équipement ?',
      message: `L'équipement ${equipement.numero_serie ? `n° ${equipement.numero_serie}` : `#${equipement.id}`} sera définitivement supprimé, ainsi que ses inspections archivées (rapports, photos, anomalies inclus). Impossible s'il a des inspections encore actives.`,
      libelleConfirmer: 'Supprimer',
    })
    if (!ok) return
    try {
      await apiClient.delete(`/equipements/${equipement.id}`)
      await charger()
    } catch (err) {
      await alerter({ message: err.response?.data?.message || 'Suppression impossible.' })
    }
  }

  const champsIdentificationDuType = typeSelectionne?.champs_identification
    ? Object.keys(typeSelectionne.champs_identification) : []

  if (chargement) return <p>Chargement…</p>
  if (erreur) return <p style={{ color: theme.colors.danger }}>{erreur}</p>

  const colonnesEquipements = [
    { key: 'type', label: 'Type', accessor: (eq) => eq.type_equipement?.libelle, render: (eq) => <span style={{ fontWeight: 600 }}>{eq.type_equipement?.libelle}</span> },
    { key: 'client_site', label: 'Client / Site', accessor: (eq) => `${eq.site?.client?.nom} ${eq.site?.nom}`, render: (eq) => <>{eq.site?.client?.nom} — {eq.site?.nom}</> },
    { key: 'marque_modele', label: 'Marque / Modèle', accessor: (eq) => [eq.marque, eq.modele].filter(Boolean).join(' '), render: (eq) => [eq.marque, eq.modele].filter(Boolean).join(' ') || '—' },
    { key: 'numero_serie', label: 'N° série' },
    { key: 'derniere_inspection', label: 'Dernière inspection', filterable: false, render: (eq) => eq.derniere_inspection ? formatDate(eq.derniere_inspection.date_inspection) : 'Aucune' },
    {
      key: 'actions', label: '', sortable: false, filterable: false, align: 'right',
      render: (eq) => (
        <span onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/inspections/nouvelle?equipement_id=${eq.id}`)} style={s.btnGhost}>Nouvelle inspection</button>
          <button onClick={() => handleSupprimer(eq)} style={s.btnDanger}>Supprimer</button>
        </span>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <p style={s.pageSubtitle}>{equipements.length} équipement(s)</p>
        <button onClick={ouvrirCreation} style={s.btnPrimary}>+ Nouvel équipement</button>
      </div>

      <div style={s.card}>
        <DataTable
          columns={colonnesEquipements}
          rows={equipements}
          texteVide="Aucun équipement — ajoute-en un avec le bouton ci-dessus."
        />
      </div>

      {modaleOuverte && etape === 1 && (
        <Modal titre="Nouvel équipement — Famille et type" onFermer={() => setModaleOuverte(false)} width={560}>
          <label style={s.label}>
            Site
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} required style={s.input}>
              <option value="">— Choisir un site —</option>
              {sites.map((st) => <option key={st.id} value={st.id}>{st.client?.nom} — {st.nom}</option>)}
            </select>
          </label>

          {!siteId && <p style={{ fontSize: '13px', color: theme.colors.textMuted, marginTop: '14px' }}>Sélectionne d'abord un site pour voir les types d'équipement disponibles.</p>}

          {siteId && familles.map((famille) => (
            <div key={famille.id} style={{ marginTop: '18px' }}>
              <h3 style={styles.titreFamille}>{famille.libelle}</h3>
              <div style={styles.grilleTypes}>
                {(typesParFamille[famille.code] || []).filter((t) => t.actif).map((type) => (
                  <button key={type.id} onClick={() => passerAIdentification(type)} style={styles.carteType}>
                    {type.libelle}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Modal>
      )}

      {modaleOuverte && etape === 2 && typeSelectionne && (
        <Modal titre={`Identification — ${typeSelectionne.libelle}`} onFermer={() => setModaleOuverte(false)} width={520}>
          <form onSubmit={soumettreIdentification} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button type="button" onClick={() => setEtape(1)} style={{ ...s.btnGhost, marginLeft: 0, alignSelf: 'flex-start', padding: 0 }}>
              ← Changer de type
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Champ label="Marque" value={identification.marque} onChange={(v) => setIdentification({ ...identification, marque: v })} />
              <Champ label="Modèle" value={identification.modele} onChange={(v) => setIdentification({ ...identification, modele: v })} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Champ label="N° de série" value={identification.numero_serie} onChange={(v) => setIdentification({ ...identification, numero_serie: v })} />
              <Champ label="N° équipement" value={identification.numero_equipement} onChange={(v) => setIdentification({ ...identification, numero_equipement: v })} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Champ label="Année de fabrication" type="number" value={identification.annee_fabrication} onChange={(v) => setIdentification({ ...identification, annee_fabrication: v })} />
              <Champ label="CMU (tonnes)" type="number" value={identification.cmu_tonnes} onChange={(v) => setIdentification({ ...identification, cmu_tonnes: v })} />
            </div>
            <Champ label="Constructeur" value={identification.constructeur} onChange={(v) => setIdentification({ ...identification, constructeur: v })} />
            <Champ label="Localisation" value={identification.localisation} onChange={(v) => setIdentification({ ...identification, localisation: v })} />

            {champsIdentificationDuType.length > 0 && (
              <>
                <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Champs spécifiques à ce type
                </p>
                {champsIdentificationDuType.map((cle) => (
                  <Champ key={cle} label={LIBELLES_CHAMPS_SUPPL[cle] || cle} value={champsSuppl[cle] || ''} onChange={(v) => setChampsSuppl({ ...champsSuppl, [cle]: v })} />
                ))}
              </>
            )}

            {erreurFormulaire && <div style={styles.erreur}>{erreurFormulaire}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setModaleOuverte(false)} style={s.btnSecondary}>Annuler</button>
              <button type="submit" disabled={envoiEnCours} style={s.btnPrimary}>
                {envoiEnCours ? 'Enregistrement…' : "Créer l'équipement"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Champ({ label, value, onChange, type = 'text' }) {
  return (
    <label style={{ ...s.label, flex: 1 }}>
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={s.input} />
    </label>
  )
}

const styles = {
  titreFamille: { fontSize: '12px', fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' },
  grilleTypes: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' },
  carteType: {
    padding: '12px', borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border}`,
    background: theme.colors.surfaceAlt, cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: 600,
  },
  erreur: { background: theme.colors.dangerSoft, color: theme.colors.danger, padding: '10px 12px', borderRadius: theme.radius.md, fontSize: '13px', fontWeight: 600 },
}
