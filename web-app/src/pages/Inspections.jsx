import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { theme, s, STATUT_INSPECTION } from '../styles/theme'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

const FILTRES_STATUT = [
  { value: '', label: 'Tous les statuts' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminee', label: 'Terminée' },
  { value: 'validee', label: 'Validée' },
  { value: 'archivee', label: 'Archivée' },
]

export default function Inspections() {
  const navigate = useNavigate()
  const [inspections, setInspections] = useState([])
  const [statutFiltre, setStatutFiltre] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  async function charger(statut) {
    setChargement(true)
    setErreur(null)
    try {
      const { data } = await apiClient.get('/inspections', { params: statut ? { statut } : {} })
      setInspections(data.data ?? data)
    } catch {
      setErreur('Erreur de chargement des inspections.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger(statutFiltre) }, [statutFiltre])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <p style={s.pageSubtitle}>{inspections.length} inspection(s)</p>
        <select value={statutFiltre} onChange={(e) => setStatutFiltre(e.target.value)} style={{ ...s.input, width: 200 }}>
          {FILTRES_STATUT.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      <div style={s.card}>
        {chargement ? (
          <p>Chargement…</p>
        ) : erreur ? (
          <p style={{ color: theme.colors.danger }}>{erreur}</p>
        ) : inspections.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Aucune inspection"
            description="Crée une inspection depuis la fiche d'un équipement pour la voir apparaître ici."
          />
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Équipement</th>
                <th style={s.th}>Client / Site</th>
                <th style={s.th}>Inspecteur</th>
                <th style={s.th}>Date</th>
                <th style={s.th}>Avis</th>
                <th style={s.th}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((insp) => {
                const statut = STATUT_INSPECTION[insp.statut] || STATUT_INSPECTION.en_cours
                return (
                  <tr key={insp.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/inspections/${insp.id}`)}>
                    <td style={s.td}>{insp.equipement?.type_equipement?.libelle}</td>
                    <td style={s.td}>{insp.equipement?.site?.client?.nom} — {insp.equipement?.site?.nom}</td>
                    <td style={s.td}>{insp.inspecteur?.nom}</td>
                    <td style={s.td}>{insp.date_inspection}</td>
                    <td style={{ ...s.td, maxWidth: 260, fontSize: '12px', color: theme.colors.textSecondary }}>
                      {insp.avis_propose || '—'}
                    </td>
                    <td style={s.td}><Badge variant={statut.variant}>{statut.label}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
