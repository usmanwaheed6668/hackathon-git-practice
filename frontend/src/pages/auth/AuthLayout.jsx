import { BadgeCheck, ScanSearch, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Logo } from '../../components/layout/Sidebar.jsx';
import { ROLES } from '../../utils/constants';

const FEATURES = [
  {
    icon: ScanSearch,
    title: 'Evidence-based matching',
    text: 'Candidates are compared to job requirements using the skills and projects they can actually show.',
  },
  {
    icon: BadgeCheck,
    title: 'Explainable results',
    text: 'Every assessment explains which requirements were met and which evidence is missing.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Human in the loop',
    text: 'Recruiters stay in control of every stage decision.',
  },
];

/** Split layout shared by Login and Register (from the Stitch sign-in design). */
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-0 sm:p-6 lg:p-10">
      <div className="grid w-full max-w-6xl animate-page-in overflow-hidden border-border sm:rounded-[20px] sm:border lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#0B0D10] p-10 lg:flex xl:p-14">
          <div
            className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(#3B4250_1px,transparent_1px)] [background-size:22px_22px]"
            aria-hidden="true"
          />
          <div className="relative">
            <Logo />
          </div>
          <div className="relative my-12">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-[44px]">
              Hire with evidence,
              <br />
              not guesswork.
            </h1>
            <p className="mt-4 max-w-md text-base text-body/90">
              A talent intelligence platform for recruiters and candidates, powered by explainable AI.
            </p>
            <div className="mt-10 space-y-4">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 rounded-card border border-border/60 bg-surface/60 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-raised text-accent-hover">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white">{title}</p>
                    <p className="mt-1 text-sm text-body/90">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="relative flex items-center gap-2 text-xs text-muted">
            <ShieldCheck size={14} /> Your data is only shared with the recruiters you apply to.
          </p>
        </section>

        <section className="flex min-h-screen flex-col justify-center bg-surface px-5 py-10 sm:min-h-0 sm:px-10 lg:px-14 xl:px-16">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <div className="mx-auto w-full max-w-md">{children}</div>
        </section>
      </div>
    </div>
  );
}

/** Recruiter / Candidate segmented control. */
export function RoleSegmented({ value, onChange }) {
  const options = [
    { value: ROLES.Recruiter, label: 'Recruiter Workspace' },
    { value: ROLES.Candidate, label: 'Candidate Portal' },
  ];
  return (
    <div role="radiogroup" aria-label="Account type" className="grid grid-cols-2 gap-1 rounded-control border border-border bg-input p-1">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`focus-ring rounded-[8px] px-3 py-2 text-sm font-medium transition-all duration-200 ${
              active ? 'bg-accent text-white shadow' : 'text-muted hover:text-white'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
