import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Modal from '../components/ui/Modal'
import DataTable from '../components/ui/DataTable'
import { theme, s } from '../styles/theme'
import { useConfirm, useAlert } from '../context/ConfirmContext'
import { useAuthStore } from '../context/authStore'

const FAMILLE_VIDE = { code: '', libelle: '', titre_rapport: '', ordre: 0 }

export default function FamillesEquipement() {
  const confirmer = useConfirm()
  const alerter = useAlert()
  const moi = useAuthStore((state) => state.user)

  const [familles, setFamilles] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [familleEnEdition, setFamilleEnEdition] = useState(null)
  const [formulaire, setFormulaire] = useState(FAMILLE_VIDE)
  const [erreurFormulaire, setErreurFormulaire] = useState(null)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  async function charger() {
    setChargement(true)
    setErreur(null)
    try {
      const { data } = await apiClient.get('/familles-equipement')
      setFamilles(data)
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de chargement.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  function ouvrirCreation() {
    setFamilleEnEdition(null)
    setFormulaire({ ...FAMILLE_VIDE, ordre: familles.length + 1 })
    setErreurFormulaire(null)
    setModaleOuverte(true)
  }

  function ouvrirEdition(famille) {
    setFamilleEnEdition(famille)
    setFormulaire({
      code: famille.code, libelle: famille.libelle,
      titre_rapport: famille.titre_rapport || '', ordre: famille.ordre,
    })
    setErreurFormulaire(null)
    setModaleOuverte(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEnvoiEnCours(true)
    setErreurFormulaire(null)
    try {
      const payload = { ...formulaire, code: formulaire.code.toUpperCase().replace(/\s+/g, '_'), ordre: Number(formulaire.ordre) || 0 }
      if (familleEnEdition) await apiClient.put(`/familles-equipement/${familleEnEdition.id}`, payload)
      else await apiClient.post('/familles-equipement', payload)
      setModaleOuverte(false)
      await charger()
    } catch (err) {
      const messages = err.response?.data?.errors
      setErreurFormulaire(messages ? Object.values(messages).flat().join(' ') : "Échec de l'enregistrement.")
    } finally {
      setEnvoiEnCours(false)
    }
  }

  async function handleSupprimer(famille) {
    const ok = await confirmer({
      titre: 'Supprimer cette famille ?',
      message: `"${famille.libelle}" sera définitivement supprimée. Impossible si des types d'équipement l'utilisent encore.`,
      libelleConfirmer: 'Supprimer',
    })
    if (!ok) return
    try {
      await apiClient.delete(`/familles-equipement/${famille.id}`)
      await charger()
    } catch (err) {
      await alerter({ message: err.response?.data?.message || 'Suppression impossible.' })
    }
  }

  if (moi && moi.role !== 'admin') {
    return <p style={{ color: theme.colors.danger }}>Accès réservé aux administrateurs.</p>
  }

  const colonnes = [
    { key: 'ordre', label: 'Ordre', align: 'right' },
    { key: 'libelle', label: 'Famille', render: (f) => <span style={{ fontWeight: 600 }}>{f.libelle}</span> },
    { key: 'code', label: 'Code' },
    { key: 'titre_rapport', label: 'Titre dans le rapport PDF', render: (f) => f.titre_rapport || <span style={{ color: theme.colors.textMuted }}>— (par défaut : "ÉQUIPEMENTS DE LEVAGE")</span> },
    {
      key: 'actions', label: '', sortable: false, filterable: false, align: 'right',
      render: (f) => (
        <>
          <button onClick={() => ouvrirEdition(f)} style={s.btnGhost}>Modifier</button>
          <button onClick={() => handleSupprimer(f)} style={s.btnDanger}>Supprimer</button>
        </>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <p style={s.pageSubtitle}>
          Une famille de plus ici apparaît automatiquement dans le choix de famille à la création d'un type d'équipement, et son "titre dans le rapport" s'applique à l'en-tête du PDF pour tous ses types.
        </p>
        <button onClick={ouvrirCreation} style={s.btnPrimary}>+ Nouvelle famille</button>
      </div>

      {chargement ? (
        <p>Chargement…</p>
      ) : erreur ? (
        <p style={{ color: theme.colors.danger }}>{erreur}</p>
      ) : (
        <div style={s.card}>
          <DataTable columns={colonnes} rows={familles} texteVide="Aucune famille" taillePageDefaut={20} />
        </div>
      )}

      {modaleOuverte && (
        <Modal titre={familleEnEdition ? 'Modifier la famille' : 'Nouvelle famille'} onFermer={() => setModaleOuverte(false)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={s.label}>
              Libellé
              <input
                value={formulaire.libelle}
                onChange={(e) => setFormulaire({ ...formulaire, libelle: e.target.value })}
                placeholder="Ex : Équipements motorisés"
                required style={s.input}
              />
            </label>
            <label style={s.label}>
              Code (identifiant technique)
              <input
                value={formulaire.code}
                onChange={(e) => setFormulaire({ ...formulaire, code: e.target.value.toUpperCase() })}
                placeholder="Ex : MOTORISES"
                required style={s.input}
              />
            </label>
            <label style={s.label}>
              Titre affiché dans l'en-tête du rapport PDF
              <input
                value={formulaire.titre_rapport}
                onChange={(e) => setFormulaire({ ...formulaire, titre_rapport: e.target.value })}
                placeholder='Ex : "ÉQUIPEMENTS DE LEVAGE MOTORISÉS" — laisser vide pour la valeur par défaut'
                style={s.input}
              />
            </label>
            <label style={s.label}>
              Ordre d'affichage
              <input
                type="number" value={formulaire.ordre}
                onChange={(e) => setFormulaire({ ...formulaire, ordre: e.target.value })}
                style={s.input}
              />
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
