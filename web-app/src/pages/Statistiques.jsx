import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { theme, s } from '../styles/theme'
import StatCard from '../components/ui/StatCard'

const LIBELLES_GRAVITE = {
  observation: 'Observation', anomalie: 'Anomalie',
  defaut_majeur: 'Défaut majeur', danger_immediat: 'Danger immédiat',
}
const COULEURS_GRAVITE = {
  observation: theme.colors.warning, anomalie: '#EA580C',
  defaut_majeur: theme.colors.danger, danger_immediat: theme.colors.dangerStrong,
}

export default function Statistiques() {
  const [stats, setStats] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    apiClient.get('/statistiques')
      .then(({ data }) => setStats(data))
      .finally(() => setChargement(false))
  }, [])

  if (chargement) return <p>Chargement…</p>
  if (!stats) return <p style={{ color: theme.colors.danger }}>Erreur de chargement.</p>

  const totalAnomalies = Object.values(stats.anomalies_par_gravite || {}).reduce((a, b) => a + b, 0) || 1
  const totalMois = Object.values(stats.inspections_par_mois || {});
  const maxMois = Math.max(1, ...totalMois);

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <StatCard label="Total inspections" value={stats.nb_inspections_total} icon="🔍" />
        <StatCard label="Équipements suivis" value={stats.nb_equipements} icon="⚙️" accent={theme.colors.navy500} />
        <StatCard label="Anomalies ouvertes" value={stats.nb_anomalies_ouvertes} icon="⚠️" accent={theme.colors.danger} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Inspections par mois */}
        <div style={s.card}>
          <h2 style={styles.titre}>Inspections réalisées (6 derniers mois)</h2>
          {totalMois.length === 0 ? (
            <p style={{ color: theme.colors.textMuted, fontSize: '13px' }}>Pas encore de données.</p>
          ) : (
            <div style={styles.barresMois}>
              {Object.entries(stats.inspections_par_mois).map(([mois, total]) => (
                <div key={mois} style={styles.colonneMois}>
                  <div style={styles.barreValeur}>{total}</div>
                  <div style={{ ...styles.barre, height: `${(total / maxMois) * 100}px` }} />
                  <div style={styles.moisLabel}>{mois.slice(5)}/{mois.slice(2, 4)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anomalies par gravité */}
        <div style={s.card}>
          <h2 style={styles.titre}>Anomalies par gravité</h2>
          {totalAnomalies <= 1 && !stats.anomalies_par_gravite?.observation ? (
            <p style={{ color: theme.colors.textMuted, fontSize: '13px' }}>Aucune anomalie enregistrée.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(LIBELLES_GRAVITE).map(([cle, label]) => {
                const valeur = stats.anomalies_par_gravite?.[cle] || 0
                const pourcent = Math.round((valeur / totalAnomalies) * 100)
                return (
                  <div key={cle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ color: theme.colors.textSecondary }}>{label}</span>
                      <strong>{valeur}</strong>
                    </div>
                    <div style={styles.jaugeFond}>
                      <div style={{ ...styles.jaugeValeur, width: `${pourcent}%`, background: COULEURS_GRAVITE[cle] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  titre: { fontSize: '14px', fontWeight: 700, margin: '0 0 16px' },
  barresMois: { display: 'flex', alignItems: 'flex-end', gap: '18px', height: 140, paddingTop: '10px' },
  colonneMois: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 },
  barreValeur: { fontSize: '12px', fontWeight: 700, color: theme.colors.textPrimary },
  barre: { width: '100%', maxWidth: 34, background: theme.colors.accent, borderRadius: '6px 6px 0 0', minHeight: 4 },
  moisLabel: { fontSize: '11px', color: theme.colors.textMuted },
  jaugeFond: { height: 8, borderRadius: theme.radius.pill, background: theme.colors.neutralSoft, overflow: 'hidden' },
  jaugeValeur: { height: '100%', borderRadius: theme.radius.pill },
}
