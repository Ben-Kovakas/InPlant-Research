/* ----------------------------------------------------------------------------
   App — router root for In-Planted / Climate-Resilient ATL.
   Dependency-free routing via AppContext.route:
     "login"  → role-select login
     "owner"  → Owner workspace (the core journey)
     "city"   → City / Mayor dashboard (Side-B)
     "dossier"→ printable Retrofit Action Dossier
---------------------------------------------------------------------------- */

import React from "react";
import { AppProvider, useApp } from "./state/AppContext.jsx";
import Login from "./views/Login.jsx";
import OwnerWorkspace from "./views/owner/OwnerWorkspace.jsx";
import CityDashboard from "./views/city/CityDashboard.jsx";
import Dossier from "./views/dossier/Dossier.jsx";

function Router() {
  const { route, session } = useApp();

  // Guard: anything but login requires a session.
  if (!session) return <Login />;

  switch (route) {
    case "owner":
      return <OwnerWorkspace />;
    case "city":
      return <CityDashboard />;
    case "dossier":
      return <Dossier />;
    case "login":
      return <Login />;
    default:
      return session.role === "city" ? <CityDashboard /> : <OwnerWorkspace />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
