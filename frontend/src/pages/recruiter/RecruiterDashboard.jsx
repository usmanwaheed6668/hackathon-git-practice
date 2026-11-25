import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  ChevronRight,
  Clock,
  Plus,
  Star,
  Users,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Award,
  Zap,
  User,
  FileText,
  Download,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getErrorMessage } from '../../api/client';
import { jobsApi } from '../../api/jobs';
import { analyticsApi } from '../../api/analytics';
import { applicationsApi } from '../../api/applications';
import Button from '../../components/common/Button.jsx';
import Card, { CardHeader } from '../../components/common/Card.jsx';
import EmptyState, { ErrorState } from '../../components/common/EmptyState.jsx';
import Modal from '../../components/common/Modal.jsx';
import { SkeletonCards, SkeletonRows } from '../../components/common/Skeleton.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { PageHeader } from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { PENDING_REVIEW_STATUSES } from '../../utils/constants';
import { greeting, timeAgo } from '../../utils/dates';

function StatCard({ label, value, icon: Icon, hint, tone = 'text-accent-hover' }) {
  return (
    <Card className="flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <p className="micro-label">{label}</p>
        <Icon size={18} className="text-muted" />
      </div>
      <p className={`mt-4 font-mono text-[32px] font-semibold leading-none ${tone}`}>{value}</p>
      {hint && <p className="mt-3 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

const STAGE_COLORS = ['#38bdf8', '#818cf8', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#64748b'];

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobs, setJobs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [modalInitialFocus, setModalInitialFocus] = useState('profile');
  const [selectedAppDetail, setSelectedAppDetail] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [modalQuestions, setModalQuestions] = useState([]);
  const [generatingModalQuestions, setGeneratingModalQuestions] = useState(false);

  // Dashboard-level AI Interview Copilot state
  const [copilotAppId, setCopilotAppId] = useState('');
  const [copilotQuestions, setCopilotQuestions] = useState([]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  const handleOpenProfileModal = async (e, appSummary, focusSection = 'profile') => {
    e.preventDefault();
    e.stopPropagation();
    setModalInitialFocus(focusSection);
    setProfileModalOpen(true);
    setProfileLoading(true);
    setSelectedAppDetail(null);
    setModalQuestions([]);
    try {
      const [fullApp, qList] = await Promise.all([
        applicationsApi.get(appSummary.id),
        applicationsApi.getQuestions(appSummary.id).catch(() => []),
      ]);
      setSelectedAppDetail({ ...fullApp, jobId: appSummary.jobId, jobTitle: appSummary.jobTitle });
      if (qList && qList.length > 0) {
        setModalQuestions(qList);
      } else if (fullApp?.interviewQuestionsJson) {
        try {
          setModalQuestions(JSON.parse(fullApp.interviewQuestionsJson) || []);
        } catch {
          setModalQuestions([]);
        }
      }
    } catch {
      setSelectedAppDetail(appSummary);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRegenerateModalQuestions = async () => {
    if (!selectedAppDetail?.id) return;
    setGeneratingModalQuestions(true);
    try {
      const fresh = await applicationsApi.generateQuestions(selectedAppDetail.id);
      setModalQuestions(fresh || []);
      if (selectedAppDetail.id === copilotAppId) {
        setCopilotQuestions(fresh || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingModalQuestions(false);
    }
  };

  const handleLoadCopilotQuestions = async (appId, forceGenerate = false) => {
    if (!appId) return;
    setCopilotLoading(true);
    try {
      const list = forceGenerate
        ? await applicationsApi.generateQuestions(appId)
        : await applicationsApi.getQuestions(appId);
      setCopilotQuestions(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCopilotLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobList, overview] = await Promise.all([
        jobsApi.listMine(),
        analyticsApi.getOverview(selectedJobId || null),
      ]);
      setJobs(jobList || []);
      setAnalytics(overview);

      // Load recent applicants
      const perJob = await Promise.all(
        (jobList || []).map((job) =>
          jobsApi
            .applications(job.id)
            .then((apps) => apps.map((a) => ({ ...a, jobId: job.id, jobTitle: job.title })))
            .catch(() => [])
        )
      );
      const allApps = perJob.flat().sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      setRecentApplications(allApps.slice(0, 5));
      if (allApps.length > 0) {
        const targetId = copilotAppId || allApps[0].id;
        setCopilotAppId(targetId);
        handleLoadCopilotQuestions(targetId, false);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedJobId]);

  const openJobs = jobs.filter((j) => j.status === 'Open');
  const firstName = user?.name?.split(' ')[0] || '';

  // Data for stage chart
  const stageData = (analytics?.stageCounts || []).map((s) => ({
    name: s.stage.replace(/([A-Z])/g, ' $1').trim(),
    count: s.count,
  }));

  // Data for score distribution
  const scoreData = (analytics?.scoreDistribution || []).map((d) => ({
    bucket: d.bucket,
    count: d.count,
  }));

  // Shortlist rate donut
  const shortlistRate = Math.round((analytics?.shortlistRate || 0) * 100);
  const donutData = [
    { name: 'Shortlisted', value: shortlistRate },
    { name: 'Other', value: Math.max(0, 100 - shortlistRate) },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Recruiter Intelligence & Analytics"
        title={`${greeting()}, ${firstName}`}
        subtitle="Real-time recruitment telemetry, pipeline velocity, and candidate scoring distributions"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {jobs.length > 0 && (
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="rounded-control border border-border bg-base px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="">All Jobs Overview</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            )}
            <Button as="a" onClick={undefined}>
              <Link to="/recruiter/jobs/new" className="flex items-center gap-2">
                <Plus size={16} /> New Job
              </Link>
            </Button>
          </div>
        }
      />

      {error ? (
        <Card>
          <ErrorState message={getErrorMessage(error)} onRetry={loadData} />
        </Card>
      ) : loading && !analytics ? (
        <div className="space-y-6">
          <SkeletonCards count={4} />
          <Card>
            <SkeletonRows rows={4} />
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Active Postings"
              value={openJobs.length}
              icon={Briefcase}
              hint={`${jobs.length} total postings`}
            />
            <StatCard
              label="Total Applicants"
              value={analytics?.totalApplications || 0}
              icon={Users}
              hint="In active pipelines"
            />
            <StatCard
              label="Shortlist Rate"
              value={`${shortlistRate}%`}
              icon={Star}
              tone="text-emerald-400"
              hint="Advancement threshold"
            />
            <StatCard
              label="Avg Time to Review"
              value={
                analytics?.avgDaysToReview !== undefined
                  ? `${analytics.avgDaysToReview.toFixed(1)}d`
                  : '1.2d'
              }
              icon={Clock}
              tone="text-amber-400"
              hint="Application velocity"
            />
          </div>

          {/* Analytics Visualizations Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Chart 1: Pipeline Stage Funnel (2 cols) */}
            <Card className="lg:col-span-2">
              <CardHeader
                title="Applicant Pipeline Funnel"
                subtitle="Distribution of candidates across active workflow stages"
              />
              <div className="mt-4 h-64 w-full">
                {stageData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-muted">
                    No pipeline stages recorded yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#16191f',
                          borderColor: '#262a34',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" fill="#2dd4bf" radius={[4, 4, 0, 0]}>
                        {stageData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Chart 2: Shortlist Rate Gauge / Donut (1 col) */}
            <Card className="flex flex-col justify-between">
              <div>
                <CardHeader
                  title="Shortlist Ratio"
                  subtitle="Percentage of reviewed candidates shortlisted"
                />
                <div className="relative mt-2 flex h-48 items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#262a34" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-3xl font-extrabold text-white">{shortlistRate}%</span>
                    <span className="text-[10px] uppercase font-semibold text-muted">Qualified</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-border/60 pt-3 text-center text-xs text-muted">
                Target shortlist benchmark: 20% - 35%
              </div>
            </Card>
          </div>

          {/* Row 2: Score Distribution & Skill Gap Analysis */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Score Distribution Histogram */}
            <Card>
              <CardHeader
                title="AI Match Score Distribution"
                subtitle="Density distribution of applicant composite match scores"
              />
              <div className="mt-4 h-56 w-full">
                {scoreData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-muted">
                    No scores computed yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <XAxis dataKey="bucket" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#16191f',
                          borderColor: '#262a34',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Top Missing Skill Gaps */}
            <Card>
              <CardHeader
                title="Top Candidate Skill Gaps"
                subtitle="Most frequently missing target requirements in resumes"
              />
              <div className="mt-4 space-y-3">
                {(analytics?.topSkillGaps || []).length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted">
                    No common skill gaps identified yet.
                  </div>
                ) : (
                  (analytics.topSkillGaps || []).slice(0, 6).map((gap, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-control border border-border/80 bg-input/40 p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-raised text-[10px] font-bold text-muted">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-white">{gap.skill}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-300">
                          {gap.gapCount} missing
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Recent Applications Feed */}
          <Card>
            <CardHeader
              title="Recent Applications"
              subtitle="Latest candidates across your postings"
              action={
                <Link to="/recruiter/jobs" className="focus-ring rounded text-sm text-accent-hover hover:underline">
                  View all jobs
                </Link>
              }
            />
            {recentApplications.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No applications yet"
                description={
                  jobs.length === 0
                    ? 'Create your first job to start receiving applications.'
                    : 'Applications will appear here as candidates apply to your open jobs.'
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentApplications.map((a) => {
                  const score = a.overrideScore ?? a.overallScore;
                  return (
                    <li key={a.id}>
                      <Link
                        to={`/recruiter/jobs/${a.jobId}/applicants/${a.id}`}
                        className="focus-ring -mx-2 flex flex-col gap-3 rounded-control px-3 py-3.5 transition-colors hover:bg-raised sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-hover">
                            {(a.candidateName || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-white">{a.candidateName}</p>
                              <span className="text-xs text-accent-hover font-medium">· {a.jobTitle}</span>
                              {score !== null && score !== undefined && (
                                <span className="rounded bg-accent/15 border border-accent/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent-hover">
                                  {Math.round(score)}% Match
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-muted mt-0.5">
                              {a.headline || 'Candidate Applicant'} · {a.totalExperienceYears || 0} yrs exp · {a.candidateEmail}
                            </p>
                            {(a.topSkills || []).length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {a.topSkills.map((sk, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded bg-input border border-border px-2 py-0.5 font-mono text-[10px] text-body"
                                  >
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(`/api/applications/${a.id}/resume`, '_blank');
                            }}
                            className="inline-flex items-center gap-1 rounded-control border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/25 transition"
                          >
                            PDF Resume
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenProfileModal(e, a, 'profile')}
                            className="inline-flex items-center gap-1 rounded-control border border-accent/40 bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent-hover hover:bg-accent/25 transition"
                          >
                            <User size={12} /> Candidate Profile
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenProfileModal(e, a, 'questions')}
                            className="inline-flex items-center gap-1 rounded-control border border-purple-500/40 bg-purple-500/15 px-2.5 py-1 text-[11px] font-semibold text-purple-300 hover:bg-purple-500/25 transition"
                          >
                            <Sparkles size={12} /> AI Interview Questions
                          </button>
                          <StatusBadge status={a.status} />
                          <span className="w-14 shrink-0 text-right font-mono text-xs text-muted">
                            {timeAgo(a.appliedAt)}
                          </span>
                          <ChevronRight size={16} className="shrink-0 text-muted" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Direct AI Interview Question Generator Card on Recruiter Dashboard */}
          {recentApplications.length > 0 && (
            <Card className="border-purple-500/30 bg-gradient-to-br from-surface via-surface to-raised/50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                <div>
                  <h3 className="font-heading text-base font-semibold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-400" />
                    AI Interview Question Generator (Ask Candidate in Interview)
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Select any candidate below to generate and review tailored technical, project deep-dive, gap-probing, and behavioral interview questions with evaluation guidelines.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={copilotAppId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCopilotAppId(val);
                      handleLoadCopilotQuestions(val, false);
                    }}
                    className="rounded-control border border-border bg-input px-3 py-1.5 text-xs text-white focus:border-accent focus:outline-none"
                  >
                    {recentApplications.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.candidateName} — {a.jobTitle} ({Math.round(a.overrideScore ?? a.overallScore ?? 0)}% Match)
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={() => handleLoadCopilotQuestions(copilotAppId, true)}
                    loading={copilotLoading}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Sparkles size={13} /> Generate / Regenerate AI Questions
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                {copilotLoading ? (
                  <div className="py-8 text-center text-xs text-muted">
                    Generating tailored AI interview questions for candidate...
                  </div>
                ) : copilotQuestions.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted">
                    Click <strong>Generate / Regenerate AI Questions</strong> above to create tailored interview questions for this candidate.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {copilotQuestions.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="rounded-control border border-border/80 bg-input/40 p-3.5 text-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className="rounded bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-300">
                              {q.category || 'technical'}
                            </span>
                            <span className="rounded bg-raised border border-border px-2 py-0.5 font-mono text-[10px] text-muted">
                              {q.difficulty || 'intermediate'}
                            </span>
                            {q.relatedSkill && (
                              <span className="text-[11px] text-accent-hover font-medium">
                                · {q.relatedSkill}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-white leading-relaxed">
                            Q{idx + 1}. {q.question}
                          </p>
                        </div>
                        {q.answerGuidelines && (
                          <div className="mt-2.5 rounded border border-border/50 bg-base/60 p-2 text-[11px] text-muted">
                            <span className="font-semibold text-emerald-400">Expected Answer Guideline: </span>
                            {q.answerGuidelines}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Candidate Complete Profile & AI Questions Modal */}
      {profileModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setProfileModalOpen(false)}
          title={
            selectedAppDetail?.candidate?.fullName
              ? `${selectedAppDetail.candidate.fullName} — Complete Profile & AI Interview Questions`
              : 'Candidate Complete Profile & AI Interview Questions'
          }
          maxWidth="max-w-4xl"
        >
          {profileLoading ? (
            <div className="py-10 text-center text-sm text-muted">
              Loading candidate portal profile & generating AI interview questions...
            </div>
          ) : selectedAppDetail?.candidate ? (
            <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
              {/* Tab Switcher inside Modal */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalInitialFocus('profile')}
                    className={`rounded-control px-3 py-1.5 text-xs font-semibold transition ${
                      modalInitialFocus === 'profile'
                        ? 'bg-accent text-white'
                        : 'bg-input text-muted hover:text-white'
                    }`}
                  >
                    1. Candidate Portal Profile & Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalInitialFocus('questions')}
                    className={`rounded-control px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                      modalInitialFocus === 'questions'
                        ? 'bg-purple-600 text-white'
                        : 'bg-input text-muted hover:text-white'
                    }`}
                  >
                    <Sparkles size={13} /> 2. AI Interview Questions ({modalQuestions.length})
                  </button>
                </div>
                <Button
                  size="sm"
                  onClick={handleRegenerateModalQuestions}
                  loading={generatingModalQuestions}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Sparkles size={13} /> Generate / Regenerate AI Questions
                </Button>
              </div>

              {/* AI Questions Section (Shown at top when 'questions' tab is active, and also included below) */}
              {modalInitialFocus === 'questions' && (
                <div className="rounded-control border border-purple-500/40 bg-purple-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                        <Sparkles size={14} /> AI Interview Questions for {selectedAppDetail.candidate.fullName}
                      </h4>
                      <p className="text-[11px] text-muted mt-0.5">
                        Tailored questions based on candidate projects, skills, and role requirements to ask during the interview:
                      </p>
                    </div>
                  </div>

                  {generatingModalQuestions ? (
                    <div className="py-6 text-center text-xs text-muted">
                      Generating fresh AI interview questions with Gemini...
                    </div>
                  ) : modalQuestions.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted">
                      Click <strong>Generate / Regenerate AI Questions</strong> above to generate questions.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {modalQuestions.map((q, idx) => (
                        <div key={q.id || idx} className="rounded border border-border bg-base/80 p-3 text-xs">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="rounded bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-300">
                              {q.category || 'technical'}
                            </span>
                            <span className="rounded bg-raised border border-border px-2 py-0.5 font-mono text-[10px] text-muted">
                              {q.difficulty || 'intermediate'}
                            </span>
                            {q.relatedSkill && (
                              <span className="text-[11px] text-accent-hover font-medium">
                                Target Skill: {q.relatedSkill}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-white leading-relaxed">
                            Q{idx + 1}. {q.question}
                          </p>
                          {q.answerGuidelines && (
                            <p className="mt-1.5 text-[11px] text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/20 rounded p-2">
                              <strong className="text-emerald-400">What to look for in Candidate's Answer: </strong>
                              {q.answerGuidelines}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-control border border-border bg-input/40 p-3.5 text-xs">
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Full Name</span>
                  <span className="font-semibold text-white mt-0.5 block">
                    {selectedAppDetail.candidate.fullName || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Headline</span>
                  <span className="text-accent-hover font-medium mt-0.5 block">
                    {selectedAppDetail.candidate.headline || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Total Experience</span>
                  <span className="font-semibold text-white mt-0.5 block">
                    {selectedAppDetail.candidate.totalExperienceYears ?? 0} Years
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Email Address</span>
                  <span className="font-mono text-white mt-0.5 block break-all">
                    {selectedAppDetail.candidate.email || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Phone Number</span>
                  <span className="font-mono text-white mt-0.5 block">
                    {selectedAppDetail.candidate.phone || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Location</span>
                  <span className="text-white mt-0.5 block">
                    {selectedAppDetail.candidate.location || 'Remote'}
                  </span>
                </div>
              </div>

              {/* Executive Summary */}
              {selectedAppDetail.candidate.summary && (
                <div className="rounded-control border border-border/70 bg-input/25 p-3.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent-hover block mb-1">
                    Executive Summary
                  </span>
                  <p className="text-body leading-relaxed whitespace-pre-line">
                    {selectedAppDetail.candidate.summary}
                  </p>
                </div>
              )}

              {/* Qualifications / Education */}
              <div className="rounded-control border border-border/70 bg-input/25 p-3.5 text-xs">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-accent-hover mb-2">
                  Qualifications & Education ({(selectedAppDetail.candidate.education || []).length})
                </h4>
                {(selectedAppDetail.candidate.education || []).length === 0 ? (
                  <p className="text-xs text-muted italic">No qualifications or education entries listed.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {selectedAppDetail.candidate.education.map((ed, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded border border-border/60 bg-base/60 px-3 py-2"
                      >
                        <div>
                          <p className="font-semibold text-white">{ed.degree}</p>
                          <p className="text-[11px] text-muted">{ed.institution}</p>
                        </div>
                        {ed.year && (
                          <span className="rounded bg-raised px-2 py-0.5 font-mono text-[11px] text-accent-hover">
                            {ed.year}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Experience */}
              <div className="rounded-control border border-border/70 bg-input/25 p-3.5 text-xs">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-accent-hover mb-2.5">
                  Work Experience ({(selectedAppDetail.candidate.experience || []).length})
                </h4>
                {(selectedAppDetail.candidate.experience || []).length === 0 ? (
                  <p className="text-xs text-muted italic">No work experience entries listed.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedAppDetail.candidate.experience.map((ex, i) => (
                      <div key={i} className="border-l-2 border-accent pl-3">
                        <p className="font-semibold text-white">{ex.title}</p>
                        <p className="text-[11px] text-accent-hover">
                          {ex.company} · {ex.startYear || '—'} – {ex.endYear || 'Present'}
                        </p>
                        {ex.description && (
                          <p className="mt-1 text-[11px] text-muted leading-relaxed">{ex.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Featured Projects */}
              <div className="rounded-control border border-border/70 bg-input/25 p-3.5 text-xs">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-accent-hover mb-2.5">
                  Featured Projects ({(selectedAppDetail.candidate.projects || []).length})
                </h4>
                {(selectedAppDetail.candidate.projects || []).length === 0 ? (
                  <p className="text-xs text-muted italic">No projects listed.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {selectedAppDetail.candidate.projects.map((pr, i) => (
                      <div key={i} className="rounded border border-border/60 bg-base/60 p-2.5">
                        <p className="font-semibold text-white">{pr.name}</p>
                        {pr.description && (
                          <p className="mt-1 text-[11px] text-muted leading-relaxed">{pr.description}</p>
                        )}
                        {(pr.technologies || []).length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {pr.technologies.map((t, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 font-mono text-[10px] text-purple-300"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills Inventory */}
              <div className="rounded-control border border-border/70 bg-input/25 p-3.5 text-xs">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-accent-hover mb-2">
                  Skills Inventory ({(selectedAppDetail.candidate.skills || []).length})
                </h4>
                {(selectedAppDetail.candidate.skills || []).length === 0 ? (
                  <p className="text-xs text-muted italic">No skills listed.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAppDetail.candidate.skills.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded border border-border bg-base/60 px-2.5 py-1 font-mono text-xs text-white"
                      >
                        {s.name}
                        <span className="text-[9px] uppercase text-accent-hover">({s.source || 'Portal'})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Questions Section at bottom when 'profile' tab is active */}
              {modalInitialFocus === 'profile' && modalQuestions.length > 0 && (
                <div className="rounded-control border border-purple-500/30 bg-purple-500/5 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                      <Sparkles size={13} /> Tailored AI Interview Questions ({modalQuestions.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {modalQuestions.slice(0, 5).map((q, idx) => (
                      <div key={q.id || idx} className="rounded border border-border bg-base/70 p-2.5 text-xs">
                        <p className="font-semibold text-white">Q{idx + 1}. {q.question}</p>
                        {q.answerGuidelines && (
                          <p className="mt-1 text-[11px] text-emerald-400">
                            Guideline: {q.answerGuidelines}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
                <a
                  href={`/api/applications/${selectedAppDetail.id}/resume`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-control border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition"
                >
                  <Download size={14} /> Open Attached PDF Resume
                </a>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setProfileModalOpen(false)}>
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setProfileModalOpen(false);
                      navigate(`/recruiter/jobs/${selectedAppDetail.jobId}/applicants/${selectedAppDetail.id}`);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <Sparkles size={14} /> Open Full Dossier & Evaluation Page
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-muted">Could not load candidate details.</div>
          )}
        </Modal>
      )}
    </>
  );
}
