import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { theme, s } from '../styles/theme'
import DataTable from '../components/ui/DataTable'
import { formatDate } from '../utils/date'
import { useAlert } from '../context/ConfirmContext'

export default function Rapports() {
  const alerter = useAlert()
  const [rapports, setRapports] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [telechargementId, setTelechargementId] = useState(null)

  async function charger() {
    setChargement(true)
    setErreur(null)
    try {
      const { data } = await apiClient.get('/rapports', { params: { per_page: 200 } })
      setRapports(data.data ?? data)
    } catch {
      setErreur('Erreur de chargement des rapports.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  async function telecharger(rapport) {
    setTelechargementId(rapport.id)
    try {
      const reponse = await apiClient.get(`/rapports/${rapport.id}/telecharger`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([reponse.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-${rapport.numero_rapport}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      await alerter({ message: 'Échec du téléchargement.' })
    } finally {
      setTelechargementId(null)
    }
  }

  const colonnes = [
    { key: 'numero_rapport', label: 'N° rapport', render: (r) => <span style={{ fontWeight: 600 }}>{r.numero_rapport}</span> },
    {
      key: 'client_site', label: 'Client / Site',
      accessor: (r) => `${r.inspection?.equipement?.site?.client?.nom} ${r.inspection?.equipement?.site?.nom}`,
      render: (r) => <>{r.inspection?.equipement?.site?.client?.nom} — {r.inspection?.equipement?.site?.nom}</>,
    },
    { key: 'equipement', label: 'Équipement', accessor: (r) => r.inspection?.equipement?.type_equipement?.libelle },
    { key: 'genere_le', label: 'Généré le', filterable: false, render: (r) => formatDate(r.genere_le) },
    {
      key: 'actions', label: '', sortable: false, filterable: false, align: 'right',
      render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); telecharger(r) }} disabled={telechargementId === r.id} style={s.btnGhost}>
          {telechargementId === r.id ? 'Téléchargement…' : '⬇ Télécharger'}
        </button>
      ),
    },
  ]

  return (
    <div>
      <p style={{ ...s.pageSubtitle, marginBottom: '18px' }}>{rapports.length} rapport(s) généré(s)</p>

      <div style={s.card}>
        {chargement ? (
          <p>Chargement…</p>
        ) : erreur ? (
          <p style={{ color: theme.colors.danger }}>{erreur}</p>
        ) : (
          <DataTable columns={colonnes} rows={rapports} texteVide="Aucun rapport généré pour l'instant." />
        )}
      </div>
    </div>
  )
}
