// Système de design InspectPro — palette bleu foncé, esthétique SaaS 2026.
// Toutes les pages importent ces tokens plutôt que de coder des couleurs en dur.

export const theme = {
  colors: {
    // Bleu foncé (identité visuelle)
    navy900: '#0A1628',
    navy800: '#0F1F38',
    navy700: '#152A4A',
    navy600: '#1C3A61',
    navy500: '#25507F',

    // Accent (actions, liens, focus)
    accent: '#2563EB',
    accentHover: '#1D4ED8',
    accentSoft: '#EFF4FF',

    // Fond & surfaces
    bgPage: '#F4F6FB',
    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFD',
    border: '#E4E9F2',
    borderStrong: '#CBD5E5',

    // Texte
    textPrimary: '#101828',
    textSecondary: '#5B6472',
    textMuted: '#8A93A2',
    textOnDark: '#E7ECF7',
    textOnDarkMuted: '#93A0BD',

    // États / sémantique (repris de l'échelle C/O/NC/DM/DI)
    success: '#16A34A',
    successSoft: '#E9F9EF',
    warning: '#D97706',
    warningSoft: '#FDF3E3',
    danger: '#DC2626',
    dangerSoft: '#FDECEC',
    dangerStrong: '#7A1212',
    neutral: '#8A93A2',
    neutralSoft: '#F1F3F7',
  },

  radius: { sm: '6px', md: '10px', lg: '14px', xl: '20px', pill: '999px' },

  shadow: {
    sm: '0 1px 2px rgba(16, 24, 40, 0.06)',
    md: '0 4px 12px rgba(16, 24, 40, 0.08)',
    lg: '0 12px 32px rgba(16, 24, 40, 0.12)',
    navy: '0 8px 24px rgba(10, 22, 40, 0.25)',
  },

  font: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  space: (n) => `${n * 4}px`,
}

// --- Styles réutilisables (boutons, inputs, cartes) ---
export const s = {
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '10px 18px', borderRadius: theme.radius.md, border: 'none',
    background: theme.colors.accent, color: '#fff', fontWeight: 600, fontSize: '14px',
    cursor: 'pointer', transition: 'background 0.15s ease',
    boxShadow: theme.shadow.sm,
  },
  btnSecondary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '10px 18px', borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.borderStrong}`, background: theme.colors.surface,
    color: theme.colors.textPrimary, fontWeight: 600, fontSize: '14px', cursor: 'pointer',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 10px', borderRadius: theme.radius.sm, border: 'none',
    background: 'transparent', color: theme.colors.accent, fontWeight: 600,
    fontSize: '13px', cursor: 'pointer',
  },
  btnDanger: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 10px', borderRadius: theme.radius.sm, border: 'none',
    background: 'transparent', color: theme.colors.danger, fontWeight: 600,
    fontSize: '13px', cursor: 'pointer',
  },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.borderStrong}`, fontSize: '14px',
    color: theme.colors.textPrimary, background: theme.colors.surface,
    outline: 'none', fontFamily: theme.font.family,
  },
  label: {
    display: 'flex', flexDirection: 'column', gap: '6px',
    fontSize: '13px', fontWeight: 600, color: theme.colors.textSecondary,
  },
  card: {
    background: theme.colors.surface, borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadow.sm,
    padding: '24px',
  },
  pageTitle: {
    fontSize: '22px', fontWeight: 700, color: theme.colors.textPrimary, margin: 0,
    letterSpacing: '-0.01em',
  },
  pageSubtitle: {
    fontSize: '14px', color: theme.colors.textSecondary, margin: '4px 0 0',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '10px 16px', fontSize: '12px', fontWeight: 700,
    color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em',
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  td: {
    padding: '14px 16px', fontSize: '14px', color: theme.colors.textPrimary,
    borderBottom: `1px solid ${theme.colors.border}`,
  },
}

export function badgeStyle(variant) {
  const map = {
    success: { bg: theme.colors.successSoft, fg: theme.colors.success },
    warning: { bg: theme.colors.warningSoft, fg: theme.colors.warning },
    danger: { bg: theme.colors.dangerSoft, fg: theme.colors.danger },
    dangerStrong: { bg: theme.colors.dangerSoft, fg: theme.colors.dangerStrong },
    neutral: { bg: theme.colors.neutralSoft, fg: theme.colors.textSecondary },
    accent: { bg: theme.colors.accentSoft, fg: theme.colors.accent },
  }
  const c = map[variant] || map.neutral
  return {
    display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
    borderRadius: theme.radius.pill, fontSize: '12px', fontWeight: 700,
    background: c.bg, color: c.fg,
  }
}

// Statut d'inspection -> variant de badge + libellé FR
export const STATUT_INSPECTION = {
  en_cours: { label: 'En cours', variant: 'warning' },
  terminee: { label: 'Terminée', variant: 'accent' },
  validee: { label: 'Validée', variant: 'success' },
  archivee: { label: 'Archivée', variant: 'neutral' },
}

// Statut de contrôle (C/O/NC/DM/DI/NA) -> couleur
export const STATUT_CONTROLE = {
  C: { fg: '#16A34A', label: 'Conforme' },
  O: { fg: '#D97706', label: 'Observation' },
  NC: { fg: '#EA580C', label: 'Non conforme' },
  DM: { fg: '#DC2626', label: 'Défaut majeur' },
  DI: { fg: '#7A1212', label: 'Danger immédiat' },
  NA: { fg: '#8A93A2', label: 'Non applicable' },
}
