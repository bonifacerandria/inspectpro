import { theme } from '../../styles/theme'

export default function EmptyState({ icon = '📋', title, description, action }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.icon}>{icon}</div>
      <div style={styles.title}>{title}</div>
      {description && <div style={styles.desc}>{description}</div>}
      {action}
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    padding: '56px 24px', color: theme.colors.textSecondary,
  },
  icon: { fontSize: '32px', marginBottom: '12px' },
  title: { fontSize: '15px', fontWeight: 700, color: theme.colors.textPrimary },
  desc: { fontSize: '13px', marginTop: '4px', marginBottom: '16px', maxWidth: 360 },
}
