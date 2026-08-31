import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import Modal from '../components/ui/Modal'

const IDENTIFICATION_VIDE = {
  marque: '', modele: '', numero_serie: '', numero_equipement: '',
  annee_fabrication: '', cmu_tonnes: '', constructeur: '', localisation: '',
}

// Libellés lisibles pour les clés possibles de champs_identification (JSON par type)
const LIBELLES_CHAMPS_SUPPL = {
  type_elingue: "Type d'élingue",
  longueur_m: 'Longueur (m)',
  fabricant: 'Fabricant',
  date_fabrication: 'Date de fabrication',
  marquage: 'Marquage',
  nb_brins: 'Nombre de brins',
  diametre_chaine_mm: 'Diamètre chaîne (mm)',
  type_manille: 'Type de manille',
  diametre_axe_mm: "Diamètre de l'axe (mm)",
  type_crochet: 'Type de crochet',
  ouverture_bec_nominale_mm: 'Ouverture du bec nominale (mm)',
  portee_m: 'Portée (m)',
  hauteur_levage_m: 'Hauteur de levage (m)',
  vitesse_levage: 'Vitesse de levage',
}

export default function Equipements() {
  const navigate = useNavigate()
  const [equipements, setEquipements] = useState([])
  const [pagination, setPagination] = useState(null)
  const [sites, setSites] = useState([])
  const [typesParFamille, setTypesParFamille] = useState({})
  const [familles, setFamilles] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [etape, setEtape] = useState(1) // 1 = site+famille+type, 2 = identification
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
        apiClient.get('/equipements'),
        apiClient.get('/sites'),
        apiClient.get('/types-equipement'),
        apiClient.get('/familles-equipement'),
      ])
      setEquipements(eq.data ?? eq)
      setPagination(eq.data ? eq : null)
      setSites(st)
      setTypesParFamille(types)
      setFamilles(fam)
    } catch {
      setErreur('Erreur de chargement.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  function ouvrirCreation() {
    setEtape(1)
    setSiteId('')
    setTypeSelectionne(null)
    setIdentification(IDENTIFICATION_VIDE)
    setChampsSuppl({})
    setErreurFormulaire(null)
    setModaleOuverte(true)
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
        site_id: Number(siteId),
        type_equipement_id: typeSelectionne.id,
        ...identification,
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
    if (!confirm(`Supprimer cet équipement (${equipement.numero_serie || equipement.id}) ?`)) return
    try {
      await apiClient.delete(`/equipements/${equipement.id}`)
      await charger()
    } catch (err) {
      alert(err.response?.data?.message || 'Suppression impossible.')
    }
  }

  const champsIdentificationDuType = typeSelectionne?.champs_identification
    ? Object.keys(typeSelectionne.champs_identification)
    : []

  if (chargement) return <p>Chargement…</p>
  if (erreur) return <p style={{ color: '#c0392b' }}>{erreur}</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Équipements</h1>
        <button onClick={ouvrirCreation} style={styles.boutonPrincipal}>
          + Nouvel équipement
        </button>
      </div>

      {equipements.length === 0 && <p>Aucun équipement pour l'instant.</p>}

      {equipements.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Client / Site</th>
              <th style={styles.th}>Marque / Modèle</th>
              <th style={styles.th}>N° série</th>
              <th style={styles.th}>Dernière inspection</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {equipements.map((eq) => (
              <tr key={eq.id}>
                <td style={styles.td}>{eq.type_equipement?.libelle}</td>
                <td style={styles.td}>{eq.site?.client?.nom} — {eq.site?.nom}</td>
                <td style={styles.td}>{[eq.marque, eq.modele].filter(Boolean).join(' ') || '—'}</td>
                <td style={styles.td}>{eq.numero_serie || '—'}</td>
                <td style={styles.td}>
                  {eq.derniere_inspection?.date_inspection || 'Aucune'}
                </td>
                <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => navigate(`/inspections/nouvelle?equipement_id=${eq.id}`)}
                    style={styles.boutonLien}
                  >
                    Nouvelle inspection
                  </button>
                  <button onClick={() => handleSupprimer(eq)} style={{ ...styles.boutonLien, color: '#c0392b' }}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modaleOuverte && etape === 1 && (
        <Modal titre="Nouvel équipement — Famille et type" onFermer={() => setModaleOuverte(false)}>
          <label style={styles.label}>
            Site
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} required style={styles.input}>
              <option value="">— Choisir un site —</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.client?.nom} — {s.nom}</option>
              ))}
            </select>
          </label>

          {!siteId && (
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '1rem' }}>
              Sélectionne d'abord un site pour voir les types d'équipement disponibles.
            </p>
          )}

          {siteId && familles.map((famille) => (
            <div key={famille.id} style={{ marginTop: '1rem' }}>
              <h3 style={styles.titreFamille}>{famille.libelle}</h3>
              <div style={styles.grilleTypes}>
                {(typesParFamille[famille.code] || []).filter((t) => t.actif).map((type) => (
                  <button
                    key={type.id}
                    onClick={() => passerAIdentification(type)}
                    style={styles.carteType}
                  >
                    {type.libelle}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Modal>
      )}

      {modaleOuverte && etape === 2 && typeSelectionne && (
        <Modal titre={`Identification — ${typeSelectionne.libelle}`} onFermer={() => setModaleOuverte(false)}>
          <form onSubmit={soumettreIdentification} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button type="button" onClick={() => setEtape(1)} style={{ ...styles.boutonLien, marginLeft: 0, alignSelf: 'flex-start' }}>
              ← Changer de type
            </button>

            <Champ label="Marque" value={identification.marque}
              onChange={(v) => setIdentification({ ...identification, marque: v })} />
            <Champ label="Modèle" value={identification.modele}
              onChange={(v) => setIdentification({ ...identification, modele: v })} />
            <Champ label="N° de série" value={identification.numero_serie}
              onChange={(v) => setIdentification({ ...identification, numero_serie: v })} />
            <Champ label="N° équipement (interne client)" value={identification.numero_equipement}
              onChange={(v) => setIdentification({ ...identification, numero_equipement: v })} />
            <Champ label="Année de fabrication" type="number" value={identification.annee_fabrication}
              onChange={(v) => setIdentification({ ...identification, annee_fabrication: v })} />
            <Champ label="CMU (tonnes)" type="number" value={identification.cmu_tonnes}
              onChange={(v) => setIdentification({ ...identification, cmu_tonnes: v })} />
            <Champ label="Constructeur" value={identification.constructeur}
              onChange={(v) => setIdentification({ ...identification, constructeur: v })} />
            <Champ label="Localisation" value={identification.localisation}
              onChange={(v) => setIdentification({ ...identification, localisation: v })} />

            {champsIdentificationDuType.length > 0 && (
              <>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#666' }}>
                  Champs spécifiques à ce type
                </p>
                {champsIdentificationDuType.map((cle) => (
                  <Champ
                    key={cle}
                    label={LIBELLES_CHAMPS_SUPPL[cle] || cle}
                    value={champsSuppl[cle] || ''}
                    onChange={(v) => setChampsSuppl({ ...champsSuppl, [cle]: v })}
                  />
                ))}
              </>
            )}

            {erreurFormulaire && <p style={{ color: '#c0392b', fontSize: '0.85rem' }}>{erreurFormulaire}</p>}

            <button type="submit" disabled={envoiEnCours} style={styles.boutonPrincipal}>
              {envoiEnCours ? 'Enregistrement…' : "Créer l'équipement"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Champ({ label, value, onChange, type = 'text' }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }} />
    </label>
  )
}

const styles = {
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', borderBottom: '2px solid #e2e2e2', padding: '0.5rem', fontSize: '0.85rem', color: '#666' },
  td: { borderBottom: '1px solid #eee', padding: '0.5rem' },
  boutonPrincipal: { padding: '0.5rem 1rem', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer' },
  boutonLien: { border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline', marginLeft: '0.75rem', fontSize: '0.85rem' },
  label: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' },
  input: { padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' },
  titreFamille: { fontSize: '0.9rem', color: '#444', margin: '0 0 0.5rem' },
  grilleTypes: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' },
  carteType: {
    padding: '0.75rem', borderRadius: 6, border: '1px solid #ddd', background: '#fafafa',
    cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem',
  },
}
