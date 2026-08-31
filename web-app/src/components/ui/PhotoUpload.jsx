import { useState } from 'react'
import apiClient from '../../api/client'

/**
 * Zone d'upload + galerie miniature réutilisable, branchée sur l'endpoint
 * générique POST /photos. `photographiableType`/`photographiableId`
 * définissent où la photo se rattache (anomalie, photo_obligatoire,
 * reponse_controle...).
 */
export default function PhotoUpload({
  inspectionId,
  photographiableType,
  photographiableId,
  libelle,
  photos = [],
  onChange,
}) {
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  async function handleFichier(e) {
    const fichier = e.target.files?.[0]
    if (!fichier) return

    setEnvoiEnCours(true)
    const formData = new FormData()
    formData.append('photo', fichier)
    formData.append('inspection_id', inspectionId)
    formData.append('photographiable_type', photographiableType)
    formData.append('photographiable_id', photographiableId)
    if (libelle) formData.append('libelle', libelle)

    try {
      const { data } = await apiClient.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange?.([...photos, data])
    } catch (err) {
      alert(err.response?.data?.message || "Échec de l'upload de la photo.")
    } finally {
      setEnvoiEnCours(false)
      e.target.value = ''
    }
  }

  async function handleSupprimer(photo) {
    if (!confirm('Supprimer cette photo ?')) return
    try {
      await apiClient.delete(`/photos/${photo.id}`)
      onChange?.(photos.filter((p) => p.id !== photo.id))
    } catch {
      alert('Suppression impossible.')
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      {photos.map((photo) => (
        <div key={photo.id} style={styles.miniature}>
          <img src={photo.url} alt={photo.numero} style={styles.image} />
          <button onClick={() => handleSupprimer(photo)} style={styles.boutonSupprimer} title="Supprimer">
            ×
          </button>
        </div>
      ))}

      <label style={styles.boutonAjout}>
        {envoiEnCours ? '…' : '📷 +'}
        <input type="file" accept="image/*" onChange={handleFichier} disabled={envoiEnCours} style={{ display: 'none' }} />
      </label>
    </div>
  )
}

const styles = {
  miniature: { position: 'relative', width: 56, height: 56 },
  image: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' },
  boutonSupprimer: {
    position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%',
    border: 'none', background: '#c0392b', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', lineHeight: 1,
  },
  boutonAjout: {
    width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px dashed #ccc', borderRadius: 4, cursor: 'pointer', fontSize: '0.9rem', color: '#666',
  },
}
