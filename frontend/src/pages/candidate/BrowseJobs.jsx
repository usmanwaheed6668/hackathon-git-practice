import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, ChevronRight, DollarSign, MapPin, Search } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { jobsApi } from '../../api/jobs';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState, { ErrorState } from '../../components/common/EmptyState.jsx';
import Select from '../../components/common/Select.jsx';
import { SkeletonRows } from '../../components/common/Skeleton.jsx';
import { PageHeader } from '../../components/layout/DashboardLayout.jsx';
import useAsync from '../../hooks/useAsync';
import { JOB_TYPE_OPTIONS } from '../../utils/constants';
import { formatSalaryRange, timeAgo } from '../../utils/dates';

export default function BrowseJobs() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');

  const { data: jobs, loading, error, reload } = useAsync(
    () => jobsApi.listOpen({ search, type: type || undefined, location: location || undefined }),
    [search, type, location]
  );

  return (
    <>
      <PageHeader
        eyebrow="Opportunity Discovery"
        title="Open Positions"
        subtitle="Explore active requisitions and apply directly to engineering squads"
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, tech stack..."
              className="w-full rounded-control border border-border bg-input py-2.5 pl-10 pr-4 text-sm text-body placeholder-muted focus:border-accent focus:outline-none"
            />
          </div>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[{ value: '', label: 'All types' }, ...JOB_TYPE_OPTIONS]}
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Filter location (e.g. Lahore, Remote)..."
            className="w-full rounded-control border border-border bg-input py-2.5 px-3.5 text-sm text-body placeholder-muted focus:border-accent focus:outline-none"
          />
        </div>
      </Card>

      {error ? (
        <Card>
          <ErrorState message={getErrorMessage(error)} onRetry={reload} />
        </Card>
      ) : loading && !jobs ? (
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      ) : !jobs || jobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={Briefcase}
            title="No matching roles"
            description="Try modifying your keyword search or filter criteria."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="transition-colors hover:border-slate-700">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/candidate/jobs/${job.id}`}
                      className="text-lg font-semibold text-white hover:text-accent-hover"
                    >
                      {job.title}
                    </Link>
                    {job.hasApplied && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent-hover">
                        <CheckCircle2 size={12} /> Applied
                      </span>
                    )}
                    <span className="rounded-full bg-raised px-2.5 py-0.5 font-mono text-xs text-muted">
                      {job.type}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted">
                    {job.department} · {job.location} · {job.minExperienceYears}+ yrs exp · Posted {timeAgo(job.createdAt)}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {(job.skills || []).slice(0, 5).map((s, idx) => (
                      <span
                        key={idx}
                        className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] ${
                          s.isRequired
                            ? 'border border-accent/25 bg-accent/10 text-accent-hover'
                            : 'border border-border bg-raised text-muted'
                        }`}
                      >
                        {s.name}
                      </span>
                    ))}
                    {(job.skills || []).length > 5 && (
                      <span className="text-[11px] text-muted">+{job.skills.length - 5} more</span>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                  <span className="font-mono text-sm font-semibold text-accent-hover">
                    {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
                  </span>
                  <Link to={`/candidate/jobs/${job.id}`}>
                    <Button variant={job.hasApplied ? 'secondary' : 'primary'} size="sm">
                      {job.hasApplied ? 'View Status' : 'View Role'}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

