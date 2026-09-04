import { createContext, useCallback, useContext, useState } from 'react'
import { theme } from '../styles/theme'

const ConfirmContext = createContext(null)

/**
 * Fournit une fonction confirmer({ titre, message, libelleConfirmer, danger })
 * qui renvoie une Promise<boolean> — remplace window.confirm() partout dans
 * l'app par une modale cohérente avec le design system.
 *
 * Usage : const ok = await confirmer({ titre: '...', message: '...' })
 */
export function ConfirmProvider({ children }) {
  const [etat, setEtat] = useState(null) // { titre, message, libelleConfirmer, danger, resolve }

  const confirmer = useCallback((options) => {
    return new Promise((resolve) => {
      setEtat({
        titre: options.titre || 'Confirmer',
        message: options.message || 'Es-tu sûr de vouloir continuer ?',
        libelleConfirmer: options.libelleConfirmer || 'Confirmer',
        danger: options.danger !== false, // rouge par défaut (la plupart des usages = suppression)
        resolve,
      })
    })
  }, [])

  function repondre(valeur) {
    etat?.resolve(valeur)
    setEtat(null)
  }

  return (
    <ConfirmContext.Provider value={confirmer}>
      {children}
      {etat && (
        <div style={styles.fond} onClick={() => repondre(false)}>
          <div style={styles.boite} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.icone, background: etat.danger ? theme.colors.dangerSoft : theme.colors.accentSoft }}>
              {etat.danger ? '🗑️' : '❓'}
            </div>
            <h3 style={styles.titre}>{etat.titre}</h3>
            <p style={styles.message}>{etat.message}</p>
            <div style={styles.actions}>
              <button onClick={() => repondre(false)} style={styles.btnAnnuler}>Annuler</button>
              <button
                onClick={() => repondre(true)}
                style={{ ...styles.btnConfirmer, background: etat.danger ? theme.colors.danger : theme.colors.accent }}
              >
                {etat.libelleConfirmer}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm() doit être utilisé sous <ConfirmProvider>')
  return ctx
}

const styles = {
  fond: {
    position: 'fixed', inset: 0, background: 'rgba(10, 22, 40, 0.55)', backdropFilter: 'blur(2px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px',
  },
  boite: {
    width: 380, maxWidth: '100%', background: theme.colors.surface, borderRadius: theme.radius.xl,
    boxShadow: theme.shadow.lg, padding: '28px', textAlign: 'center',
  },
  icone: {
    width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '22px', margin: '0 auto 16px',
  },
  titre: { margin: 0, fontSize: '17px', fontWeight: 800, color: theme.colors.textPrimary },
  message: { margin: '10px 0 0', fontSize: '14px', color: theme.colors.textSecondary, lineHeight: 1.5 },
  actions: { display: 'flex', gap: '10px', marginTop: '24px' },
  btnAnnuler: {
    flex: 1, padding: '11px', borderRadius: theme.radius.md, border: `1px solid ${theme.colors.borderStrong}`,
    background: theme.colors.surface, color: theme.colors.textPrimary, fontWeight: 700, fontSize: '14px', cursor: 'pointer',
  },
  btnConfirmer: {
    flex: 1, padding: '11px', borderRadius: theme.radius.md, border: 'none',
    color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
  },
}
