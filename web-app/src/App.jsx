import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfirmProvider } from './context/ConfirmContext'
import RouteProtegee from './router/RouteProtegee'
import LayoutPrincipal from './components/layout/LayoutPrincipal'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Sites from './pages/Sites'
import Utilisateurs from './pages/Utilisateurs'
import Equipements from './pages/Equipements'
import TypesEquipement from './pages/TypesEquipement'
import PointsControle from './pages/PointsControle'
import Inspections from './pages/Inspections'
import InspectionDetail from './pages/InspectionDetail'
import Rapports from './pages/Rapports'
import Statistiques from './pages/Statistiques'

export default function App() {
  return (
    <ConfirmProvider>
      <BrowserRouter>
        <Routes>
          {/* Route publique */}
          <Route path="/login" element={<Login />} />

          {/* Routes protégées, avec layout commun (sidebar) */}
          <Route element={<RouteProtegee />}>
            <Route element={<LayoutPrincipal />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/equipements" element={<Equipements />} />
              <Route path="/types-equipement" element={<TypesEquipement />} />
              <Route path="/types-equipement/:typeId/points-controle" element={<PointsControle />} />
              <Route path="/inspections" element={<Inspections />} />
              <Route path="/inspections/:inspectionId" element={<InspectionDetail />} />
              <Route path="/rapports" element={<Rapports />} />
              <Route path="/statistiques" element={<Statistiques />} />

              {/* Paramètres */}
              <Route path="/parametres/sites" element={<Sites />} />
              <Route path="/parametres/utilisateurs" element={<Utilisateurs />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfirmProvider>
  )
}
