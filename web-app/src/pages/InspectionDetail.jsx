import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import apiClient from '../api/client'
import PhotoUpload from '../components/ui/PhotoUpload'
import { useConfirm } from '../context/ConfirmContext'

const OPTIONS_ECHELLE = [
  { code: 'C', label: 'C', couleur: '#2e7d32' },
  { code: 'O', label: 'O', couleur: '#f39c12' },
  { code: 'NC', label: 'NC', couleur: '#e67e22' },
  { code: 'DM', label: 'DM', couleur: '#c0392b' },
  { code: 'DI', label: 'DI', couleur: '#7b0000' },
  { code: 'NA', label: 'NA', couleur: '#999' },
]

export default function InspectionDetail() {
  const { inspectionId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const confirmer = useConfirm()

  const [inspection, setInspection] = useState(null)
  const [formulaire, setFormulaire] = useState(null)
  const [reponsesParPoint, setReponsesParPoint] = useState({})
  const [photosParCible, setPhotosParCible] = useState({}) // { [type]: { [id]: [photos] } }
  const [synthese, setSynthese] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [conclusion, setConclusion] = useState('')
  const [validationEnCours, setValidationEnCours] = useState(false)
  const [genererPdfEnCours, setGenererPdfEnCours] = useState(false)

  const estNouvelle = inspectionId === 'nouvelle'

  const chargerInspection = useCallback(async (id) => {
    const [{ data: insp }, { data: photos }] = await Promise.all([
      apiClient.get(`/inspections/${id}`),
      apiClient.get('/photos', { params: { inspection_id: id } }),
    ])
    setInspection(insp)

    const mapReponses = {}
    insp.reponses.forEach((r) => { mapReponses[r.point_controle_id] = r })
    setReponsesParPoint(mapReponses)

    const mapPhotos = {}
    photos.forEach((p) => {
      mapPhotos[p.photographiable_type] ??= {}
      mapPhotos[p.photographiable_type][p.photographiable_id] ??= []
      mapPhotos[p.photographiable_type][p.photographiable_id].push(p)
    })
    setPhotosParCible(mapPhotos)

    const { data: form } = await apiClient.get(
      `/types-equipement/${insp.equipement.type_equipement_id}/formulaire`
    )
    setFormulaire(form)

    const { data: synth } = await apiClient.get(`/inspections/${id}/synthese`)
    setSynthese(synth)
    setConclusion(insp.conclusion || '')
  }, [])

  useEffect(() => {
    async function init() {
      setChargement(true)
      setErreur(null)
      try {
        if (estNouvelle) {
          const equipementId = searchParams.get('equipement_id')
          if (!equipementId) {
            setErreur('Aucun équipement sélectionné.')
            return
          }
          const { data: nouvelleInspection } = await apiClient.post('/inspections', {
            equipement_id: Number(equipementId),
          })
          navigate(`/inspections/${nouvelleInspection.id}`, { replace: true })
          return
        }
        await chargerInspection(inspectionId)
      } catch {
        setErreur("Erreur lors du chargement de l'inspection.")
      } finally {
        setChargement(false)
      }
    }
    init()
  }, [inspectionId, estNouvelle, searchParams, navigate, chargerInspection])

  // Recharge tout après chaque saisie : plus simple et robuste que de
  // mettre à jour chaque bout d'état séparément (une réponse peut créer/
  // modifier/supprimer une anomalie, donc la liste d'anomalies doit rester
  // synchronisée elle aussi).
  async function enregistrerReponse(point, payload) {
    try {
      await apiClient.post(`/inspections/${inspectionId}/reponses`, {
        point_controle_id: point.id,
        ...payload,
      })
      await chargerInspection(inspectionId)
    } catch (err) {
      alert(err.response?.data?.message || "Échec de l'enregistrement de la réponse.")
    }
  }

  async function metAJourAnomalie(anomalie, champs) {
    try {
      await apiClient.put(`/anomalies/${anomalie.id}`, champs)
      await chargerInspection(inspectionId)
    } catch {
      alert("Échec de la mise à jour de l'anomalie.")
    }
  }

  async function handleValider() {
    const ok = await confirmer({
      titre: "Valider l'inspection ?",
      message: 'Une fois validée, cette inspection ne sera plus modifiable.',
      libelleConfirmer: 'Valider',
      danger: false,
    })
    if (!ok) return
    setValidationEnCours(true)
    try {
      await apiClient.post(`/inspections/${inspectionId}/valider`, { conclusion })
      await chargerInspection(inspectionId)
    } catch (err) {
      const manquantes = err.response?.data?.photos_manquantes
      if (manquantes?.length) {
        const forcer = await confirmer({
          titre: 'Photos obligatoires manquantes',
          message: `Manquantes : ${manquantes.join(', ')}. Valider quand même ?`,
          libelleConfirmer: 'Valider quand même',
        })
        if (forcer) {
          await apiClient.post(`/inspections/${inspectionId}/valider`, {
            conclusion, ignorer_photos_manquantes: true,
          })
          await chargerInspection(inspectionId)
        }
      } else {
        alert(err.response?.data?.message || 'Échec de la validation.')
      }
    } finally {
      setValidationEnCours(false)
    }
  }

  async function telechargerRapport() {
    setGenererPdfEnCours(true)
    try {
      const { data: rapport } = await apiClient.post(`/inspections/${inspectionId}/rapport`)
      const reponsePdf = await apiClient.get(`/rapports/${rapport.id}/telecharger`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([reponsePdf.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-${rapport.numero_rapport}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Échec de la génération du rapport.')
    } finally {
      setGenererPdfEnCours(false)
    }
  }

  if (chargement) return <p>Chargement…</p>
  if (erreur) return <p style={{ color: '#c0392b' }}>{erreur}</p>
  if (!inspection || !formulaire) return null

  const modifiable = inspection.statut === 'en_cours'
  const photosDe = (type, id) => photosParCible[type]?.[id] || []

  return (
    <div>
      <Link to="/inspections" style={{ fontSize: '0.85rem' }}>← Inspections</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '0.5rem 0 1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>
            {formulaire.type_equipement.libelle} — {inspection.equipement.site.client.nom}
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
            {inspection.equipement.site.nom} · {inspection.equipement.numero_serie || 'sans n° série'} ·
            Statut : <strong>{inspection.statut}</strong>
          </p>
        </div>
        {!modifiable && (
          <button onClick={telechargerRapport} disabled={genererPdfEnCours} style={styles.boutonSecondaire}>
            {genererPdfEnCours ? 'Génération…' : '📄 Télécharger le rapport PDF'}
          </button>
        )}
      </div>

      {synthese && (
        <div style={styles.panneauSynthese}>
          <Compteur label="Contrôlés" valeur={synthese.nb_points_controles} />
          <Compteur label="Conformes" valeur={synthese.nb_conformes} couleur="#2e7d32" />
          <Compteur label="Observations" valeur={synthese.nb_observations} couleur="#f39c12" />
          <Compteur label="Non-conformes" valeur={synthese.nb_non_conformes} couleur="#e67e22" />
          <Compteur label="Défauts majeurs" valeur={synthese.nb_defauts_majeurs} couleur="#c0392b" />
          <Compteur label="Danger immédiat" valeur={synthese.nb_dangers_immediats} couleur="#7b0000" />
        </div>
      )}
      {synthese?.avis_propose && (
        <p style={styles.avis}>Avis proposé : {synthese.avis_propose}</p>
      )}

      {/* Points de contrôle, par section */}
      {formulaire.sections.map((section) => (
        <section key={section.code} style={styles.section}>
          <h2 style={styles.titreSection}>{section.libelle}</h2>
          {section.points_controle.map((point) => (
            <LignePointControle
              key={point.id}
              point={point}
              reponse={reponsesParPoint[point.id]}
              photos={reponsesParPoint[point.id] ? photosDe('reponse_controle', reponsesParPoint[point.id].id) : []}
              modifiable={modifiable}
              inspectionId={inspectionId}
              onEnregistrer={(payload) => enregistrerReponse(point, payload)}
              onPhotosChange={() => chargerInspection(inspectionId)}
            />
          ))}
        </section>
      ))}

      {/* Photos obligatoires (CDC section 14) */}
      {formulaire.photos_obligatoires.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.titreSection}>Photos obligatoires</h2>
          {formulaire.photos_obligatoires.map((po) => (
            <div key={po.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.4rem 0' }}>
              <span style={{ minWidth: 180, fontSize: '0.9rem' }}>{po.libelle}</span>
              <PhotoUpload
                inspectionId={inspectionId}
                photographiableType="photo_obligatoire"
                photographiableId={po.id}
                libelle={po.libelle}
                photos={photosDe('photo_obligatoire', po.id)}
                onChange={() => chargerInspection(inspectionId)}
              />
            </div>
          ))}
        </section>
      )}

      {/* Anomalies (créées automatiquement, complétées ici) */}
      {inspection.anomalies.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.titreSection}>Anomalies</h2>
          {inspection.anomalies.map((anomalie) => (
            <div key={anomalie.id} style={styles.blocAnomalie}>
              <div style={{ fontWeight: 600 }}>
                {anomalie.numero} — {anomalie.gravite.replace('_', ' ')}
              </div>
              <div style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}>{anomalie.constat}</div>
              {modifiable ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxWidth: 420 }}>
                  <input
                    placeholder="Action recommandée"
                    defaultValue={anomalie.action_recommandee || ''}
                    onBlur={(e) => metAJourAnomalie(anomalie, { action_recommandee: e.target.value })}
                    style={styles.input}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      placeholder="Responsable"
                      defaultValue={anomalie.responsable || ''}
                      onBlur={(e) => metAJourAnomalie(anomalie, { responsable: e.target.value })}
                      style={{ ...styles.input, flex: 1 }}
                    />
                    <input
                      type="date"
                      defaultValue={anomalie.delai || ''}
                      onBlur={(e) => metAJourAnomalie(anomalie, { delai: e.target.value || null })}
                      style={styles.input}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {anomalie.action_recommandee} {anomalie.responsable && `· ${anomalie.responsable}`}
                </div>
              )}
              <div style={{ marginTop: '0.5rem' }}>
                <PhotoUpload
                  inspectionId={inspectionId}
                  photographiableType="anomalie"
                  photographiableId={anomalie.id}
                  photos={photosDe('anomalie', anomalie.id)}
                  onChange={() => chargerInspection(inspectionId)}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Conclusion */}
      <section style={styles.section}>
        <h2 style={styles.titreSection}>Conclusion</h2>
        {modifiable ? (
          <>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder={synthese?.avis_propose || 'Conclusion...'}
              rows={3}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
            />
            <button onClick={handleValider} disabled={validationEnCours} style={{ ...styles.boutonPrincipal, marginTop: '0.75rem' }}>
              {validationEnCours ? 'Validation…' : "Valider l'inspection"}
            </button>
          </>
        ) : (
          <p>{inspection.conclusion}</p>
        )}
      </section>
    </div>
  )
}

function LignePointControle({ point, reponse, photos, modifiable, inspectionId, onEnregistrer, onPhotosChange }) {
  const [commentaire, setCommentaire] = useState(reponse?.commentaire || '')

  return (
    <div style={styles.lignePoint}>
      <div style={styles.libellePoint}>
        {point.libelle}
        {point.obligatoire && <span style={{ color: '#c0392b' }}> *</span>}
      </div>

      <div style={styles.widgetPoint}>
        {point.type_reponse === 'photo' ? (
          reponse ? (
            <PhotoUpload
              inspectionId={inspectionId}
              photographiableType="reponse_controle"
              photographiableId={reponse.id}
              libelle={point.libelle}
              photos={photos}
              onChange={onPhotosChange}
            />
          ) : (
            <button disabled={!modifiable} onClick={() => onEnregistrer({})} style={styles.boutonEchelle}>
              Initialiser
            </button>
          )
        ) : (
          <WidgetReponse point={point} reponse={reponse} modifiable={modifiable} onEnregistrer={onEnregistrer} />
        )}
      </div>

      {modifiable && ['conforme_echelle', 'oui_non'].includes(point.type_reponse) && (
        <input
          placeholder="Commentaire (optionnel)"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          onBlur={() => onEnregistrer({ statut: reponse?.statut, commentaire })}
          style={styles.commentaire}
        />
      )}
    </div>
  )
}

function WidgetReponse({ point, reponse, modifiable, onEnregistrer }) {
  switch (point.type_reponse) {
    case 'conforme_echelle':
      return (
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {OPTIONS_ECHELLE.map((opt) => {
            const selectionne = reponse?.statut === opt.code
            return (
              <button
                key={opt.code}
                disabled={!modifiable}
                onClick={() => onEnregistrer({ statut: opt.code })}
                style={{
                  ...styles.boutonEchelle,
                  background: selectionne ? opt.couleur : '#fff',
                  color: selectionne ? '#fff' : opt.couleur,
                  borderColor: opt.couleur,
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )

    case 'oui_non':
      return (
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['Oui', 'Non'].map((val) => (
            <button
              key={val}
              disabled={!modifiable}
              onClick={() => onEnregistrer({ valeur_choix: val })}
              style={{
                ...styles.boutonEchelle,
                background: reponse?.valeur_choix === val ? '#1a1a1a' : '#fff',
                color: reponse?.valeur_choix === val ? '#fff' : '#1a1a1a',
                borderColor: '#1a1a1a',
              }}
            >
              {val}
            </button>
          ))}
        </div>
      )

    case 'choix_multiple':
      return (
        <select
          disabled={!modifiable}
          defaultValue={reponse?.valeur_choix || ''}
          onChange={(e) => onEnregistrer({ valeur_choix: e.target.value })}
          style={styles.input}
        >
          <option value="">—</option>
          {(point.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )

    case 'texte':
      return (
        <textarea
          disabled={!modifiable}
          defaultValue={reponse?.valeur_texte || ''}
          onBlur={(e) => onEnregistrer({ valeur_texte: e.target.value })}
          rows={2}
          style={{ ...styles.input, width: '100%' }}
        />
      )

    case 'nombre':
      return (
        <input
          type="number"
          disabled={!modifiable}
          defaultValue={reponse?.valeur_nombre ?? ''}
          onBlur={(e) => onEnregistrer({ valeur_nombre: e.target.value || null })}
          style={styles.input}
        />
      )

    case 'mesure':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="number" step="0.01"
            disabled={!modifiable}
            defaultValue={reponse?.valeur_nombre ?? ''}
            onBlur={(e) => onEnregistrer({ valeur_nombre: e.target.value || null })}
            style={styles.input}
          />
          <span style={{ fontSize: '0.8rem', color: '#666' }}>
            {point.unite_mesure}
            {point.valeur_nominale && ` (nominal : ${point.valeur_nominale}${point.unite_mesure})`}
          </span>
          {reponse?.statut && (
            <span style={{ fontSize: '0.75rem', color: reponse.statut === 'C' ? '#2e7d32' : '#c0392b' }}>
              {reponse.statut === 'C' ? '✓ dans tolérance' : '✗ hors tolérance'}
            </span>
          )}
        </div>
      )

    default:
      return null
  }
}

function Compteur({ label, valeur, couleur = '#333' }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: couleur }}>{valeur}</div>
      <div style={{ fontSize: '0.75rem', color: '#666' }}>{label}</div>
    </div>
  )
}

const styles = {
  panneauSynthese: {
    display: 'flex', gap: '1.5rem', padding: '1rem', background: '#fff',
    border: '1px solid #e2e2e2', borderRadius: 8, marginBottom: '0.5rem',
  },
  avis: { fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' },
  section: { marginBottom: '1.25rem', padding: '1rem', background: '#fff', border: '1px solid #e2e2e2', borderRadius: 8 },
  titreSection: { fontSize: '1rem', margin: '0 0 0.75rem' },
  lignePoint: {
    display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center',
    gap: '0.5rem 1rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0',
  },
  libellePoint: { fontSize: '0.9rem' },
  widgetPoint: { display: 'flex', justifyContent: 'flex-end' },
  commentaire: {
    gridColumn: '1 / -1', padding: '0.4rem', borderRadius: 4, border: '1px solid #ddd', fontSize: '0.85rem',
  },
  boutonEchelle: {
    minWidth: 36, height: 32, padding: '0 0.5rem', borderRadius: 4, border: '1.5px solid', background: '#fff',
    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
  },
  blocAnomalie: { border: '1px solid #eee', borderRadius: 6, padding: '0.75rem', marginBottom: '0.5rem' },
  input: { padding: '0.4rem', borderRadius: 4, border: '1px solid #ccc' },
  boutonPrincipal: { padding: '0.6rem 1.2rem', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer' },
  boutonSecondaire: { padding: '0.5rem 1rem', borderRadius: 4, border: '1px solid #1a1a1a', background: '#fff', cursor: 'pointer' },
}
