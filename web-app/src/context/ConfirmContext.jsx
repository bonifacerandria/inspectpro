import { createContext, useCallback, useContext, useState } from 'react'
import { theme } from '../styles/theme'

const ConfirmContext = createContext(null)

/**
 * Fournit deux fonctions qui remplacent window.confirm() et window.alert()
 * par des modales cohérentes avec le design system :
 *   - confirmer({ titre, message, libelleConfirmer, danger }) -> Promise<boolean>
 *   - alerter({ titre, message, type: 'erreur'|'info'|'succes' })  -> Promise<void>
 */
export function ConfirmProvider({ children }) {
  const [dialogueConfirm, setDialogueConfirm] = useState(null) // { titre, message, libelleConfirmer, danger, resolve }
  const [dialogueAlerte, setDialogueAlerte] = useState(null) // { titre, message, type, resolve }

  const confirmer = useCallback((options) => {
    return new Promise((resolve) => {
      setDialogueConfirm({
        titre: options.titre || 'Confirmer',
        message: options.message || 'Es-tu sûr de vouloir continuer ?',
        libelleConfirmer: options.libelleConfirmer || 'Confirmer',
        danger: options.danger !== false, // rouge par défaut (la plupart des usages = suppression)
        resolve,
      })
    })
  }, [])

  const alerter = useCallback((options) => {
    // Accepte aussi un simple string, pour remplacer alert('...') telle quelle.
    const opts = typeof options === 'string' ? { message: options } : options
    return new Promise((resolve) => {
      setDialogueAlerte({
        titre: opts.titre || (opts.type === 'erreur' ? 'Une erreur est survenue' : 'Information'),
        message: opts.message || '',
        type: opts.type || 'erreur', // 'erreur' | 'info' | 'succes'
        resolve,
      })
    })
  }, [])

  function repondreConfirm(valeur) {
    dialogueConfirm?.resolve(valeur)
    setDialogueConfirm(null)
  }

  function fermerAlerte() {
    dialogueAlerte?.resolve()
    setDialogueAlerte(null)
  }

  const ICONES = { erreur: '⚠️', info: 'ℹ️', succes: '✅' }
  const COULEURS = {
    erreur: theme.colors.dangerSoft, info: theme.colors.accentSoft, succes: theme.colors.successSoft,
  }

  return (
    <ConfirmContext.Provider value={{ confirmer, alerter }}>
      {children}

      {dialogueConfirm && (
        <div style={styles.fond} onClick={() => repondreConfirm(false)}>
          <div style={styles.boite} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.icone, background: dialogueConfirm.danger ? theme.colors.dangerSoft : theme.colors.accentSoft }}>
              {dialogueConfirm.danger ? '🗑️' : '❓'}
            </div>
            <h3 style={styles.titre}>{dialogueConfirm.titre}</h3>
            <p style={styles.message}>{dialogueConfirm.message}</p>
            <div style={styles.actions}>
              <button onClick={() => repondreConfirm(false)} style={styles.btnAnnuler}>Annuler</button>
              <button
                onClick={() => repondreConfirm(true)}
                style={{ ...styles.btnConfirmer, background: dialogueConfirm.danger ? theme.colors.danger : theme.colors.accent }}
              >
                {dialogueConfirm.libelleConfirmer}
              </button>
            </div>
          </div>
        </div>
      )}

      {dialogueAlerte && (
        <div style={styles.fond} onClick={fermerAlerte}>
          <div style={styles.boite} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.icone, background: COULEURS[dialogueAlerte.type] }}>
              {ICONES[dialogueAlerte.type]}
            </div>
            <h3 style={styles.titre}>{dialogueAlerte.titre}</h3>
            <p style={styles.message}>{dialogueAlerte.message}</p>
            <div style={styles.actions}>
              <button onClick={fermerAlerte} style={{ ...styles.btnConfirmer, background: theme.colors.accent }}>
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

/** Renvoie { confirmer, alerter } — remplace window.confirm()/window.alert() partout dans l'app. */
export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm() doit être utilisé sous <ConfirmProvider>')
  return ctx.confirmer
}

export function useAlert() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useAlert() doit être utilisé sous <ConfirmProvider>')
  return ctx.alerter
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
