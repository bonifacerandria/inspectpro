import { useEffect, useMemo, useState } from 'react'
import { theme } from '../../styles/theme'
import EmptyState from './EmptyState'

const TAILLES_PAGE = [5, 10, 20, 50, 100]

/**
 * Tableau générique avec tri (clic sur l'en-tête), filtre par colonne
 * (champ texte ou liste déroulante sous l'en-tête) et pagination (choix de
 * la taille de page). Tri/filtre/pagination se font côté client sur les
 * lignes déjà chargées — largement suffisant pour les volumes de données
 * de l'app (dizaines à quelques centaines de lignes).
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
 * taillePageDefaut?: 10 par défaut — nombre de lignes affichées initialement.
 */
export default function DataTable({ columns, rows, onRowClick, emptyState, texteVide, taillePageDefaut = 10 }) {
  const [triCle, setTriCle] = useState(null)
  const [triSens, setTriSens] = useState('asc')
  const [filtres, setFiltres] = useState({})
  const [taillePage, setTaillePage] = useState(taillePageDefaut)
  const [page, setPage] = useState(1)

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

  const totalPages = Math.max(1, Math.ceil(lignesTriees.length / taillePage))

  // Revenir à la page 1 si un filtre/tri change la taille des résultats et
  // que la page courante n'existe plus (ex: on était en page 4, un filtre
  // ne laisse plus que 2 pages).
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages, page])

  const lignesPage = useMemo(() => {
    const debut = (page - 1) * taillePage
    return lignesTriees.slice(debut, debut + taillePage)
  }, [lignesTriees, page, taillePage])

  const yAUnFiltreActif = Object.values(filtres).some(Boolean)

  if (rows.length === 0) {
    return emptyState || <EmptyState icon="📋" title={texteVide || 'Aucune donnée'} />
  }

  return (
    <div>
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
                      onChange={(e) => { setFiltres((f) => ({ ...f, [col.key]: e.target.value })); setPage(1) }}
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
                      onChange={(e) => { setFiltres((f) => ({ ...f, [col.key]: e.target.value })); setPage(1) }}
                      style={styles.filtreInput}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignesPage.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: theme.colors.textMuted, fontSize: '13px' }}>
                  Aucun résultat {yAUnFiltreActif ? 'pour ces filtres' : ''}.
                </td>
              </tr>
            ) : (
              lignesPage.map((row, i) => (
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

      {/* Barre de pagination */}
      <div style={styles.pagination}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: theme.colors.textSecondary }}>
          Afficher
          <select
            value={taillePage}
            onChange={(e) => { setTaillePage(Number(e.target.value)); setPage(1) }}
            style={styles.selectTaille}
          >
            {TAILLES_PAGE.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          par page · {lignesTriees.length} résultat(s)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => setPage(1)} disabled={page === 1} style={styles.boutonPage}>«</button>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={styles.boutonPage}>‹</button>
          <span style={{ fontSize: '12px', color: theme.colors.textSecondary, padding: '0 8px' }}>
            Page {page} / {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={styles.boutonPage}>›</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={styles.boutonPage}>»</button>
        </div>
      </div>
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
  pagination: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', borderTop: `1px solid ${theme.colors.border}`, flexWrap: 'wrap', gap: '10px',
  },
  selectTaille: {
    padding: '3px 6px', borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`, fontSize: '12px',
  },
  boutonPage: {
    width: 28, height: 28, borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`,
    background: theme.colors.surface, cursor: 'pointer', fontSize: '13px', color: theme.colors.textPrimary,
  },
}
