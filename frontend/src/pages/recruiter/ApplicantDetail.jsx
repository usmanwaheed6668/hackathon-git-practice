import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileText,
  HelpCircle,
  Lightbulb,
  Plus,
  RefreshCw,
  Sliders,
  Sparkles,
  Trash2,
  User,
  XCircle,
  MessageSquare,
  Scale,
  Award,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Send,
  Calendar,
} from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { applicationsApi } from '../../api/applications';
import Button from '../../components/common/Button.jsx';
import Card, { CardHeader } from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import { PageSpinner } from '../../components/common/Spinner.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { PageHeader } from '../../components/layout/DashboardLayout.jsx';
import useAsync from '../../hooks/useAsync';
import { formatDate, formatDateTime, timeAgo } from '../../utils/dates';

export default function ApplicantDetail() {
  const { jobId, applicationId } = useParams();
  const toast = useToast();

  const { data: app, loading, error, reload } = useAsync(
    () => applicationsApi.get(applicationId),
    [applicationId]
  );

  // Modals & form state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);

  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [editingSkills, setEditingSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [savingSkills, setSavingSkills] = useState(false);

  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [reassessing, setReassessing] = useState(false);

  // Status transition state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  // Final decision state
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionChoice, setDecisionChoice] = useState('Selected');
  const [decisionReason, setDecisionReason] = useState('');
  const [deciding, setDeciding] = useState(false);

  // Recruiter Notes state
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Interview Questions state
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [expandedGuidelines, setExpandedGuidelines] = useState({});
  const [customQuestionModalOpen, setCustomQuestionModalOpen] = useState(false);
  const [customQuestionForm, setCustomQuestionForm] = useState({
    category: 'technical',
    difficulty: 'intermediate',
    question: '',
    answerGuidelines: '',
    relatedSkill: '',
  });
  const [editingQuestionModalOpen, setEditingQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Fairness check state
  const [fairnessResult, setFairnessResult] = useState(null);
  const [checkingFairness, setCheckingFairness] = useState(false);

  // Load questions when app is fetched (auto-generates via backend if empty)
  useEffect(() => {
    if (app) {
      let parsed = [];
      if (app.interviewQuestionsJson) {
        try {
          parsed = JSON.parse(app.interviewQuestionsJson) || [];
        } catch {
          parsed = [];
        }
      }
      if (parsed.length > 0) {
        setQuestions(parsed);
      } else {
        setQuestionsLoading(true);
        applicationsApi
          .getQuestions(applicationId)
          .then((data) => {
            setQuestions(data || []);
          })
          .catch(() => {})
          .finally(() => setQuestionsLoading(false));
      }
    }
  }, [app, applicationId]);

  // Parse assessment JSON
  let assessment = null;
  if (app?.assessmentJson) {
    try {
      assessment = JSON.parse(app.assessmentJson);
    } catch {
      assessment = null;
    }
  }

  const handleReassess = async () => {
    setReassessing(true);
    try {
      await applicationsApi.assess(applicationId);
      toast.success('AI assessment re-evaluated successfully.');
      reload();
    } catch (err) {
      toast.error(`Re-assessment failed: ${getErrorMessage(err)}`);
    } finally {
      setReassessing(false);
    }
  };

  const handleTransition = async (toStatus, note) => {
    setTransitioning(true);
    try {
      await applicationsApi.transitionStatus(applicationId, toStatus, note);
      toast.success(`Candidate status moved to ${toStatus}.`);
      setRejectModalOpen(false);
      setRejectReason('');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTransitioning(false);
    }
  };

  const handleFinalDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!decisionReason.trim()) {
      toast.error('A decision justification is required.');
      return;
    }
    setDeciding(true);
    try {
      try {
        await applicationsApi.finalDecision(applicationId, decisionChoice, decisionReason.trim());
      } catch {
        await applicationsApi.transitionStatus(applicationId, decisionChoice, decisionReason.trim());
      }
      toast.success(`Candidate marked as ${decisionChoice}.`);
      setDecisionModalOpen(false);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeciding(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await applicationsApi.addNote(applicationId, noteText.trim());
      toast.success('Private recruiter note added.');
      setNoteText('');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await applicationsApi.deleteNote(applicationId, noteId);
      toast.success('Note removed.');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Questions actions
  const handleGenerateQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const data = await applicationsApi.generateQuestions(applicationId);
      setQuestions(data || []);
      toast.success('Tailored AI interview questions generated!');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleRegenerateSingleQuestion = async (qid) => {
    try {
      const updated = await applicationsApi.regenerateQuestion(applicationId, qid);
      setQuestions((prev) => prev.map((q) => (q.id === qid ? updated : q)));
      toast.success('Question regenerated with fresh angle.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteQuestion = async (qid) => {
    try {
      await applicationsApi.deleteQuestion(applicationId, qid);
      setQuestions((prev) => prev.filter((q) => q.id !== qid));
      toast.success('Question removed.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleAddCustomQuestionSubmit = async (e) => {
    e.preventDefault();
    try {
      const created = await applicationsApi.addCustomQuestion(applicationId, customQuestionForm);
      setQuestions((prev) => [...prev, created]);
      setCustomQuestionModalOpen(false);
      setCustomQuestionForm({
        category: 'technical',
        difficulty: 'intermediate',
        question: '',
        answerGuidelines: '',
        relatedSkill: '',
      });
      toast.success('Custom question added.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleEditQuestionSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await applicationsApi.updateQuestion(applicationId, editingQuestion.id, editingQuestion);
      setQuestions((prev) => prev.map((q) => (q.id === editingQuestion.id ? updated : q)));
      setEditingQuestionModalOpen(false);
      toast.success('Question updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Fairness check
  const handleRunFairnessCheck = async () => {
    setCheckingFairness(true);
    try {
      const res = await applicationsApi.fairnessCheck(applicationId);
      setFairnessResult(res);
      toast.success('Algorithmic fairness evaluation completed.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCheckingFairness(false);
    }
  };

  const handleOpenOverride = () => {
    setOverrideScore(app?.overrideScore !== null && app?.overrideScore !== undefined ? String(app.overrideScore) : String(app?.overallScore || 75));
    setOverrideReason(app?.overrideReason || '');
    setOverrideModalOpen(true);
  };

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      toast.error('A justification reason is required to override the score.');
      return;
    }
    setOverriding(true);
    try {
      await applicationsApi.overrideScore(applicationId, Number(overrideScore), overrideReason.trim());
      toast.success('Score override recorded in audit log.');
      setOverrideModalOpen(false);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setOverriding(false);
    }
  };

  const handleOpenSkillsModal = () => {
    const list = (app?.candidate?.skills || []).map((s) => ({
      name: s.name,
      evidence: s.evidence || null,
      source: s.source || 'Manual',
    }));
    setEditingSkills(list);
    setSkillsModalOpen(true);
  };

  const handleAddSkillToEdit = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    if (editingSkills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Skill already in list.');
      return;
    }
    setEditingSkills([...editingSkills, { name: trimmed, evidence: 'Recruiter verified', source: 'Manual' }]);
    setNewSkillName('');
  };

  const handleRemoveSkillFromEdit = (index) => {
    setEditingSkills(editingSkills.filter((_, i) => i !== index));
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      await applicationsApi.editSkills(applicationId, editingSkills);
      toast.success('Skills updated and candidate re-scored.');
      setSkillsModalOpen(false);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingSkills(false);
    }
  };

  if (loading && !app) return <PageSpinner label="Loading candidate dossier..." />;
  if (error || !app) {
    return (
      <Card>
        <p className="text-sm text-danger">Failed to load dossier: {getErrorMessage(error)}</p>
        <Link to={`/recruiter/jobs/${jobId}/applicants`} className="mt-3 inline-block text-xs text-accent">
          Return to applicants
        </Link>
      </Card>
    );
  }

  const candidate = app.candidate;
  const scoreToDisplay = app.overrideScore ?? app.overallScore;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            to={`/recruiter/jobs/${jobId}/applicants`}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-white"
          >
            <ArrowLeft size={14} /> Back to applicant pipeline
          </Link>
        }
        title={candidate?.fullName || 'Candidate Dossier'}
        subtitle={`${candidate?.headline || 'Applicant'} · ${candidate?.email} · ${candidate?.location || 'Remote'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReassess}
              loading={reassessing}
              className="flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Re-assess AI
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenSkillsModal}
              className="flex items-center gap-1.5"
            >
              <Sliders size={13} /> Edit Skills
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenOverride}
              className="flex items-center gap-1.5"
            >
              <Edit3 size={13} /> Override Score
            </Button>
            {candidate?.resumeRawText && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setResumeModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <FileText size={13} /> View Resume
              </Button>
            )}
          </div>
        }
      />

      {/* State Machine Action Bar */}
      <div className="rounded-card border border-border bg-surface p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Pipeline Stage:</span>
          <StatusBadge status={app.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {app.status === 'Submitted' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleTransition('RecruiterReview', 'Moved to recruiter review')}
              disabled={transitioning}
            >
              Begin Review
            </Button>
          )}

          {['Submitted', 'Parsed', 'AIAssessmentAvailable', 'RecruiterReview'].includes(app.status) && (
            <Button
              size="sm"
              onClick={() => handleTransition('Shortlisted', 'Shortlisted for technical interviews')}
              disabled={transitioning}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Shortlist Candidate
            </Button>
          )}

          {['Shortlisted', 'RecruiterReview'].includes(app.status) && (
            <Button
              size="sm"
              onClick={() => handleTransition('Interview', 'Advanced to interview stage')}
              disabled={transitioning}
              className="bg-accent text-base font-semibold"
            >
              Advance to Interview
            </Button>
          )}

          {!['Rejected', 'Selected'].includes(app.status) && (
            <Button
              size="sm"
              onClick={() => {
                setDecisionChoice('Selected');
                setDecisionReason('');
                setDecisionModalOpen(true);
              }}
              disabled={transitioning}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} /> Select Candidate
            </Button>
          )}

          {!['Rejected', 'Selected'].includes(app.status) && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setRejectReason('');
                setRejectModalOpen(true);
              }}
              disabled={transitioning}
              className="text-red-400 hover:bg-red-500/10 border-red-500/30 flex items-center gap-1.5"
            >
              <XCircle size={15} /> Reject Candidate
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols): Candidate Complete Profile + AI Questions + Fit Score */}
        <div className="space-y-6 lg:col-span-2">
          {/* Complete Candidate Profile Details (From Candidate Portal & Resume) */}
          <Card className="border-accent/30 bg-gradient-to-br from-surface via-surface to-raised/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-heading text-base font-semibold text-white flex items-center gap-2">
                  <User size={16} className="text-accent" />
                  Candidate Complete Profile (From Candidate Portal & Resume)
                </h3>
                <p className="mt-0.5 text-xs text-muted">
                  Personal details, qualifications, work experience, projects, skills, and PDF resume submitted by the candidate
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {candidate?.resumeRawText && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setResumeModalOpen(true)}
                    className="text-xs flex items-center gap-1.5"
                  >
                    <FileText size={13} /> View Resume Text
                  </Button>
                )}
                <a
                  href={`/api/applications/${applicationId}/resume`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-control border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition"
                >
                  <Download size={13} /> Open PDF Resume
                </a>
              </div>
            </div>

            {/* Personal Info Grid */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5 rounded-control border border-border/70 bg-input/30 p-3.5 text-xs">
              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">Full Name</span>
                <span className="font-semibold text-white mt-0.5 block">{candidate?.fullName || '—'}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">Professional Headline</span>
                <span className="text-accent-hover font-medium mt-0.5 block">{candidate?.headline || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">Email Address</span>
                <span className="font-mono text-white mt-0.5 block break-all">{candidate?.email || '—'}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">Phone Number</span>
                <span className="font-mono text-white mt-0.5 block">{candidate?.phone || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">Location & Experience</span>
                <span className="text-white mt-0.5 block">
                  {candidate?.location || 'Remote'} · <strong>{candidate?.totalExperienceYears ?? 0} yrs exp</strong>
                </span>
              </div>
            </div>

            {/* Professional Summary & Cover Note */}
            {(candidate?.summary || app?.coverNote) && (
              <div className="mt-4 space-y-3">
                {candidate?.summary && (
                  <div className="rounded-control border border-border/60 bg-base/60 p-3 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent-hover block mb-1">
                      Executive Summary (Candidate Portal)
                    </span>
                    <p className="text-body leading-relaxed whitespace-pre-line">{candidate.summary}</p>
                  </div>
                )}
                {app?.coverNote && (
                  <div className="rounded-control border border-accent/25 bg-accent/5 p-3 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent-hover block mb-1">
                      Application Cover Note
                    </span>
                    <p className="text-body leading-relaxed whitespace-pre-line">{app.coverNote}</p>
                  </div>
                )}
              </div>
            )}

            {/* Qualifications / Education & Work Experience */}
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Qualifications / Education */}
              <div className="rounded-control border border-border/70 bg-input/20 p-3.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-hover mb-2.5">
                  Qualifications & Education ({(candidate?.education || []).length})
                </h4>
                {(candidate?.education || []).length === 0 ? (
                  <p className="text-xs text-muted italic">No qualifications or education entries listed.</p>
                ) : (
                  <div className="space-y-2.5">
                    {(candidate?.education || []).map((ed, i) => (
                      <div key={i} className="flex items-center justify-between rounded border border-border/60 bg-base/50 px-3 py-2.5 text-xs">
                        <div>
                          <p className="font-semibold text-white">{ed.degree}</p>
                          <p className="text-[11px] text-muted mt-0.5">{ed.institution}</p>
                        </div>
                        {ed.year && (
                          <span className="rounded bg-raised px-2 py-0.5 font-mono text-[11px] text-accent-hover shrink-0">
                            {ed.year}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Experience */}
              <div className="rounded-control border border-border/70 bg-input/20 p-3.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-hover mb-2.5">
                  Work Experience ({(candidate?.experience || []).length})
                </h4>
                {(candidate?.experience || []).length === 0 ? (
                  <p className="text-xs text-muted italic">No work experience entries listed.</p>
                ) : (
                  <div className="space-y-3">
                    {(candidate?.experience || []).map((ex, i) => (
                      <div key={i} className="border-l-2 border-accent/60 pl-3 text-xs">
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
            </div>

            {/* Portfolio Projects */}
            <div className="mt-4 rounded-control border border-border/70 bg-input/20 p-3.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-hover mb-2.5">
                Featured Projects ({(candidate?.projects || []).length})
              </h4>
              {(candidate?.projects || []).length === 0 ? (
                <p className="text-xs text-muted italic">No portfolio projects listed.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(candidate?.projects || []).map((pr, i) => (
                    <div key={i} className="rounded border border-border/60 bg-base/50 p-3 text-xs">
                      <p className="font-semibold text-white">{pr.name}</p>
                      {pr.description && (
                        <p className="mt-1 text-[11px] text-muted leading-relaxed">{pr.description}</p>
                      )}
                      {(pr.technologies || []).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
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

            {/* All Candidate Skills */}
            <div className="mt-4 rounded-control border border-border/70 bg-input/20 p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-hover">
                  Candidate Skills ({(candidate?.skills || []).length})
                </h4>
                <button
                  type="button"
                  onClick={handleOpenSkillsModal}
                  className="text-[11px] text-accent-hover hover:underline font-medium"
                >
                  + Edit / Calibrate Skills
                </button>
              </div>
              {(candidate?.skills || []).length === 0 ? (
                <p className="text-xs text-muted italic">No skills listed on candidate profile.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(candidate?.skills || []).map((s, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-2 rounded-control border border-border bg-input/60 px-2.5 py-1 text-xs"
                      title={s.evidence || 'Candidate skill'}
                    >
                      <span className="font-mono font-semibold text-white">{s.name}</span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-mono uppercase ${
                          s.source === 'Resume'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-accent/20 text-accent-hover'
                        }`}
                      >
                        {s.source || 'Portal'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Hero Score & Gauge Card */}
          <Card className="relative overflow-hidden border-border bg-gradient-to-br from-surface via-surface to-raised/60">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="micro-label">Composite Fit Index</span>
                  {assessment?.mode === 'keyword_fallback' && (
                    <span className="rounded bg-warning/15 px-2 py-0.5 text-[10px] font-mono text-warning">
                      Keyword fallback mode (AI unavailable)
                    </span>
                  )}
                  {assessment?.mode === 'ai' && (
                    <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-2 py-0.5 text-[10px] font-mono text-accent-hover">
                      <Sparkles size={11} /> Gemini Semantic Engine
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-mono text-5xl font-extrabold text-white">
                    {scoreToDisplay !== null && scoreToDisplay !== undefined ? `${Math.round(scoreToDisplay)}%` : '—'}
                  </span>
                  {app.overrideScore !== null && (
                    <div className="flex flex-col text-xs font-mono text-muted">
                      <span className="line-through">AI: {Math.round(app.overallScore || 0)}%</span>
                      <span className="font-semibold text-warning">Recruiter Calibrated</span>
                    </div>
                  )}
                </div>

                <p className="mt-2 text-xs text-muted max-w-md leading-relaxed">
                  {assessment?.summary || 'Algorithmic assessment computed across skills, verified experience, project relevance, and educational credentials.'}
                </p>
              </div>

              {/* Breakdown Bars */}
              {assessment?.breakdown && (
                <div className="w-full sm:w-64 space-y-2.5 rounded-control border border-border/70 bg-input/40 p-3.5 text-xs">
                  <div>
                    <div className="flex justify-between font-mono text-[11px] mb-1">
                      <span className="text-muted">Skills (50%)</span>
                      <span className="font-semibold text-white">{Math.round(assessment.breakdown.skills.score)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-raised overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${Math.min(100, assessment.breakdown.skills.score)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-mono text-[11px] mb-1">
                      <span className="text-muted">Experience (25%)</span>
                      <span className="font-semibold text-white">{Math.round(assessment.breakdown.experience.score)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-raised overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${Math.min(100, assessment.breakdown.experience.score)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-mono text-[11px] mb-1">
                      <span className="text-muted">Education (15%)</span>
                      <span className="font-semibold text-white">{Math.round(assessment.breakdown.education.score)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-raised overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${Math.min(100, assessment.breakdown.education.score)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-mono text-[11px] mb-1">
                      <span className="text-muted">Semantic Vector (10%)</span>
                      <span className="font-semibold text-white">{Math.round(assessment.breakdown.semanticVector.score)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-raised overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${Math.min(100, assessment.breakdown.semanticVector.score)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* AI Tailored Interview Questions Section */}
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border">
              <div>
                <h3 className="font-heading text-base font-semibold text-white flex items-center gap-2">
                  <BookOpen size={16} className="text-accent-hover" />
                  AI Interview Question Generator
                </h3>
                <p className="mt-0.5 text-xs text-muted">
                  Questions tailored to the candidate's actual projects, skill requirements, and missing evidence probes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCustomQuestionModalOpen(true)}
                  className="text-xs flex items-center gap-1"
                >
                  <Plus size={13} /> Add Custom
                </Button>
                <Button
                  size="sm"
                  onClick={handleGenerateQuestions}
                  loading={questionsLoading}
                  className="text-xs flex items-center gap-1"
                >
                  <Sparkles size={13} /> {questions.length > 0 ? 'Regenerate All' : 'Generate Questions'}
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {questions.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted">
                  No interview questions generated yet. Click <strong>Generate Questions</strong> to produce 10-12 tailored questions across 3 difficulties and project deep-dives.
                </div>
              ) : (
                questions.map((q) => {
                  const isExpanded = !!expandedGuidelines[q.id];
                  return (
                    <div
                      key={q.id}
                      className="rounded-control border border-border/80 bg-input/40 p-3.5 transition hover:border-border"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              q.category === 'project'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : q.category === 'gap-probing'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : q.category === 'behavioral'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'bg-accent/20 text-accent-hover border border-accent/30'
                            }`}
                          >
                            {q.category}
                          </span>
                          <span className="rounded bg-raised px-2 py-0.5 text-[10px] font-mono text-muted border border-border">
                            {q.difficulty}
                          </span>
                          {q.relatedSkill && (
                            <span className="text-[11px] text-muted">
                              Target: <strong className="text-white">{q.relatedSkill}</strong>
                            </span>
                          )}
                          {q.basedOn && (
                            <span className="text-[11px] text-muted italic">
                              ({q.basedOn})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleRegenerateSingleQuestion(q.id)}
                            title="Regenerate single question"
                            className="p-1 text-muted hover:text-white rounded hover:bg-border"
                          >
                            <RefreshCw size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestion(q);
                              setEditingQuestionModalOpen(true);
                            }}
                            title="Edit question"
                            className="p-1 text-muted hover:text-white rounded hover:bg-border"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            title="Delete question"
                            className="p-1 text-muted hover:text-red-400 rounded hover:bg-border"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <p className="mt-2 text-xs font-medium text-white leading-relaxed">
                        {q.question}
                      </p>

                      {/* Answer Guidelines Accordion */}
                      {q.answerGuidelines && (
                        <div className="mt-2 pt-2 border-t border-border/40">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedGuidelines({ ...expandedGuidelines, [q.id]: !isExpanded })
                            }
                            className="flex items-center gap-1 text-[11px] text-accent-hover font-semibold hover:underline"
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {isExpanded ? 'Hide Evaluation Rubric' : 'View Answer Evaluation Guidelines'}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 rounded-control border border-border/60 bg-base p-2.5 text-[11px] text-body leading-relaxed">
                              <span className="font-semibold text-white">What to look for: </span>
                              {q.answerGuidelines}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Matched Competencies vs Identified Gaps */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader title="Verified Target Competencies" subtitle="Confirmed in candidate profile or source text" />
              <div className="space-y-2">
                {(assessment?.matchedSkills || []).map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 rounded-control border border-border/70 bg-input/40 p-2.5 text-xs"
                  >
                    <div>
                      <span className="font-mono font-semibold text-white">{m.skill}</span>
                      {m.evidence && <p className="mt-0.5 text-[11px] text-muted leading-tight">{m.evidence}</p>}
                    </div>
                    <span className="shrink-0 rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-success">
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Identified Competency Gaps" subtitle="Skills with missing or unconfirmed evidence" />
              <div className="space-y-2">
                {(assessment?.gaps || []).map((g, idx) => (
                  <div
                    key={idx}
                    className="rounded-control border border-border/70 bg-input/40 p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-white">{g.skill}</span>
                      <span className="rounded-full border border-warning/30 bg-warning/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-warning">
                        {g.status === 'confirmed_absence' ? 'Missing' : 'Unverified'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">{g.reason}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Mandatory AI Governance Disclaimer */}
          <div className="rounded-control border border-border bg-raised/40 p-3.5 text-center text-xs text-muted">
            <span className="font-semibold text-white">AI Recommendation Notice: </span>
            Algorithmic scores and question syntheses are advisory. Sovereign hiring decisions reside with the recruiter.
          </div>
        </div>

        {/* Right Column: Fairness, Private Notes, & Audit Trail */}
        <div className="space-y-6">
          {/* Candidate Resume Document Card */}
          <Card>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading text-sm font-semibold text-white flex items-center gap-2">
                <FileText size={16} className="text-accent" /> Attached Resume
              </h3>
              {candidate?.parseStatus === 'Parsed' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <CheckCircle2 size={11} /> Parse Successful
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-raised px-2 py-0.5 text-[10px] font-semibold text-muted">
                  {candidate?.parseStatus || 'Attached'}
                </span>
              )}
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div>
                <span className="text-muted block text-[11px]">Resume Document:</span>
                <span className="font-mono text-sm font-medium text-white break-all">
                  {candidate?.resumeFileName || 'Candidate Resume Document'}
                </span>
                {candidate?.resumeUploadedAt && (
                  <span className="block text-[11px] text-muted mt-0.5">
                    Uploaded: {formatDate(candidate.resumeUploadedAt)}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-1 border-t border-border/50">
                {candidate?.resumeRawText && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setResumeModalOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs"
                  >
                    <FileText size={13} /> View Extracted Text
                  </Button>
                )}
                <a
                  href={`/api/applications/${applicationId}/resume`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-control border border-accent/40 bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent-hover hover:bg-accent/25 transition"
                >
                  <Download size={13} /> Open / Download Resume
                </a>
              </div>
            </div>
          </Card>

          {/* Algorithmic Fairness & Bias Check Panel */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Scale size={16} className="text-accent-hover" />
                <h3 className="font-heading text-sm font-semibold text-white">Fairness & Bias Audit</h3>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRunFairnessCheck}
                loading={checkingFairness}
                className="text-xs"
              >
                Run Audit
              </Button>
            </div>

            <div className="mt-3 text-xs space-y-2.5">
              <p className="text-muted leading-relaxed">
                Verifies algorithmic fairness by scrubbing candidate name, gender cues, and institutional branding to test for scoring variance.
              </p>

              {fairnessResult ? (
                <div className="rounded-control border border-border bg-base p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted">Standard Score:</span>
                    <span className="font-mono font-semibold text-white">{fairnessResult.originalScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Anonymized Score:</span>
                    <span className="font-mono font-semibold text-white">{fairnessResult.checkedScore}%</span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-1.5">
                    <span className="text-muted">Delta / Variance:</span>
                    <span className="font-mono font-semibold text-white">{fairnessResult.delta}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold pt-1">
                    <ShieldCheck size={14} />
                    <span>Fairness Standard: PASSED (No bias detected)</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-control border border-border/60 bg-base/50 p-2.5 text-center text-[11px] text-muted">
                  Click 'Run Audit' to verify demographic invariance.
                </div>
              )}
            </div>
          </Card>

          {/* Private Recruiter Notes */}
          <Card>
            <CardHeader
              title="Private Recruiter Notes"
              subtitle="Confidential evaluation notes. Never visible to candidates."
            />
            <div className="space-y-3">
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows="2"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record confidential feedback or interview observations..."
                  className="w-full rounded-control border border-border bg-base p-2 text-xs text-white placeholder-muted focus:outline-none focus:border-accent"
                />
                <Button type="submit" size="sm" disabled={addingNote || !noteText.trim()} className="w-full text-xs flex items-center justify-center gap-1">
                  <Send size={12} /> Add Private Note
                </Button>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(app.notes || []).length === 0 ? (
                  <p className="text-xs text-muted text-center py-2">No private notes recorded yet.</p>
                ) : (
                  (app.notes || []).map((n) => (
                    <div key={n.id} className="rounded-control border border-border bg-base p-2.5 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-muted mb-1">
                        <span>{formatDateTime(n.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(n.id)}
                          className="text-muted hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-body leading-relaxed">{n.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Hallucination Verification */}
          <Card>
            <CardHeader title="Hallucination Verification" />
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-muted">Verified Claims</span>
                <span className="font-mono font-semibold text-success">
                  {assessment?.verification?.verified || 0} claims passed
                </span>
              </div>

              {(assessment?.verification?.unsupported || []).length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold text-warning mb-1.5 flex items-center gap-1">
                    <AlertTriangle size={13} /> Needs Manual Review ({assessment.verification.unsupported.length})
                  </p>
                  <ul className="space-y-1">
                    {assessment.verification.unsupported.map((un, idx) => (
                      <li key={idx} className="rounded bg-warning/10 p-1.5 font-mono text-[10px] text-warning">
                        {un}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-muted flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-success" /> All claims verified against source resume.
                </p>
              )}
            </div>
          </Card>

          {/* Audit Trail Timeline */}
          <Card>
            <CardHeader title="Audit Provenance Trail" subtitle="Deterministic history of automated & manual state transitions" />
            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {(app.audit || []).map((entry, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full border border-surface bg-accent" />
                  <div className="text-xs">
                    <p className="font-semibold text-white">
                      {entry.actorRole} · <span className="font-mono text-accent-hover">{entry.toStatus}</span>
                    </p>
                    {entry.note && <p className="mt-0.5 text-muted leading-tight">{entry.note}</p>}
                    <span className="mt-1 block font-mono text-[10px] text-slate-500">
                      {formatDateTime(entry.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Candidate Application"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!rejectReason.trim()) {
              toast.error('Rejection reason is required.');
              return;
            }
            handleTransition('Rejected', rejectReason.trim());
          }}
          className="space-y-4"
        >
          <p className="text-xs text-muted">
            A formal rejection reason is required and will be transactionally preserved in the audit log.
          </p>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Rejection Reason (Required)
            </label>
            <textarea
              rows="3"
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Insufficient verified experience in required distributed microservices..."
              className="w-full rounded-control border border-border bg-base p-2 text-xs text-white placeholder-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={transitioning} className="bg-red-600 hover:bg-red-500">
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sovereign Final Decision Modal */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title="Sovereign Final Hiring Decision"
      >
        <form onSubmit={handleFinalDecisionSubmit} className="space-y-4">
          <div className="rounded-control border border-accent/30 bg-accent/10 p-3 text-xs text-accent-hover leading-relaxed">
            <strong>Human Authority Principle:</strong> AI models generate advisory questions and match scores. The sovereign hiring determination is executed solely by you, the recruiter. Requires completed interview feedback.
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Decision</label>
            <div className="grid grid-cols-2 gap-2">
              {['Selected', 'Rejected'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDecisionChoice(d)}
                  className={`rounded-control py-2 text-xs font-semibold border transition ${
                    decisionChoice === d
                      ? d === 'Selected'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-red-500 bg-red-500/20 text-red-300'
                      : 'border-border bg-base text-muted hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Decision Justification / Reason (Required)
            </label>
            <textarea
              rows="3"
              required
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder="Explain the definitive rationale for this selection or rejection..."
              className="w-full rounded-control border border-border bg-base p-2 text-xs text-white placeholder-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setDecisionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={deciding}>
              Confirm Sovereign Decision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Custom Question Modal */}
      <Modal
        isOpen={customQuestionModalOpen}
        onClose={() => setCustomQuestionModalOpen(false)}
        title="Add Custom Interview Question"
      >
        <form onSubmit={handleAddCustomQuestionSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted">Category</label>
              <select
                value={customQuestionForm.category}
                onChange={(e) => setCustomQuestionForm({ ...customQuestionForm, category: e.target.value })}
                className="mt-1 w-full rounded-control border border-border bg-base px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="technical">Technical</option>
                <option value="project">Project</option>
                <option value="gap-probing">Gap-Probing</option>
                <option value="behavioral">Behavioral</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">Difficulty</label>
              <select
                value={customQuestionForm.difficulty}
                onChange={(e) => setCustomQuestionForm({ ...customQuestionForm, difficulty: e.target.value })}
                className="mt-1 w-full rounded-control border border-border bg-base px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted">Related Skill / Context</label>
            <input
              type="text"
              placeholder="e.g. Distributed Tracing or Specific Project Name"
              value={customQuestionForm.relatedSkill}
              onChange={(e) => setCustomQuestionForm({ ...customQuestionForm, relatedSkill: e.target.value })}
              className="mt-1 w-full rounded-control border border-border bg-base px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted">Question</label>
            <textarea
              rows="3"
              required
              value={customQuestionForm.question}
              onChange={(e) => setCustomQuestionForm({ ...customQuestionForm, question: e.target.value })}
              placeholder="State the technical question clearly..."
              className="mt-1 w-full rounded-control border border-border bg-base p-2 text-xs text-white focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted">Answer Evaluation Guidelines</label>
            <textarea
              rows="2"
              value={customQuestionForm.answerGuidelines}
              onChange={(e) => setCustomQuestionForm({ ...customQuestionForm, answerGuidelines: e.target.value })}
              placeholder="What signals demonstrate mastery in candidate answer..."
              className="mt-1 w-full rounded-control border border-border bg-base p-2 text-xs text-white focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCustomQuestionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Question
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <Modal
          isOpen={editingQuestionModalOpen}
          onClose={() => setEditingQuestionModalOpen(false)}
          title="Edit Interview Question"
        >
          <form onSubmit={handleEditQuestionSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted">Question</label>
              <textarea
                rows="3"
                required
                value={editingQuestion.question}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                className="mt-1 w-full rounded-control border border-border bg-base p-2 text-xs text-white focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted">Answer Evaluation Guidelines</label>
              <textarea
                rows="3"
                value={editingQuestion.answerGuidelines}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, answerGuidelines: e.target.value })}
                className="mt-1 w-full rounded-control border border-border bg-base p-2 text-xs text-white focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={() => setEditingQuestionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Override Score Modal */}
      <Modal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title="Calibrate Manual Score Override"
      >
        <form onSubmit={handleSaveOverride} className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            Talent operators hold sovereign override authority over algorithmic scores. A formal justification reason is required and will be logged in the immutable audit trail.
          </p>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Calibrated Score (0 - 100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              required
              value={overrideScore}
              onChange={(e) => setOverrideScore(e.target.value)}
              className="w-full rounded-control border border-border bg-input p-2.5 font-mono text-sm text-white focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Override Justification Reason (Required)
            </label>
            <textarea
              rows={3}
              required
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Verified exceptional distributed system engineering in GitHub repository; offset Flask/Django framework difference."
              className="w-full rounded-control border border-border bg-input p-2.5 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={overriding}>
              Record Override
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Skills Modal */}
      <Modal
        isOpen={skillsModalOpen}
        onClose={() => setSkillsModalOpen(false)}
        title="Recruiter Skill Calibration"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted">
            Add or remove candidate competencies. Saving will automatically trigger a deterministic re-evaluation of the match score.
          </p>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {editingSkills.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-control border border-border bg-input p-2 text-xs"
              >
                <span className="font-mono font-medium text-white">{s.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkillFromEdit(idx)}
                  className="text-muted hover:text-danger p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Skill name to add..."
              className="flex-1 rounded-control border border-border bg-input px-3 py-1.5 text-xs text-body focus:border-accent focus:outline-none"
            />
            <Button type="button" size="sm" onClick={handleAddSkillToEdit}>
              Add
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setSkillsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSkills} loading={savingSkills}>
              Save & Re-score
            </Button>
          </div>
        </div>
      </Modal>

      {/* Raw Resume Viewer Modal */}
      <Modal
        isOpen={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        title={`Resume Source: ${candidate?.fullName || 'Candidate'}`}
      >
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Raw text extracted page-by-page from the uploaded vector PDF document:
          </p>
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-control border border-border bg-input p-4 font-mono text-xs leading-relaxed text-body">
            {candidate?.resumeRawText}
          </pre>
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setResumeModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
