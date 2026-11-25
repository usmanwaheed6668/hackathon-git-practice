import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, ChevronRight, Clock, FileText, MapPin, Shield, Calendar, Video, ExternalLink } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { applicationsApi } from '../../api/applications';
import { interviewsApi } from '../../api/interviews';
import Button from '../../components/common/Button.jsx';
import Card, { CardHeader } from '../../components/common/Card.jsx';
import EmptyState, { ErrorState } from '../../components/common/EmptyState.jsx';
import { SkeletonCards } from '../../components/common/Skeleton.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { PageHeader } from '../../components/layout/DashboardLayout.jsx';
import useAsync from '../../hooks/useAsync';
import { formatDate, timeAgo } from '../../utils/dates';

const PIPELINE_STEPS = [
  { key: 'Submitted', label: 'Submitted' },
  { key: 'Parsed', label: 'Parsed' },
  { key: 'AIAssessmentAvailable', label: 'AI Assessment' },
  { key: 'RecruiterReview', label: 'Review' },
  { key: 'Shortlisted', label: 'Shortlisted' },
  { key: 'Interview', label: 'Interview' },
  { key: 'Decision', label: 'Decision' },
];

function getStepIndex(status) {
  switch (status) {
    case 'Submitted': return 0;
    case 'Parsed': return 1;
    case 'AIAssessmentAvailable': return 2;
    case 'RecruiterReview': return 3;
    case 'Shortlisted': return 4;
    case 'Interview': return 5;
    case 'Selected':
    case 'Rejected': return 6;
    default: return 0;
  }
}

function StatusStepper({ status }) {
  const currentIndex = getStepIndex(status);
  const isRejected = status === 'Rejected';
  const isSelected = status === 'Selected';

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {PIPELINE_STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          let circleBg = 'bg-raised border border-border text-muted';
          let textColor = 'text-muted';

          if (isDone) {
            circleBg = 'bg-accent text-white border border-accent';
            textColor = 'text-body';
          } else if (isCurrent) {
            if (isRejected && step.key === 'Decision') {
              circleBg = 'bg-danger text-white border border-danger';
              textColor = 'text-danger font-semibold';
            } else if (isSelected && step.key === 'Decision') {
              circleBg = 'bg-success text-white border border-success';
              textColor = 'text-success font-semibold';
            } else {
              circleBg = 'bg-accent/20 border-2 border-accent text-accent-hover ring-4 ring-accent/10';
              textColor = 'text-accent-hover font-semibold';
            }
          }

          return (
            <div key={step.key} className="relative flex flex-1 flex-col items-center">
              {idx > 0 && (
                <div
                  className={`absolute left-0 top-3.5 -translate-y-1/2 h-0.5 w-full -translate-x-1/2 transition-colors ${
                    idx <= currentIndex ? (isRejected && idx === 6 ? 'bg-danger/60' : 'bg-accent') : 'bg-border'
                  }`}
                  style={{ zIndex: 0 }}
                />
              )}

              <div
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${circleBg}`}
              >
                {isDone ? <CheckCircle2 size={14} /> : idx + 1}
              </div>

              <span className={`mt-2 text-center text-[11px] ${textColor}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

async function loadData() {
  const [apps, ivs] = await Promise.all([
    applicationsApi.mine(),
    interviewsApi.candidateMine().catch(() => []),
  ]);
  return { applications: apps || [], interviews: ivs || [] };
}

export default function MyApplications() {
  const { data, loading, error, reload } = useAsync(loadData, []);
  const applications = data?.applications || [];
  const interviews = data?.interviews || [];

  return (
    <>
      <PageHeader
        eyebrow="Real-Time Tracker"
        title="My Applications"
        subtitle="Keep track of your active application progress, upcoming rounds, and review status"
      />

      {error ? (
        <Card>
          <ErrorState message={getErrorMessage(error)} onRetry={reload} />
        </Card>
      ) : loading && !data ? (
        <div className="space-y-4">
          <SkeletonCards count={2} />
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <EmptyState
            icon={Briefcase}
            title="No applications yet"
            description="You have not applied to any job requisitions. Browse open positions to get started."
            action={
              <Link to="/candidate/jobs">
                <Button>Browse Open Jobs</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => {
            const scheduledInterview = interviews.find((i) => i.jobTitle === app.jobTitle);
            return (
              <Card key={app.id} className="transition-colors hover:border-slate-700">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/candidate/jobs/${app.jobId}`}
                        className="text-lg font-semibold text-white hover:text-accent-hover"
                      >
                        {app.jobTitle}
                      </Link>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {app.department} · {app.location} · Applied {formatDate(app.appliedAt)} ({timeAgo(app.appliedAt)})
                    </p>
                  </div>

                  <Link to={`/candidate/jobs/${app.jobId}`}>
                    <Button variant="secondary" size="sm">
                      View Position
                    </Button>
                  </Link>
                </div>

                <div className="py-4">
                  <p className="micro-label mb-2">Hiring Journey Flow</p>
                  <StatusStepper status={app.status} />
                </div>

                {/* Scheduled Interview Card */}
                {scheduledInterview && (
                  <div className="mb-4 rounded-control border border-accent/40 bg-accent/10 p-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Calendar size={14} className="text-accent-hover" />
                        Scheduled Interview: {scheduledInterview.type}
                      </span>
                      <span className="rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent-hover uppercase">
                        {scheduledInterview.mode}
                      </span>
                    </div>
                    <p className="mt-1 text-muted">
                      {new Date(scheduledInterview.scheduledAt).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} at {scheduledInterview.startTime} ({scheduledInterview.durationMinutes} mins)
                    </p>
                    {scheduledInterview.linkOrLocation && scheduledInterview.mode === 'Online' && (
                      <div className="mt-2 pt-2 border-t border-accent/20">
                        <a
                          href={scheduledInterview.linkOrLocation.startsWith('http') ? scheduledInterview.linkOrLocation : `https://${scheduledInterview.linkOrLocation}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-accent-hover hover:underline"
                        >
                          Join Video Meeting <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {app.coverNote && (
                  <div className="rounded-control bg-input/60 p-3 text-xs text-body border border-border/50">
                    <span className="font-semibold text-muted">Attached Note: </span>
                    <span className="italic">{app.coverNote}</span>
                  </div>
                )}
              </Card>
            );
          })}

          <Card className="border border-border/80 bg-raised/30">
            <div className="flex items-start gap-3">
              <Shield size={20} className="shrink-0 text-accent" />
              <div>
                <h4 className="text-xs font-semibold text-white">Candidate Privacy & Data Transparency</h4>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  You always have full oversight into your active submissions. Your applications and scheduled interviews are strictly private to you and authorized hiring panels.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
