import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Edit, Eye, Lock, Plus, RefreshCw, Search, Users } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { jobsApi } from '../../api/jobs';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState, { ErrorState } from '../../components/common/EmptyState.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { SkeletonRows } from '../../components/common/Skeleton.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { PageHeader } from '../../components/layout/DashboardLayout.jsx';
import useAsync from '../../hooks/useAsync';
import { formatSalaryRange, timeAgo } from '../../utils/dates';

export default function JobsList() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [toggleJob, setToggleJob] = useState(null);
  const [toggling, setToggling] = useState(false);
  const toast = useToast();

  const { data: jobs, loading, error, reload } = useAsync(
    () => jobsApi.listMine({ search, status: status || undefined }),
    [search, status]
  );

  const handleToggleStatus = async () => {
    if (!toggleJob) return;
    setToggling(true);
    try {
      if (toggleJob.status === 'Open') {
        await jobsApi.close(toggleJob.id);
        toast.success(`Closed "${toggleJob.title}".`);
      } else {
        await jobsApi.reopen(toggleJob.id);
        toast.success(`Reopened "${toggleJob.title}".`);
      }
      setToggleJob(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Talent requisitions"
        title="Jobs"
        subtitle="Manage and track your active and archived job requisitions"
        actions={
          <Link to="/recruiter/jobs/new">
            <Button className="flex items-center gap-2">
              <Plus size={16} /> New job
            </Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, department, or location..."
              className="w-full rounded-control border border-border bg-input py-2.5 pl-10 pr-4 text-sm text-body placeholder-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'Open', label: 'Open' },
                { value: 'Closed', label: 'Closed' },
              ]}
            />
          </div>
        </div>
      </Card>

      {error ? (
        <Card>
          <ErrorState message={getErrorMessage(error)} onRetry={reload} />
        </Card>
      ) : loading && !jobs ? (
        <Card>
          <SkeletonRows rows={5} />
        </Card>
      ) : !jobs || jobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={
              search || status
                ? 'Try adjusting your search query or status filter.'
                : 'Create your first job requisition to begin hiring.'
            }
            action={
              !search && !status ? (
                <Link to="/recruiter/jobs/new">
                  <Button className="flex items-center gap-2">
                    <Plus size={16} /> Create job
                  </Button>
                </Link>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.Id || job.id} className="transition-colors hover:border-slate-700">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/recruiter/jobs/${job.id}`}
                      className="text-base font-semibold text-white hover:text-accent-hover"
                    >
                      {job.title}
                    </Link>
                    <StatusBadge status={job.status} />
                    <span className="rounded-full bg-raised px-2.5 py-0.5 font-mono text-xs text-muted">
                      {job.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {job.department} · {job.location} · {job.minExperienceYears}+ yrs exp · Created {timeAgo(job.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/recruiter/jobs/${job.id}/applicants`}
                    className="flex items-center gap-1.5 rounded-control bg-raised px-3 py-1.5 font-mono text-xs text-body hover:bg-slate-800"
                  >
                    <Users size={14} className="text-accent" />
                    <span>{job.applicantCount || 0} applicant{job.applicantCount === 1 ? '' : 's'}</span>
                  </Link>

                  <Link to={`/recruiter/jobs/${job.id}`}>
                    <Button variant="ghost" size="sm" title="View details">
                      <Eye size={15} />
                    </Button>
                  </Link>

                  <Link to={`/recruiter/jobs/${job.id}/edit`}>
                    <Button variant="ghost" size="sm" title="Edit job">
                      <Edit size={15} />
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    title={job.status === 'Open' ? 'Close job' : 'Reopen job'}
                    onClick={() => setToggleJob(job)}
                  >
                    {job.status === 'Open' ? <Lock size={15} className="text-warning" /> : <RefreshCw size={15} className="text-success" />}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {toggleJob && (
        <ConfirmDialog
          isOpen={true}
          title={toggleJob.status === 'Open' ? 'Close Job Requisition' : 'Reopen Job Requisition'}
          message={
            toggleJob.status === 'Open'
              ? `Are you sure you want to close "${toggleJob.title}"? Candidates will no longer be able to submit new applications.`
              : `Are you sure you want to reopen "${toggleJob.title}"? Candidates will immediately be able to view and apply.`
          }
          confirmLabel={toggleJob.status === 'Open' ? 'Close job' : 'Reopen job'}
          variant={toggleJob.status === 'Open' ? 'danger' : 'primary'}
          loading={toggling}
          onConfirm={handleToggleStatus}
          onClose={() => setToggleJob(null)}
        />
      )}
    </>
  );
}

