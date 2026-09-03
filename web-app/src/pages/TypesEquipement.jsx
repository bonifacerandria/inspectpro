import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { theme, s } from '../styles/theme'

const TYPE_VIDE = { famille_id: '', code: '', libelle: '', icone: '', actif: true, ordre: 0 }

export default function TypesEquipement() {
  const [typesParFamille, setTypesParFamille] = useState({})
  const [familles, setFamilles] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [typeEnEdition, setTypeEnEdition] = useState(null)
  const [formulaire, setFormulaire] = useState(TYPE_VIDE)
  const [erreurFormulaire, setErreurFormulaire] = useState(null)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  async function charger() {
    setChargement(true)
    setErreur(null)
    try {
      const [{ data: types }, { data: fam }] = await Promise.all([
        apiClient.get('/types-equipement'),
        apiClient.get('/familles-equipement'),
      ])
      setTypesParFamille(types)
      setFamilles(fam)
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de chargement.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  function ouvrirCreation(familleId = '') {
    setTypeEnEdition(null)
    setFormulaire({ ...TYPE_VIDE, famille_id: familleId })
    setErreurFormulaire(null)
    setModaleOuverte(true)
  }

  function ouvrirEdition(type) {
    setTypeEnEdition(type)
    setFormulaire({
      famille_id: type.famille_id, code: type.code, libelle: type.libelle,
      icone: type.icone || '', actif: type.actif, ordre: type.ordre,
    })
    setErreurFormulaire(null)
    setModaleOuverte(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreurFormulaire(null)
    try {
      if (typeEnEdition) await apiClient.put(`/types-equipement/${typeEnEdition.id}`, formulaire)
      else await apiClient.post('/types-equipement', formulaire)
      setModaleOuverte(false)
      await charger()
    } catch (err) {
      const messages = err.response?.data?.errors
      setErreurFormulaire(messages ? Object.values(messages).flat().join(' ') : "Échec de l'enregistrement.")
    } finally {
      setEnvoiEnCours(false)
    }
  }

  async function handleSupprimer(type) {
    if (!confirm(`Supprimer le type "${type.libelle}" ?`)) return
    try {
      await apiClient.delete(`/types-equipement/${type.id}`)
      await charger()
    } catch (err) {
      alert(err.response?.data?.message || 'Suppression impossible.')
    }
  }

  if (chargement) return <p>Chargement…</p>
  if (erreur) return <p style={{ color: theme.colors.danger }}>{erreur}</p>

  const aucunType = Object.keys(typesParFamille).length === 0
    || Object.values(typesParFamille).every((arr) => arr.length === 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <p style={s.pageSubtitle}>Moteur d'inspection configurable — familles, types, points de contrôle</p>
        <button onClick={() => ouvrirCreation()} style={s.btnPrimary}>+ Nouveau type</button>
      </div>

      {aucunType && (
        <div style={s.card}>
          <EmptyState icon="🧩" title="Aucun type d'équipement" description="Crée le premier type pour démarrer le moteur d'inspection." />
        </div>
      )}

      {familles.map((famille) => (
        (typesParFamille[famille.code] || []).length > 0 && (
          <section key={famille.id} style={{ marginBottom: '20px' }}>
            <h2 style={styles.titreFamille}>{famille.libelle}</h2>
            <div style={styles.grille}>
              {(typesParFamille[famille.code] || []).map((type) => (
                <div key={type.id} style={{ ...styles.carte, opacity: type.actif ? 1 : 0.55 }}>
                  <div style={styles.carteEntete}>
                    <span style={styles.carteTitre}>{type.libelle}</span>
                    {!type.actif && <span style={styles.badgeInactif}>inactif</span>}
                  </div>
                  <div style={styles.carteCode}>{type.code}</div>
                  <Link to={`/types-equipement/${type.id}/points-controle`} style={styles.lienPrincipal}>
                    Gérer les points de contrôle →
                  </Link>
                  <div style={styles.carteActions}>
                    <button onClick={() => ouvrirEdition(type)} style={s.btnGhost}>Modifier</button>
                    <button onClick={() => handleSupprimer(type)} style={s.btnDanger}>Supprimer</button>
                  </div>
                </div>
              ))}
              <button onClick={() => ouvrirCreation(famille.id)} style={styles.carteAjout}>
                + Ajouter un type
              </button>
            </div>
          </section>
        )
      ))}

      {modaleOuverte && (
        <Modal titre={typeEnEdition ? 'Modifier le type' : 'Nouveau type'} onFermer={() => setModaleOuverte(false)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={s.label}>
              Famille
              <select value={formulaire.famille_id} onChange={(e) => setFormulaire({ ...formulaire, famille_id: e.target.value })} required style={s.input}>
                <option value="">— Choisir —</option>
                {familles.map((f) => <option key={f.id} value={f.id}>{f.libelle}</option>)}
              </select>
            </label>
            <label style={s.label}>
              Code (identifiant technique, ex. PONT_ROULANT)
              <input value={formulaire.code} onChange={(e) => setFormulaire({ ...formulaire, code: e.target.value.toUpperCase() })} required style={s.input} />
            </label>
            <label style={s.label}>
              Libellé
              <input value={formulaire.libelle} onChange={(e) => setFormulaire({ ...formulaire, libelle: e.target.value })} required style={s.input} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: theme.colors.textSecondary }}>
              <input type="checkbox" checked={formulaire.actif} onChange={(e) => setFormulaire({ ...formulaire, actif: e.target.checked })} />
              Actif (visible dans l'app d'inspection)
            </label>

            {erreurFormulaire && <div style={styles.erreur}>{erreurFormulaire}</div>}

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

const styles = {
  titreFamille: { fontSize: '13px', fontWeight: 700, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px' },
  carte: { background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg, padding: '18px', boxShadow: theme.shadow.sm },
  carteEntete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  carteTitre: { fontWeight: 700, fontSize: '14px', color: theme.colors.textPrimary },
  badgeInactif: { fontSize: '10px', fontWeight: 700, color: theme.colors.textMuted, background: theme.colors.neutralSoft, padding: '2px 8px', borderRadius: theme.radius.pill },
  carteCode: { fontSize: '12px', color: theme.colors.textMuted, marginTop: '2px', marginBottom: '14px', fontFamily: 'monospace' },
  lienPrincipal: { fontSize: '13px', fontWeight: 600, color: theme.colors.accent },
  carteActions: { marginTop: '14px', display: 'flex', gap: '4px' },
  carteAjout: {
    border: `1.5px dashed ${theme.colors.borderStrong}`, borderRadius: theme.radius.lg, background: 'transparent',
    color: theme.colors.textSecondary, cursor: 'pointer', minHeight: 110, fontSize: '13px', fontWeight: 600,
  },
  erreur: { background: theme.colors.dangerSoft, color: theme.colors.danger, padding: '10px 12px', borderRadius: theme.radius.md, fontSize: '13px', fontWeight: 600 },
}
