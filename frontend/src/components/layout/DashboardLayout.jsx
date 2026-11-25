import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { aiApi } from '../../api/ai';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'Recruiter') {
      aiApi
        .health()
        .then((res) => {
          if (res && res.configured === false) {
            setAiConfigured(false);
          } else {
            setAiConfigured(true);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-base">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="lg:pl-64">
        <Navbar onMenu={() => setDrawerOpen(true)} />
        <main key={location.pathname} className="mx-auto w-full max-w-[1280px] animate-page-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {!aiConfigured && !bannerDismissed && user?.role === 'Recruiter' && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-control border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="shrink-0" />
                <span>
                  <strong>Notice:</strong> Gemini API key is not configured in backend. Matching is running in deterministic keyword fallback mode. Set <code className="font-mono bg-warning/20 px-1 rounded">Gemini:ApiKey</code> in <code className="font-mono bg-warning/20 px-1 rounded">appsettings.json</code> to enable live Gemini embeddings.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="text-warning hover:text-white font-bold px-2 py-0.5 rounded hover:bg-warning/20"
                title="Dismiss notice"
              >
                ✕
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Standard page heading used by every dashboard screen. */
export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-accent-hover">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold sm:text-[28px] sm:leading-9">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
