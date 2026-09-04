import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import apiClient from '../api/client'
import Modal from '../components/ui/Modal'
import { useConfirm } from '../context/ConfirmContext'

const TYPES_REPONSE = [
  { valeur: 'conforme_echelle', label: 'Échelle C / O / NC / DM / DI' },
  { valeur: 'oui_non', label: 'Oui / Non' },
  { valeur: 'texte', label: 'Texte libre' },
  { valeur: 'nombre', label: 'Nombre' },
  { valeur: 'mesure', label: 'Mesure (avec valeur nominale)' },
  { valeur: 'choix_multiple', label: 'Choix multiple' },
  { valeur: 'photo', label: 'Photo' },
]

const POINT_VIDE = {
  section_id: '', code: '', libelle: '', type_reponse: 'conforme_echelle',
  options: '', unite_mesure: '', valeur_nominale: '', tolerance_pourcent: '',
  obligatoire: true, ordre: 0,
}
const SECTION_VIDE = { code: '', libelle: '', ordre: 0 }

export default function PointsControle() {
  const { typeId } = useParams()
  const confirmer = useConfirm()
  const [formulaire, setFormulaire] = useState(null) // sortie de /types-equipement/{id}/formulaire
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  const [modalePoint, setModalePoint] = useState(false)
  const [pointEnEdition, setPointEnEdition] = useState(null)
  const [sectionCourante, setSectionCourante] = useState(null) // pour la création
  const [donneesPoint, setDonneesPoint] = useState(POINT_VIDE)
  const [erreurPoint, setErreurPoint] = useState(null)

  const [modaleSection, setModaleSection] = useState(false)
  const [donneesSection, setDonneesSection] = useState(SECTION_VIDE)
  const [erreurSection, setErreurSection] = useState(null)

  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  async function charger() {
    setChargement(true)
    setErreur(null)
    try {
      const { data } = await apiClient.get(`/types-equipement/${typeId}/formulaire`)
      setFormulaire(data)
    } catch {
      setErreur('Erreur de chargement du formulaire.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [typeId])

  // --- Points de contrôle ---

  function ouvrirCreationPoint(section) {
    setPointEnEdition(null)
    setSectionCourante(section)
    setDonneesPoint({ ...POINT_VIDE, section_id: section.id || '' })
    setErreurPoint(null)
    setModalePoint(true)
  }

  function ouvrirEditionPoint(point, section) {
    setPointEnEdition(point)
    setSectionCourante(section)
    setDonneesPoint({
      section_id: section.id ?? '',
      code: point.code,
      libelle: point.libelle,
      type_reponse: point.type_reponse,
      options: (point.options || []).join(', '),
      unite_mesure: point.unite_mesure || '',
      valeur_nominale: point.valeur_nominale || '',
      tolerance_pourcent: point.tolerance_pourcent || '',
      obligatoire: point.obligatoire,
      ordre: point.ordre,
    })
    setErreurPoint(null)
    setModalePoint(true)
  }

  async function soumettrePoint(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreurPoint(null)
    try {
      const payload = {
        type_equipement_id: Number(typeId),
        section_id: donneesPoint.section_id || null,
        code: donneesPoint.code,
        libelle: donneesPoint.libelle,
        type_reponse: donneesPoint.type_reponse,
        options: donneesPoint.type_reponse === 'choix_multiple'
          ? donneesPoint.options.split(',').map((o) => o.trim()).filter(Boolean)
          : null,
        unite_mesure: donneesPoint.type_reponse === 'mesure' ? donneesPoint.unite_mesure : null,
        valeur_nominale: donneesPoint.type_reponse === 'mesure' ? (donneesPoint.valeur_nominale || null) : null,
        tolerance_pourcent: donneesPoint.type_reponse === 'mesure' ? (donneesPoint.tolerance_pourcent || null) : null,
        obligatoire: donneesPoint.obligatoire,
        ordre: Number(donneesPoint.ordre) || 0,
      }

      if (pointEnEdition) {
        await apiClient.put(`/points-controle/${pointEnEdition.id}`, payload)
      } else {
        await apiClient.post('/points-controle', payload)
      }
      setModalePoint(false)
      await charger()
    } catch (err) {
      const messages = err.response?.data?.errors
      setErreurPoint(messages ? Object.values(messages).flat().join(' ') : "Échec de l'enregistrement.")
    } finally {
      setEnvoiEnCours(false)
    }
  }

  async function supprimerPoint(point) {
    const ok = await confirmer({
      titre: 'Supprimer ce point de contrôle ?',
      message: `"${point.libelle}" sera définitivement supprimé du formulaire.`,
      libelleConfirmer: 'Supprimer',
    })
    if (!ok) return
    try {
      await apiClient.delete(`/points-controle/${point.id}`)
      await charger()
    } catch (err) {
      alert(err.response?.data?.message || 'Suppression impossible.')
    }
  }

  // --- Sections ---

  function ouvrirCreationSection() {
    setDonneesSection({ ...SECTION_VIDE, ordre: (formulaire?.sections?.length || 0) + 1 })
    setErreurSection(null)
    setModaleSection(true)
  }

  async function soumettreSection(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreurSection(null)
    try {
      await apiClient.post('/sections-controle', {
        type_equipement_id: Number(typeId),
        code: donneesSection.code.toUpperCase().replace(/\s+/g, '_'),
        libelle: donneesSection.libelle,
        ordre: Number(donneesSection.ordre) || 0,
      })
      setModaleSection(false)
      await charger()
    } catch (err) {
      const messages = err.response?.data?.errors
      setErreurSection(messages ? Object.values(messages).flat().join(' ') : "Échec de l'enregistrement.")
    } finally {
      setEnvoiEnCours(false)
    }
  }

  if (chargement) return <p>Chargement…</p>
  if (erreur) return <p style={{ color: '#c0392b' }}>{erreur}</p>
  if (!formulaire) return null

  return (
    <div>
      <Link to="/types-equipement" style={{ fontSize: '0.85rem' }}>← Types d'équipement</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0 1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>{formulaire.type_equipement.libelle}</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
            {formulaire.nb_points_controles} point(s) de contrôle configuré(s)
          </p>
        </div>
        <button onClick={ouvrirCreationSection} style={styles.boutonSecondaire}>
          + Nouvelle section
        </button>
      </div>

      {formulaire.sections.length === 0 && (
        <p>Aucune section pour l'instant — commence par en créer une.</p>
      )}

      {formulaire.sections.map((section) => (
        <section key={section.code} style={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={styles.titreSection}>{section.libelle}</h2>
            <button onClick={() => ouvrirCreationPoint(section)} style={styles.boutonLien}>
              + Ajouter un point de contrôle
            </button>
          </div>

          {section.points_controle.length === 0 ? (
            <p style={{ color: '#999', fontSize: '0.85rem' }}>Aucun point dans cette section.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Libellé</th>
                  <th style={styles.th}>Type de réponse</th>
                  <th style={styles.th}>Obligatoire</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {section.points_controle.map((point) => (
                  <tr key={point.id}>
                    <td style={styles.td}>{point.code}</td>
                    <td style={styles.td}>{point.libelle}</td>
                    <td style={styles.td}>
                      {TYPES_REPONSE.find((t) => t.valeur === point.type_reponse)?.label || point.type_reponse}
                    </td>
                    <td style={styles.td}>{point.obligatoire ? 'Oui' : 'Non'}</td>
                    <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => ouvrirEditionPoint(point, section)} style={styles.boutonLien}>Modifier</button>
                      <button onClick={() => supprimerPoint(point)} style={{ ...styles.boutonLien, color: '#c0392b' }}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}

      {modalePoint && (
        <Modal
          titre={pointEnEdition ? 'Modifier le point de contrôle' : 'Nouveau point de contrôle'}
          onFermer={() => setModalePoint(false)}
        >
          <form onSubmit={soumettrePoint} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
              Section : {sectionCourante?.libelle || 'Général'}
            </p>

            <label style={styles.label}>
              Code (ex. PC501)
              <input value={donneesPoint.code}
                onChange={(e) => setDonneesPoint({ ...donneesPoint, code: e.target.value })}
                required style={styles.input} />
            </label>

            <label style={styles.label}>
              Libellé
              <input value={donneesPoint.libelle}
                onChange={(e) => setDonneesPoint({ ...donneesPoint, libelle: e.target.value })}
                required style={styles.input} />
            </label>

            <label style={styles.label}>
              Type de réponse
              <select value={donneesPoint.type_reponse}
                onChange={(e) => setDonneesPoint({ ...donneesPoint, type_reponse: e.target.value })}
                style={styles.input}>
                {TYPES_REPONSE.map((t) => (
                  <option key={t.valeur} value={t.valeur}>{t.label}</option>
                ))}
              </select>
            </label>

            {donneesPoint.type_reponse === 'choix_multiple' && (
              <label style={styles.label}>
                Options (séparées par des virgules)
                <input value={donneesPoint.options}
                  onChange={(e) => setDonneesPoint({ ...donneesPoint, options: e.target.value })}
                  placeholder="Ex: Simple, Double, À émerillon"
                  style={styles.input} />
              </label>
            )}

            {donneesPoint.type_reponse === 'mesure' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label style={{ ...styles.label, flex: 1 }}>
                  Unité
                  <input value={donneesPoint.unite_mesure}
                    onChange={(e) => setDonneesPoint({ ...donneesPoint, unite_mesure: e.target.value })}
                    placeholder="mm" style={styles.input} />
                </label>
                <label style={{ ...styles.label, flex: 1 }}>
                  Valeur nominale
                  <input type="number" step="0.01" value={donneesPoint.valeur_nominale}
                    onChange={(e) => setDonneesPoint({ ...donneesPoint, valeur_nominale: e.target.value })}
                    style={styles.input} />
                </label>
                <label style={{ ...styles.label, flex: 1 }}>
                  Tolérance %
                  <input type="number" step="0.01" value={donneesPoint.tolerance_pourcent}
                    onChange={(e) => setDonneesPoint({ ...donneesPoint, tolerance_pourcent: e.target.value })}
                    style={styles.input} />
                </label>
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={donneesPoint.obligatoire}
                onChange={(e) => setDonneesPoint({ ...donneesPoint, obligatoire: e.target.checked })} />
              Réponse obligatoire
            </label>

            <label style={styles.label}>
              Ordre d'affichage
              <input type="number" value={donneesPoint.ordre}
                onChange={(e) => setDonneesPoint({ ...donneesPoint, ordre: e.target.value })}
                style={styles.input} />
            </label>

            {erreurPoint && <p style={{ color: '#c0392b', fontSize: '0.85rem' }}>{erreurPoint}</p>}

            <button type="submit" disabled={envoiEnCours} style={styles.boutonPrincipal}>
              {envoiEnCours ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </Modal>
      )}

      {modaleSection && (
        <Modal titre="Nouvelle section" onFermer={() => setModaleSection(false)}>
          <form onSubmit={soumettreSection} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={styles.label}>
              Code (ex. STRUCTURE)
              <input value={donneesSection.code}
                onChange={(e) => setDonneesSection({ ...donneesSection, code: e.target.value })}
                required style={styles.input} />
            </label>
            <label style={styles.label}>
              Libellé
              <input value={donneesSection.libelle}
                onChange={(e) => setDonneesSection({ ...donneesSection, libelle: e.target.value })}
                required style={styles.input} />
            </label>
            <label style={styles.label}>
              Ordre d'affichage
              <input type="number" value={donneesSection.ordre}
                onChange={(e) => setDonneesSection({ ...donneesSection, ordre: e.target.value })}
                style={styles.input} />
            </label>

            {erreurSection && <p style={{ color: '#c0392b', fontSize: '0.85rem' }}>{erreurSection}</p>}

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
  section: { marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e2e2', borderRadius: 8, background: '#fff' },
  titreSection: { fontSize: '1rem', margin: '0 0 0.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' },
  th: { textAlign: 'left', borderBottom: '2px solid #e2e2e2', padding: '0.4rem', fontSize: '0.8rem', color: '#666' },
  td: { borderBottom: '1px solid #eee', padding: '0.4rem', fontSize: '0.9rem' },
  boutonPrincipal: { padding: '0.5rem 1rem', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer' },
  boutonSecondaire: { padding: '0.5rem 1rem', borderRadius: 4, border: '1px solid #1a1a1a', background: '#fff', cursor: 'pointer' },
  boutonLien: { border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline', marginLeft: '0.75rem', fontSize: '0.8rem' },
  label: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' },
  input: { padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' },
}
