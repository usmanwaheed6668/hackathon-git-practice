import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Filter,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { applicationsApi } from '../../api/applications';
import { jobsApi } from '../../api/jobs';
import Button from '../../components/common/Button.jsx';
import Card, { CardHeader } from '../../components/common/Card.jsx';
import EmptyState, { ErrorState } from '../../components/common/EmptyState.jsx';
import Select from '../../components/common/Select.jsx';
import { SkeletonRows } from '../../components/common/Skeleton.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { PageHeader } from '../../components/layout/DashboardLayout.jsx';
import useAsync from '../../hooks/useAsync';
import { APPLICATION_STATUS_OPTIONS } from '../../utils/constants';
import { formatDate, timeAgo } from '../../utils/dates';

export default function ApplicantList() {
  const { id } = useParams();
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('score_desc');
  const [assessingAll, setAssessingAll] = useState(false);

  const { data: job } = useAsync(() => jobsApi.get(id), [id]);
  const {
    data: applicants,
    loading,
    error,
    reload,
  } = useAsync(
    () =>
      jobsApi.applications(id, {
        status: statusFilter || undefined,
        minScore: minScoreFilter ? Number(minScoreFilter) : undefined,
        skill: skillFilter || undefined,
        sort: sortOrder,
      }),
    [id, statusFilter, minScoreFilter, skillFilter, sortOrder]
  );

  // Poll every 3 seconds while any candidate is still processing
  useEffect(() => {
    if (!applicants) return;
    const hasPending = applicants.some(
      (a) => a.status === 'Submitted' || a.status === 'Parsed'
    );
    if (!hasPending) return;

    const timer = setTimeout(() => {
      reload();
    }, 3000);

    return () => clearTimeout(timer);
  }, [applicants, reload]);

  const handleAssessAll = async () => {
    setAssessingAll(true);
    try {
      const res = await applicationsApi.assessAll(id);
      toast.success(res.message || 'Queued applications for AI evaluation.');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAssessingAll(false);
    }
  };

  const handleRetrySingle = async (e, appId) => {
    e.stopPropagation();
    try {
      await applicationsApi.assess(appId);
      toast.success('Triggered AI assessment.');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to={`/recruiter/jobs/${id}`} className="flex items-center gap-1.5 text-xs text-muted hover:text-white">
            <ArrowLeft size={14} /> Back to {job?.title || 'job'}
          </Link>
        }
        title={job ? `Pipeline: ${job.title}` : 'Pipeline Applicants'}
        subtitle={
          applicants
            ? `${applicants.length} candidate${applicants.length === 1 ? '' : 's'} ranked by algorithmic fit`
            : 'Candidate evaluation dashboard'
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAssessAll}
              loading={assessingAll}
              className="flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-accent" /> Run Assessment for All
            </Button>
          </div>
        }
      />

      {/* Filter Controls Bar */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: '', label: 'All pipeline stages' }, ...APPLICATION_STATUS_OPTIONS]}
            />
          </div>
          <div>
            <Select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(e.target.value)}
              options={[
                { value: '', label: 'All score thresholds' },
                { value: '80', label: '80%+ Match' },
                { value: '65', label: '65%+ Match' },
                { value: '50', label: '50%+ Match' },
              ]}
            />
          </div>
          <div>
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Filter by skill (e.g. Python)..."
              className="w-full rounded-control border border-border bg-input py-2 px-3 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              options={[
                { value: 'score_desc', label: 'Sort: Highest Match Score' },
                { value: 'date_desc', label: 'Sort: Most Recent First' },
                { value: 'date_asc', label: 'Sort: Oldest First' },
              ]}
            />
          </div>
        </div>
      </Card>

      {error ? (
        <Card>
          <ErrorState message={getErrorMessage(error)} onRetry={reload} />
        </Card>
      ) : loading && !applicants ? (
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      ) : !applicants || applicants.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No applicants found"
            description={
              statusFilter || minScoreFilter || skillFilter
                ? 'No candidates match your current filter criteria.'
                : 'No candidates have applied to this job yet.'
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-input/50 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5 text-center">Fit Score</th>
                  <th className="px-5 py-3.5">Verified Signals & Gaps</th>
                  <th className="px-5 py-3.5">Stage</th>
                  <th className="px-5 py-3.5 text-right">Applied</th>
                  <th className="px-4 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans">
                {applicants.map((a) => {
                  const effectiveScore = a.overrideScore ?? a.overallScore;
                  const isProcessing = a.status === 'Submitted' || a.status === 'Parsed';

                  return (
                    <tr
                      key={a.id}
                      className="group cursor-pointer transition-colors hover:bg-raised/60"
                      onClick={() => (window.location.href = `/recruiter/jobs/${id}/applicants/${a.id}`)}
                    >
                      {/* Candidate Column */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-hover ring-1 ring-accent/20">
                            {(a.candidateName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/recruiter/jobs/${id}/applicants/${a.id}`}
                              className="font-medium text-white group-hover:text-accent-hover"
                            >
                              {a.candidateName}
                            </Link>
                            <p className="truncate text-xs text-muted">{a.candidateEmail}</p>
                            {a.headline && (
                              <p className="mt-0.5 truncate text-[11px] text-slate-400 max-w-xs">
                                {a.headline}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* AI Score Column */}
                      <td className="px-5 py-4 text-center">
                        {isProcessing ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs text-accent animate-pulse">
                            <RefreshCw size={12} className="animate-spin" /> Processing...
                          </div>
                        ) : effectiveScore !== null && effectiveScore !== undefined ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 font-mono text-sm font-bold ${
                                effectiveScore >= 80
                                  ? 'border border-accent/40 bg-accent/15 text-accent-hover'
                                  : effectiveScore >= 60
                                  ? 'border border-warning/40 bg-warning/15 text-warning'
                                  : 'border border-border bg-raised text-muted'
                              }`}
                            >
                              {Math.round(effectiveScore)}%
                            </span>
                            {a.overrideScore !== null && (
                              <span className="mt-0.5 text-[9px] font-mono text-warning">
                                Overridden
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-muted">—</span>
                        )}
                      </td>

                      {/* Skills, Gaps & Warnings Column */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(a.topSkills || []).map((sk, idx) => (
                            <span
                              key={idx}
                              className="rounded-full border border-border bg-raised px-2 py-0.5 font-mono text-[10px] text-body"
                            >
                              {sk}
                            </span>
                          ))}

                          {a.gapCount > 0 && (
                            <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-mono text-[10px] text-warning">
                              {a.gapCount} gap{a.gapCount === 1 ? '' : 's'}
                            </span>
                          )}

                          {a.warningCount > 0 && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 font-mono text-[10px] text-danger"
                              title="Unverified claim in resume"
                            >
                              <AlertTriangle size={10} /> {a.warningCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stage Column */}
                      <td className="px-5 py-4">
                        <StatusBadge status={a.status} />
                      </td>

                      {/* Applied Column */}
                      <td className="px-5 py-4 text-right font-mono text-xs text-muted">
                        {timeAgo(a.appliedAt)}
                      </td>

                      {/* Action Chevron / Resume / Retry */}
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/api/applications/${a.id}/resume`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-control border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent-hover hover:bg-accent/20 transition"
                            title="View attached PDF Resume"
                          >
                            PDF Resume
                          </a>
                          {a.assessmentError && (
                            <button
                              onClick={(e) => handleRetrySingle(e, a.id)}
                              className="p-1 text-muted hover:text-white"
                              title="Retry AI Assessment"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                          <Link
                            to={`/recruiter/jobs/${id}/applicants/${a.id}`}
                            className="inline-flex items-center gap-1 rounded-control border border-border bg-raised px-2.5 py-1 text-[11px] font-medium text-white hover:bg-input"
                          >
                            Full Profile <ChevronRight size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
