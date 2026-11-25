import { NavLink } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  FileText,
  GitCompare,
  LayoutDashboard,
  LogOut,
  Search,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../utils/constants';

const NAV = {
  [ROLES.Recruiter]: [
    { to: '/recruiter', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/recruiter/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/recruiter/interviews', label: 'Interviews', icon: Calendar },
    { to: '/recruiter/talent-search', label: 'Talent Search', icon: Search },
    { to: '/recruiter/compare', label: 'Compare', icon: GitCompare },
  ],
  [ROLES.Candidate]: [
    { to: '/candidate', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/candidate/jobs', label: 'Browse Jobs', icon: Search },
    { to: '/candidate/applications', label: 'My Applications', icon: FileText },
    { to: '/candidate/profile', label: 'Profile', icon: UserRound },
  ],
};

export function Logo({ subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-control bg-accent/15 text-accent-hover ring-1 ring-accent/25">
        <Sparkles size={18} />
      </div>
      <div className="leading-tight">
        <div className="font-heading text-lg font-semibold text-white">
          Talent<span className="text-accent-hover">IQ</span>
        </div>
        {subtitle && <div className="micro-label text-accent-hover">{subtitle}</div>}
      </div>
    </div>
  );
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const items = NAV[user?.role] || [];
  const subtitle = user?.role === ROLES.Recruiter ? 'Recruiter Workspace' : 'Candidate Space';

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-[rgba(14,16,19,0.75)] backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo subtitle={subtitle} />
          <button
            type="button"
            className="focus-ring rounded-control p-1.5 text-muted hover:bg-raised hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          <p className="micro-label px-3 pb-2">Menu</p>
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `focus-ring flex items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-colors duration-150 ${
                  isActive
                    ? 'bg-raised font-medium text-accent-hover ring-1 ring-border'
                    : 'text-muted hover:bg-raised hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="m-3 flex items-center gap-3 rounded-card border border-border bg-raised p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent-hover">
            {initials(user?.name) || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => logout('You have been signed out.')}
            className="focus-ring rounded-control p-1.5 text-muted hover:bg-border hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
