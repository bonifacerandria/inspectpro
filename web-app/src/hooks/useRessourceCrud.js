import { useCallback, useEffect, useState } from 'react'
import apiClient from '../api/client'

/**
 * Hook générique pour une ressource REST standard (index/store/update/destroy).
 * Réutilisé par toutes les pages d'administration (Clients, Équipements,
 * Types d'équipement...) pour ne pas dupliquer la logique de chargement,
 * de rafraîchissement et de gestion d'erreurs sur chaque écran CRUD.
 */
export function useRessourceCrud(endpoint) {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState(null)

  const charger = useCallback(async (params = {}) => {
    setChargement(true)
    setErreur(null)
    try {
      const { data } = await apiClient.get(endpoint, { params })
      // Laravel paginate() renvoie { data, current_page, last_page, total, ... }
      setItems(data.data ?? data)
      setPagination(data.data ? data : null)
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de chargement.')
    } finally {
      setChargement(false)
    }
  }, [endpoint])

  useEffect(() => {
    charger()
  }, [charger])

  async function creer(donnees) {
    const { data } = await apiClient.post(endpoint, donnees)
    await charger()
    return data
  }

  async function modifier(id, donnees) {
    const { data } = await apiClient.put(`${endpoint}/${id}`, donnees)
    await charger()
    return data
  }

  async function supprimer(id) {
    await apiClient.delete(`${endpoint}/${id}`)
    await charger()
  }

  return { items, pagination, chargement, erreur, charger, creer, modifier, supprimer }
}
