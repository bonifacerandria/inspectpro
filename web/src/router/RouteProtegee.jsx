import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'

/** Enveloppe les routes nécessitant une connexion. */
export default function RouteProtegee() {
  const estConnecte = useAuthStore((state) => state.estConnecte())
  const location = useLocation()

  if (!estConnecte) {
    // On mémorise la page demandée pour y renvoyer l'utilisateur après login.
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
