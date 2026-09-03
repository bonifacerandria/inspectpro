import { theme } from '../../styles/theme'

export default function Modal({ titre, onFermer, children, width = 440 }) {
  return (
    <div style={styles.fond} onClick={onFermer}>
      <div style={{ ...styles.boite, width }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.entete}>
          <h2 style={styles.titre}>{titre}</h2>
          <button onClick={onFermer} style={styles.fermer} aria-label="Fermer">×</button>
        </div>
        <div style={styles.corps}>{children}</div>
      </div>
    </div>
  )
}

const styles = {
  fond: {
    position: 'fixed', inset: 0, background: 'rgba(10, 22, 40, 0.55)',
    backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 50, padding: '20px',
  },
  boite: {
    maxWidth: '92vw', background: theme.colors.surface, borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.lg, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
  },
  entete: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: `1px solid ${theme.colors.border}`,
  },
  titre: { margin: 0, fontSize: '16px', fontWeight: 700, color: theme.colors.textPrimary },
  fermer: {
    border: 'none', background: theme.colors.neutralSoft, color: theme.colors.textSecondary,
    width: 28, height: 28, borderRadius: '50%', fontSize: '16px', cursor: 'pointer', lineHeight: 1,
  },
  corps: { padding: '22px 24px', overflowY: 'auto' },
}
