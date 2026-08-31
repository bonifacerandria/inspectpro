import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Modal from '../components/ui/Modal'

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
    } catch {
      setErreur('Erreur de chargement.')
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
      famille_id: type.famille_id,
      code: type.code,
      libelle: type.libelle,
      icone: type.icone || '',
      actif: type.actif,
      ordre: type.ordre,
    })
    setErreurFormulaire(null)
    setModaleOuverte(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreurFormulaire(null)
    try {
      if (typeEnEdition) {
        await apiClient.put(`/types-equipement/${typeEnEdition.id}`, formulaire)
      } else {
        await apiClient.post('/types-equipement', formulaire)
      }
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
  if (erreur) return <p style={{ color: '#c0392b' }}>{erreur}</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Types d'équipement</h1>
        <button onClick={() => ouvrirCreation()} style={styles.boutonPrincipal}>
          + Nouveau type
        </button>
      </div>

      {familles.map((famille) => (
        <section key={famille.id} style={{ marginBottom: '1.5rem' }}>
          <h2 style={styles.titreFamille}>{famille.libelle}</h2>
          <div style={styles.grille}>
            {(typesParFamille[famille.code] || []).map((type) => (
              <div key={type.id} style={{ ...styles.carte, opacity: type.actif ? 1 : 0.5 }}>
                <div style={{ fontWeight: 600 }}>{type.libelle}</div>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem' }}>
                  {type.code} {!type.actif && '· inactif'}
                </div>
                <Link to={`/types-equipement/${type.id}/points-controle`} style={styles.lienPrincipal}>
                  Gérer les points de contrôle →
                </Link>
                <div style={{ marginTop: '0.5rem' }}>
                  <button onClick={() => ouvrirEdition(type)} style={styles.boutonLien}>Modifier</button>
                  <button onClick={() => handleSupprimer(type)} style={{ ...styles.boutonLien, color: '#c0392b' }}>Supprimer</button>
                </div>
              </div>
            ))}
            <button onClick={() => ouvrirCreation(famille.id)} style={styles.carteAjout}>
              + Ajouter un type
            </button>
          </div>
        </section>
      ))}

      {modaleOuverte && (
        <Modal titre={typeEnEdition ? 'Modifier le type' : 'Nouveau type'} onFermer={() => setModaleOuverte(false)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={styles.label}>
              Famille
              <select
                value={formulaire.famille_id}
                onChange={(e) => setFormulaire({ ...formulaire, famille_id: e.target.value })}
                required
                style={styles.input}
              >
                <option value="">— Choisir —</option>
                {familles.map((f) => (
                  <option key={f.id} value={f.id}>{f.libelle}</option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Code (identifiant technique, ex. PONT_ROULANT)
              <input value={formulaire.code}
                onChange={(e) => setFormulaire({ ...formulaire, code: e.target.value.toUpperCase() })}
                required style={styles.input} />
            </label>

            <label style={styles.label}>
              Libellé
              <input value={formulaire.libelle}
                onChange={(e) => setFormulaire({ ...formulaire, libelle: e.target.value })}
                required style={styles.input} />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={formulaire.actif}
                onChange={(e) => setFormulaire({ ...formulaire, actif: e.target.checked })} />
              Actif (visible dans l'app d'inspection)
            </label>

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

const styles = {
  titreFamille: { fontSize: '1rem', color: '#444', margin: '0 0 0.5rem' },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' },
  carte: { border: '1px solid #e2e2e2', borderRadius: 8, padding: '1rem', background: '#fff' },
  carteAjout: {
    border: '1px dashed #ccc', borderRadius: 8, background: 'transparent',
    color: '#666', cursor: 'pointer', minHeight: 80,
  },
  lienPrincipal: { fontSize: '0.85rem' },
  boutonLien: { border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline', marginRight: '0.75rem', fontSize: '0.8rem', padding: 0 },
  boutonPrincipal: { padding: '0.5rem 1rem', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer' },
  label: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' },
  input: { padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' },
}
