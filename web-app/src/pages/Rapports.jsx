import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { theme, s } from '../styles/theme'
import EmptyState from '../components/ui/EmptyState'

export default function Rapports() {
  const [rapports, setRapports] = useState([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [telechargementId, setTelechargementId] = useState(null)

  async function charger(q) {
    setChargement(true)
    setErreur(null)
    try {
      const { data } = await apiClient.get('/rapports', { params: q ? { recherche: q } : {} })
      setRapports(data.data ?? data)
    } catch {
      setErreur('Erreur de chargement des rapports.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => charger(recherche), 300) // debounce recherche
    return () => clearTimeout(t)
  }, [recherche])

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
      alert('Échec du téléchargement.')
    } finally {
      setTelechargementId(null)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <input
          placeholder="Rechercher par client..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ ...s.input, width: 280 }}
        />
      </div>

      <div style={s.card}>
        {chargement ? (
          <p>Chargement…</p>
        ) : erreur ? (
          <p style={{ color: theme.colors.danger }}>{erreur}</p>
        ) : rapports.length === 0 ? (
          <EmptyState
            icon="📄"
            title="Aucun rapport généré"
            description="Les rapports PDF apparaissent ici une fois une inspection validée et son rapport généré."
          />
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>N° rapport</th>
                <th style={s.th}>Client / Site</th>
                <th style={s.th}>Équipement</th>
                <th style={s.th}>Généré le</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {rapports.map((r) => (
                <tr key={r.id}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{r.numero_rapport}</td>
                  <td style={s.td}>
                    {r.inspection?.equipement?.site?.client?.nom} — {r.inspection?.equipement?.site?.nom}
                  </td>
                  <td style={s.td}>{r.inspection?.equipement?.type_equipement?.libelle}</td>
                  <td style={s.td}>{new Date(r.genere_le).toLocaleDateString('fr-FR')}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <button
                      onClick={() => telecharger(r)}
                      disabled={telechargementId === r.id}
                      style={s.btnGhost}
                    >
                      {telechargementId === r.id ? 'Téléchargement…' : '⬇ Télécharger'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
