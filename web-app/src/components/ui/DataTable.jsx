import { useMemo, useState } from 'react'
import { theme } from '../../styles/theme'
import EmptyState from './EmptyState'

/**
 * Tableau générique avec tri (clic sur l'en-tête) et filtre par colonne
 * (champ texte ou liste déroulante sous l'en-tête). Le tri/filtre se fait
 * côté client sur les lignes déjà chargées — largement suffisant pour les
 * volumes de données de l'app (dizaines à quelques centaines de lignes).
 *
 * columns: [{
 *   key: string,                         // identifiant unique de colonne
 *   label: string,                       // libellé affiché
 *   accessor?: (row) => valeur brute,    // pour tri/filtre (par défaut row[key])
 *   render?: (row) => ReactNode,         // affichage personnalisé (badges...)
 *   sortable?: bool (défaut true),
 *   filterable?: bool (défaut true),
 *   filterType?: 'text' | 'select' (défaut 'text'),
 *   filterOptions?: [{ value, label }],  // requis si filterType = 'select'
 *   align?: 'left' | 'right',
 * }]
 */
export default function DataTable({ columns, rows, onRowClick, emptyState, texteVide }) {
  const [triCle, setTriCle] = useState(null)
  const [triSens, setTriSens] = useState('asc')
  const [filtres, setFiltres] = useState({})

  function accesseur(col, row) {
    return col.accessor ? col.accessor(row) : row[col.key]
  }

  function basculerTri(col) {
    if (col.sortable === false) return
    if (triCle === col.key) {
      setTriSens((s) => (s === 'asc' ? 'desc' : 'asc'))
    } else {
      setTriCle(col.key)
      setTriSens('asc')
    }
  }

  const lignesFiltrees = useMemo(() => {
    return rows.filter((row) =>
      columns.every((col) => {
        const val = filtres[col.key]
        if (!val) return true
        const brut = accesseur(col, row)
        if (col.filterType === 'select') {
          return String(brut ?? '') === String(val)
        }
        return String(brut ?? '').toLowerCase().includes(val.toLowerCase())
      })
    )
  }, [rows, filtres, columns])

  const lignesTriees = useMemo(() => {
    if (!triCle) return lignesFiltrees
    const col = columns.find((c) => c.key === triCle)
    if (!col) return lignesFiltrees
    const copie = [...lignesFiltrees]
    copie.sort((a, b) => {
      const va = accesseur(col, a)
      const vb = accesseur(col, b)
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return va - vb
      return String(va).localeCompare(String(vb), 'fr', { sensitivity: 'base' })
    })
    if (triSens === 'desc') copie.reverse()
    return copie
  }, [lignesFiltrees, triCle, triSens, columns])

  const yAUnFiltreActif = Object.values(filtres).some(Boolean)

  if (rows.length === 0) {
    return emptyState || <EmptyState icon="📋" title={texteVide || 'Aucune donnée'} />
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => basculerTri(col)}
                style={{
                  ...styles.th,
                  textAlign: col.align || 'left',
                  cursor: col.sortable === false ? 'default' : 'pointer',
                  userSelect: 'none',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {col.label}
                  {col.sortable !== false && (
                    <span style={{ fontSize: '10px', opacity: triCle === col.key ? 1 : 0.3 }}>
                      {triCle === col.key ? (triSens === 'asc' ? '▲' : '▼') : '▲▼'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={styles.thFiltre}>
                {col.filterable === false ? null : col.filterType === 'select' ? (
                  <select
                    value={filtres[col.key] || ''}
                    onChange={(e) => setFiltres((f) => ({ ...f, [col.key]: e.target.value }))}
                    style={styles.filtreInput}
                  >
                    <option value="">Tous</option>
                    {(col.filterOptions || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    placeholder="Filtrer..."
                    value={filtres[col.key] || ''}
                    onChange={(e) => setFiltres((f) => ({ ...f, [col.key]: e.target.value }))}
                    style={styles.filtreInput}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignesTriees.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: theme.colors.textMuted, fontSize: '13px' }}>
                Aucun résultat {yAUnFiltreActif ? 'pour ces filtres' : ''}.
              </td>
            </tr>
          ) : (
            lignesTriees.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ ...styles.td, textAlign: col.align || 'left' }}>
                    {col.render ? col.render(row) : (accesseur(col, row) ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  th: {
    padding: '10px 16px', fontSize: '12px', fontWeight: 700, color: theme.colors.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${theme.colors.border}`,
    whiteSpace: 'nowrap',
  },
  thFiltre: { padding: '6px 16px 10px', borderBottom: `1px solid ${theme.colors.border}` },
  filtreInput: {
    width: '100%', padding: '5px 8px', borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`, fontSize: '12px', background: theme.colors.surfaceAlt,
  },
  td: { padding: '14px 16px', fontSize: '14px', color: theme.colors.textPrimary, borderBottom: `1px solid ${theme.colors.border}` },
}
