import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Calendar, CheckCircle2, Clock, DollarSign, Edit, Lock, MapPin, RefreshCw, Users } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { jobsApi } from '../../api/jobs';
import Button from '../../components/common/Button.jsx';
import Card, { CardHeader } from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { PageSpinner } from '../../components/common/Spinner.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { PageHeader } from '../../components/layout/DashboardLayout.jsx';
import useAsync from '../../hooks/useAsync';
import { formatDate, formatSalaryRange } from '../../utils/dates';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const { data: job, loading, error, reload } = useAsync(() => jobsApi.get(id), [id]);

  const handleToggleStatus = async () => {
    if (!job) return;
    setToggling(true);
    try {
      if (job.status === 'Open') {
        await jobsApi.close(job.id);
        toast.success(`Job closed.`);
      } else {
        await jobsApi.reopen(job.id);
        toast.success(`Job reopened.`);
      }
      setConfirmOpen(false);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <PageSpinner label="Loading requisition details..." />;
  if (error || !job) {
    return (
      <Card>
        <p className="text-sm text-danger">Failed to load job: {getErrorMessage(error)}</p>
        <Link to="/recruiter/jobs" className="mt-3 inline-block text-xs text-accent">
          Return to jobs
        </Link>
      </Card>
    );
  }

  const requiredSkills = (job.skills || []).filter((s) => s.isRequired);
  const preferredSkills = (job.skills || []).filter((s) => !s.isRequired);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/recruiter/jobs" className="flex items-center gap-1.5 text-xs text-muted hover:text-white">
            <ArrowLeft size={14} /> Back to jobs
          </Link>
        }
        title={job.title}
        subtitle={`${job.department} · Requisition ID #${job.id.slice(0, 8)}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to={`/recruiter/jobs/${job.id}/applicants`}>
              <Button variant="secondary" className="flex items-center gap-2">
                <Users size={16} /> View Applicants ({job.applicantCount || 0})
              </Button>
            </Link>
            <Link to={`/recruiter/jobs/${job.id}/edit`}>
              <Button variant="secondary" className="flex items-center gap-2">
                <Edit size={16} /> Edit
              </Button>
            </Link>
            <Button
              variant={job.status === 'Open' ? 'danger' : 'primary'}
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-2"
            >
              {job.status === 'Open' ? <Lock size={16} /> : <RefreshCw size={16} />}
              {job.status === 'Open' ? 'Close job' : 'Reopen job'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Role Description" />
            <div className="whitespace-pre-line text-sm leading-relaxed text-body">
              {job.description}
            </div>
          </Card>

          <Card>
            <CardHeader title="Skill Competencies" subtitle="Evaluated during candidate scoring" />
            <div className="space-y-4">
              <div>
                <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  Required Skills ({requiredSkills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {requiredSkills.map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/15 px-3 py-1 font-mono text-xs font-medium text-accent-hover"
                    >
                      {s.name}
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/30 text-[10px]">
                        {s.importance}
                      </span>
                    </span>
                  ))}
                  {requiredSkills.length === 0 && <span className="text-xs text-muted">None specified</span>}
                </div>
              </div>

              <div>
                <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  Preferred Skills ({preferredSkills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {preferredSkills.map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-raised px-3 py-1 font-mono text-xs font-medium text-body"
                    >
                      {s.name}
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-border text-[10px] text-muted">
                        {s.importance}
                      </span>
                    </span>
                  ))}
                  {preferredSkills.length === 0 && <span className="text-xs text-muted">None specified</span>}
                </div>
              </div>
            </div>
          </Card>

          {job.qualifications?.length > 0 && (
            <Card>
              <CardHeader title="Qualifications & Benchmarks" />
              <ul className="space-y-2">
                {job.qualifications.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-body">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Requisition Telemetry" />
            <dl className="space-y-4 text-xs">
              <div>
                <dt className="text-muted">Requisition Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={job.status} />
                </dd>
              </div>
              <div>
                <dt className="text-muted">Department</dt>
                <dd className="mt-1 text-sm font-medium text-white">{job.department}</dd>
              </div>
              <div>
                <dt className="text-muted">Location</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-white">
                  <MapPin size={14} className="text-muted" /> {job.location}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Employment Type</dt>
                <dd className="mt-1 text-sm font-medium text-white">{job.type}</dd>
              </div>
              <div>
                <dt className="text-muted">Min Experience</dt>
                <dd className="mt-1 text-sm font-medium text-white">{job.minExperienceYears} years</dd>
              </div>
              <div>
                <dt className="text-muted">Target Compensation</dt>
                <dd className="mt-1 font-mono text-sm font-semibold text-accent-hover">
                  {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Requisition Created</dt>
                <dd className="mt-1 text-body">{formatDate(job.createdAt)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={job.status === 'Open' ? 'Close Job Requisition' : 'Reopen Job Requisition'}
        message={
          job.status === 'Open'
            ? `Are you sure you want to close "${job.title}"? Candidates will no longer be able to apply.`
            : `Are you sure you want to reopen "${job.title}"?`
        }
        confirmLabel={job.status === 'Open' ? 'Close Job' : 'Reopen Job'}
        destructive={job.status === 'Open'}
        loading={toggling}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

