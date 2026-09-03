import { theme } from '../../styles/theme'

export default function StatCard({ label, value, icon, accent = theme.colors.accent, sub }) {
  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={styles.label}>{label}</div>
          <div style={styles.value}>{value}</div>
          {sub && <div style={styles.sub}>{sub}</div>}
        </div>
        {icon && (
          <div style={{ ...styles.iconWrap, background: `${accent}1A`, color: accent }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: theme.colors.surface, borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadow.sm,
    padding: '20px 22px', flex: 1, minWidth: 180,
  },
  label: { fontSize: '13px', fontWeight: 600, color: theme.colors.textSecondary },
  value: { fontSize: '28px', fontWeight: 800, color: theme.colors.textPrimary, marginTop: '4px' },
  sub: { fontSize: '12px', color: theme.colors.textMuted, marginTop: '2px' },
  iconWrap: {
    width: 40, height: 40, borderRadius: theme.radius.md,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
  },
}
