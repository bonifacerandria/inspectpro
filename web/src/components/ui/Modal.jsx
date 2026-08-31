export default function Modal({ titre, onFermer, children }) {
  return (
    <div style={styles.fond} onClick={onFermer}>
      <div style={styles.boite} onClick={(e) => e.stopPropagation()}>
        <div style={styles.entete}>
          <h2 style={styles.titre}>{titre}</h2>
          <button onClick={onFermer} style={styles.fermer} aria-label="Fermer">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const styles = {
  fond: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
  },
  boite: {
    width: 420, maxWidth: '90vw', background: '#fff', borderRadius: 8,
    padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto',
  },
  entete: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  titre: { margin: 0, fontSize: '1.1rem' },
  fermer: { border: 'none', background: 'none', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 },
}
