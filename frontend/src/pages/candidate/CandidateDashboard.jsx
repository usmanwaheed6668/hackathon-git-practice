import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  FileText,
  Search,
  Sparkles,
  UserCheck,
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { applicationsApi } from '../../api/applications';
import { candidatesApi } from '../../api/candidates';
import { jobsApi } from '../../api/jobs';
import { interviewsApi } from '../../api/interviews';
import Button from '../../components/common/Button.jsx';
import Card, { CardHeader } from '../../components/common/Card.jsx';
import { SkeletonCards } from '../../components/common/Skeleton.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { PageHeader } from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useAsync from '../../hooks/useAsync';
import { formatSalaryRange, greeting } from '../../utils/dates';

async function loadCandidateDashboard() {
  const [profile, applications, jobs, interviews] = await Promise.all([
    candidatesApi.me().catch(() => null),
    applicationsApi.mine().catch(() => []),
    jobsApi.listOpen().catch(() => []),
    interviewsApi.candidateMine().catch(() => []),
  ]);
  return { profile, applications, jobs, interviews: interviews || [] };
}

export default function CandidateDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(loadCandidateDashboard, []);

  const profile = data?.profile;
  const applications = data?.applications || [];
  const openJobs = data?.jobs || [];
  const interviews = data?.interviews || [];
  const completeness = profile?.completeness || 0;
  const firstName = user?.name?.split(' ')[0] || 'Candidate';

  return (
    <>
      <PageHeader
        eyebrow="Candidate Portal"
        title={`${greeting()}, ${firstName}`}
        subtitle="Manage your profile, track active applications, and discover engineering roles"
        actions={
          <Link to="/candidate/jobs">
            <Button className="flex items-center gap-2">
              <Search size={16} /> Browse open jobs
            </Button>
          </Link>
        }
      />

      {loading && !data ? (
        <div className="space-y-6">
          <SkeletonCards count={3} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="flex flex-col justify-between">
              <div>
                <p className="micro-label">Active Applications</p>
                <p className="mt-3 font-mono text-3xl font-semibold text-accent-hover">{applications.length}</p>
              </div>
              <Link to="/candidate/applications" className="mt-3 flex items-center gap-1 text-xs text-accent hover:underline">
                View pipeline tracker <ChevronRight size={13} />
              </Link>
            </Card>

            <Card className="flex flex-col justify-between">
              <div>
                <p className="micro-label">Open Requisitions</p>
                <p className="mt-3 font-mono text-3xl font-semibold text-white">{openJobs.length}</p>
              </div>
              <Link to="/candidate/jobs" className="mt-3 flex items-center gap-1 text-xs text-accent hover:underline">
                Explore openings <ChevronRight size={13} />
              </Link>
            </Card>

            <Card className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <p className="micro-label">Profile Completeness</p>
                  <span className="font-mono text-xs font-semibold text-accent">{completeness}%</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-input">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>
              <Link to="/candidate/profile" className="mt-3 flex items-center gap-1 text-xs text-accent hover:underline">
                Update skills & resume <ChevronRight size={13} />
              </Link>
            </Card>
          </div>

          {/* Upcoming Interviews Banner (if scheduled) */}
          {interviews.length > 0 && (
            <Card className="border-accent/40 bg-gradient-to-r from-accent/10 via-surface to-surface">
              <CardHeader
                title="Upcoming Interviews"
                subtitle="Scheduled conversations with hiring teams (All times in local timezone)"
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {interviews.map((iv) => (
                  <div
                    key={iv.id}
                    className="rounded-control border border-border/80 bg-base p-4 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-sm">{iv.jobTitle}</span>
                      <span className="rounded bg-accent/20 px-2 py-0.5 font-bold uppercase text-[10px] text-accent-hover border border-accent/30">
                        {iv.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-muted pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-accent" />
                        <span>{new Date(iv.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-accent" />
                        <span>{iv.startTime} ({iv.durationMinutes}m)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {iv.mode === 'Online' ? <Video size={13} className="text-accent" /> : <MapPin size={13} className="text-accent" />}
                        <span>{iv.mode}</span>
                      </div>
                    </div>

                    {iv.linkOrLocation && (
                      <div className="pt-2 border-t border-border/50">
                        {iv.mode === 'Online' ? (
                          <a
                            href={iv.linkOrLocation.startsWith('http') ? iv.linkOrLocation : `https://${iv.linkOrLocation}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-accent-hover hover:underline"
                          >
                            Join Video Meeting <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-muted">
                            Location: <strong className="text-white">{iv.linkOrLocation}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader
                  title="Recommended Roles"
                  subtitle="Open roles matching engineering profiles"
                  action={
                    <Link to="/candidate/jobs" className="text-xs text-accent hover:underline">
                      View all ({openJobs.length})
                    </Link>
                  }
                />

                {openJobs.length === 0 ? (
                  <p className="text-sm text-muted">No open requisitions at this time.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {openJobs.slice(0, 3).map((job) => (
                      <div key={job.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <Link
                              to={`/candidate/jobs/${job.id}`}
                              className="text-base font-semibold text-white hover:text-accent-hover"
                            >
                              {job.title}
                            </Link>
                            <p className="text-xs text-muted">
                              {job.department} · {job.location} · {job.minExperienceYears}+ yrs exp
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {job.hasApplied && (
                              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent">
                                Applied
                              </span>
                            )}
                            <Link to={`/candidate/jobs/${job.id}`}>
                              <Button variant="secondary" size="sm">
                                View Role
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader title="Dossier Checklist" />
                <ul className="space-y-3 text-xs text-body">
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      size={15}
                      className={profile?.fullName ? 'text-success' : 'text-muted'}
                    />
                    <span>Basic details & contact information</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      size={15}
                      className={profile?.resumeFileName ? 'text-success' : 'text-muted'}
                    />
                    <span>
                      {profile?.resumeFileName ? `Resume: ${profile.resumeFileName}` : 'Resume upload (.pdf)'}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      size={15}
                      className={profile?.skills?.length ? 'text-success' : 'text-muted'}
                    />
                    <span>Skills listed ({profile?.skills?.length || 0})</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      size={15}
                      className={profile?.experience?.length ? 'text-success' : 'text-muted'}
                    />
                    <span>Work experience ({profile?.experience?.length || 0})</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
