import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { theme, s, STATUT_INSPECTION } from '../styles/theme'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentes, setRecentes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    async function charger() {
      try {
        const [{ data: statsData }, { data: inspData }] = await Promise.all([
          apiClient.get('/statistiques'),
          apiClient.get('/inspections'),
        ])
        setStats(statsData)
        setRecentes((inspData.data ?? inspData).slice(0, 6))
      } catch {
        setErreur('Erreur de chargement du tableau de bord.')
      } finally {
        setChargement(false)
      }
    }
    charger()
  }, [])

  if (chargement) return <p>Chargement…</p>
  if (erreur) return <p style={{ color: theme.colors.danger }}>{erreur}</p>

  return (
    <div>
      {/* Cartes statistiques */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <StatCard label="Clients" value={stats.nb_clients} icon="🏢" />
        <StatCard label="Équipements" value={stats.nb_equipements} icon="⚙️" accent={theme.colors.navy500} />
        <StatCard label="Inspections en cours" value={stats.nb_inspections_en_cours} icon="🔍" accent={theme.colors.warning} />
        <StatCard label="Inspections validées" value={stats.nb_inspections_validees} icon="✅" accent={theme.colors.success} />
        <StatCard
          label="Anomalies ouvertes"
          value={stats.nb_anomalies_ouvertes}
          icon="⚠️"
          accent={theme.colors.danger}
          sub={stats.nb_dangers_immediats_ouverts > 0 ? `${stats.nb_dangers_immediats_ouverts} danger(s) immédiat(s)` : undefined}
        />
      </div>

      {/* Alerte danger immédiat, si applicable */}
      {stats.nb_dangers_immediats_ouverts > 0 && (
        <div style={styles.alerte}>
          <span style={{ fontSize: '18px' }}>🚨</span>
          <div>
            <strong>{stats.nb_dangers_immediats_ouverts} anomalie(s) "danger immédiat"</strong> en attente de traitement.
            <Link to="/inspections" style={{ marginLeft: '8px', color: theme.colors.dangerStrong, fontWeight: 700 }}>
              Voir les inspections →
            </Link>
          </div>
        </div>
      )}

      {/* Inspections récentes */}
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Inspections récentes</h2>
          <Link to="/inspections" style={{ fontSize: '13px', fontWeight: 600, color: theme.colors.accent }}>
            Tout voir →
          </Link>
        </div>

        {recentes.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Aucune inspection pour l'instant"
            description="Les inspections créées depuis un équipement apparaîtront ici."
          />
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Équipement</th>
                <th style={s.th}>Client</th>
                <th style={s.th}>Inspecteur</th>
                <th style={s.th}>Date</th>
                <th style={s.th}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentes.map((insp) => {
                const statut = STATUT_INSPECTION[insp.statut] || STATUT_INSPECTION.en_cours
                return (
                  <tr
                    key={insp.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/inspections/${insp.id}`)}
                  >
                    <td style={s.td}>{insp.equipement?.type_equipement?.libelle}</td>
                    <td style={s.td}>{insp.equipement?.site?.client?.nom}</td>
                    <td style={s.td}>{insp.inspecteur?.nom}</td>
                    <td style={s.td}>{insp.date_inspection}</td>
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

const styles = {
  alerte: {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: theme.colors.dangerSoft, border: `1px solid #F3B9B9`,
    borderRadius: theme.radius.md, padding: '14px 18px', marginBottom: '20px',
    fontSize: '13px', color: theme.colors.dangerStrong,
  },
}
