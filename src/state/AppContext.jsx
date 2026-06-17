/* ----------------------------------------------------------------------------
   AppContext — the single shared store + the dependency-free router.

   Holds: session (role), current route, the active intervention set, the sun
   time, and selected package. Persists the owner's toggle config per-user via
   the mock API (Q25). Navigation is plain state (no react-router dependency) —
   routes: "login" | "owner" | "city" | "dossier".
---------------------------------------------------------------------------- */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSession, login as apiLogin, logout as apiLogout, saveConfig, loadConfig } from "../api/mockApi.js";
import { PACKAGE_BY_ID, DEFAULT_PACKAGE_ID, matchPackage } from "../engine/packages.js";

const AppCtx = createContext(null);

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export function AppProvider({ children }) {
  const [session, setSession] = useState(() => getSession());
  const [route, setRoute] = useState(() => {
    const s = getSession();
    return s ? (s.role === "city" ? "city" : "owner") : "login";
  });

  // Owner working state — seeded from the recommended package (B), then from
  // any saved per-user config.
  const [activeKeys, setActiveKeys] = useState(
    () => [...PACKAGE_BY_ID[DEFAULT_PACKAGE_ID].activeKeys]
  );
  const [sunT, setSunT] = useState(0.5);

  // Hydrate saved owner config once a session exists.
  useEffect(() => {
    if (session?.userId) {
      const cfg = loadConfig(session.userId);
      if (cfg?.activeKeys) setActiveKeys(cfg.activeKeys);
      if (typeof cfg?.sunT === "number") setSunT(cfg.sunT);
    }
  }, [session?.userId]);

  // Persist owner config on change.
  useEffect(() => {
    if (session?.userId === "selig-ent") {
      saveConfig(session.userId, { activeKeys, sunT });
    }
  }, [session?.userId, activeKeys, sunT]);

  const navigate = (to) => setRoute(to);

  async function login(role) {
    const user = await apiLogin(role);
    setSession(user);
    setRoute(role === "city" ? "city" : "owner");
    return user;
  }

  function logout() {
    apiLogout();
    setSession(null);
    setRoute("login");
  }

  function toggleKey(key) {
    setActiveKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function applyPackage(packageId) {
    const pkg = PACKAGE_BY_ID[packageId];
    if (pkg) setActiveKeys([...pkg.activeKeys]);
  }

  const packageId = useMemo(() => matchPackage(activeKeys), [activeKeys]);

  const value = {
    session,
    route,
    navigate,
    login,
    logout,
    // owner working state
    activeKeys,
    setActiveKeys,
    toggleKey,
    applyPackage,
    packageId,
    sunT,
    setSunT,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
