import { ReactNode, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Registration } from "./pages/Registration";
import { DataEntry } from "./pages/DataEntry";
import { Leaderboard } from "./pages/Leaderboard";
import { Admin } from "./pages/Admin";
import { Auth } from "./pages/Auth";
import { Raffle } from "./pages/Raffle";
import { useFirebaseSync } from "./lib/firebase-sync";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useStore } from "./store";

function SyncWrapper({ children }: { children: ReactNode }) {
  useFirebaseSync();
  const { setUser, setAuthLoading } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setAuthLoading]);

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, authLoading } = useStore();
  const location = useLocation();
  const hasNotion = !!localStorage.getItem("notion_config");

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-3 border-[var(--color-ares-teal)] border-t-transparent rounded-full animate-spin" />
        <p className="text-white text-xs font-mono tracking-widest animate-pulse">CHECKING AUTHENTICATION...</p>
      </div>
    );
  }

  if (!user && !hasNotion) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <SyncWrapper>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/entry" element={<DataEntry />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/raffle" 
              element={
                <ProtectedRoute>
                  <Raffle />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </SyncWrapper>
    </BrowserRouter>
  );
}
