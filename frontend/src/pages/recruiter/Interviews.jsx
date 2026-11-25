import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Star,
  Award,
  Filter,
} from 'lucide-react';
import { interviewsApi } from '../../api/interviews';
import { applicationsApi } from '../../api/applications';
import { jobsApi } from '../../api/jobs';
import { Button } from '../../components/common/Button.jsx';
import { PageSpinner } from '../../components/common/Spinner.jsx';

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [jobs, setJobs] = useState([]);

  // Schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    applicationId: '',
    interviewerName: '',
    type: 'Technical',
    date: '',
    startTime: '10:00 AM',
    durationMinutes: 45,
    mode: 'Online',
    linkOrLocation: '',
    notes: '',
    confirmOverride: false,
  });
  const [availableApplications, setAvailableApplications] = useState([]);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  // Feedback modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    technicalRating: 4,
    communicationRating: 4,
    problemSolvingRating: 4,
    cultureFitRating: 4,
    strengths: '',
    concerns: '',
    recommendation: 'Yes',
  });
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Final Decision modal state
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionTarget, setDecisionTarget] = useState(null);
  const [decisionForm, setDecisionForm] = useState({
    decision: 'Selected',
    reason: '',
  });
  const [decisionLoading, setDecisionLoading] = useState(false);

  // AI Interview Questions modal state for Interviewers
  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
  const [questionsInterviewTarget, setQuestionsInterviewTarget] = useState(null);
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const handleOpenQuestionsModal = async (interview) => {
    setQuestionsInterviewTarget(interview);
    setQuestionsModalOpen(true);
    setQuestionsLoading(true);
    setInterviewQuestions([]);
    try {
      const list = await applicationsApi.getQuestions(interview.applicationId);
      setInterviewQuestions(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleRegenerateInterviewQuestions = async () => {
    if (!questionsInterviewTarget?.applicationId) return;
    setQuestionsLoading(true);
    try {
      const list = await applicationsApi.generateQuestions(questionsInterviewTarget.applicationId);
      setInterviewQuestions(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const [message, setMessage] = useState(null);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const data = await interviewsApi.list({ status: statusFilter || undefined });
      setInterviews(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [statusFilter]);

  useEffect(() => {
    // Load jobs & applicants for schedule dropdown
    async function loadShortlisted() {
      try {
        const jobList = await jobsApi.listMine();
        setJobs(jobList || []);

        const apps = [];
        for (const j of jobList || []) {
          try {
            const list = await jobsApi.applications(j.id);
            for (const a of list || []) {
              apps.push({ ...a, jobTitle: j.title });
            }
          } catch {}
        }
        setAvailableApplications(apps);
      } catch (err) {
        console.error('Failed to load available applicants:', err);
      }
    }
    loadShortlisted();
  }, []);

  const handleOpenSchedule = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    setScheduleForm({
      applicationId: availableApplications[0]?.id || '',
      interviewerName: 'Sarah Jenkins',
      type: 'Technical',
      date: dateStr,
      startTime: '10:00 AM',
      durationMinutes: 45,
      mode: 'Online',
      linkOrLocation: 'https://meet.google.com/tlq-session',
      notes: '',
      confirmOverride: false,
    });
    setConflictWarning(null);
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setSchedulingLoading(true);
    setConflictWarning(null);
    try {
      await interviewsApi.schedule({
        applicationId: scheduleForm.applicationId,
        interviewerName: scheduleForm.interviewerName,
        type: scheduleForm.type,
        scheduledAt: new Date(scheduleForm.date).toISOString(),
        startTime: scheduleForm.startTime,
        durationMinutes: parseInt(scheduleForm.durationMinutes),
        mode: scheduleForm.mode,
        linkOrLocation: scheduleForm.linkOrLocation,
        notes: scheduleForm.notes,
        confirmOverride: scheduleForm.confirmOverride,
      });
      setScheduleModalOpen(false);
      setMessage({ type: 'success', text: 'Interview scheduled successfully!' });
      fetchInterviews();
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictWarning(err.response?.data?.title || 'Scheduling Conflict Detected');
      } else {
        setMessage({ type: 'error', text: err.response?.data?.title || 'Failed to schedule interview' });
      }
    } finally {
      setSchedulingLoading(false);
    }
  };

  const handleCancelInterview = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this interview?')) return;
    try {
      await interviewsApi.cancel(id);
      setMessage({ type: 'success', text: 'Interview cancelled.' });
      fetchInterviews();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to cancel interview.' });
    }
  };

  const handleOpenFeedback = (interview) => {
    setSelectedInterview(interview);
    setFeedbackForm({
      technicalRating: interview.technicalRating || 4,
      communicationRating: interview.communicationRating || 4,
      problemSolvingRating: interview.problemSolvingRating || 4,
      cultureFitRating: interview.cultureFitRating || 4,
      strengths: interview.strengths || '',
      concerns: interview.concerns || '',
      recommendation: interview.recommendation || 'Yes',
    });
    setFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackLoading(true);
    try {
      await interviewsApi.submitFeedback(selectedInterview.id, feedbackForm);
      setFeedbackModalOpen(false);
      setMessage({ type: 'success', text: 'Feedback submitted successfully!' });
      fetchInterviews();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.title || 'Failed to submit feedback' });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleOpenDecision = (interview) => {
    setDecisionTarget(interview);
    setDecisionForm({
      decision: 'Selected',
      reason: 'Candidate demonstrated exemplary engineering craftsmanship and problem-solving velocity.',
    });
    setDecisionModalOpen(true);
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    setDecisionLoading(true);
    try {
      await applicationsApi.finalDecision(
        decisionTarget.applicationId,
        decisionForm.decision,
        decisionForm.reason
      );
      setDecisionModalOpen(false);
      setMessage({
        type: 'success',
        text: `Final sovereign decision recorded: ${decisionForm.decision}. (Authority: Recruiter)`,
      });
      fetchInterviews();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.title || 'Failed to record decision. Feedback is required first.',
      });
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Interviews & Evaluation</h1>
          <p className="mt-1 text-sm text-muted">
            Manage interview pipelines, conduct conflict-free scheduling, and record structured evaluations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleOpenSchedule} className="flex items-center gap-2">
            <Plus size={16} /> Schedule Interview
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center justify-between rounded-control p-3 text-sm border ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Filter size={16} className="text-muted mr-1" />
        {['', 'Scheduled', 'Completed', 'Cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`rounded-control px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === st
                ? 'bg-raised text-accent-hover ring-1 ring-border'
                : 'text-muted hover:bg-raised hover:text-white'
            }`}
          >
            {st || 'All Interviews'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <PageSpinner label="Loading scheduled interviews..." />
      ) : interviews.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted/50" />
          <h3 className="mt-3 text-sm font-semibold text-white">No interviews found</h3>
          <p className="mt-1 text-xs text-muted">
            {statusFilter ? `No interviews matching status '${statusFilter}'.` : 'Click Schedule Interview to book candidate sessions.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {interviews.map((iv) => (
            <div
              key={iv.id}
              className="rounded-card border border-border bg-surface p-5 shadow-sm transition hover:border-border/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase bg-accent/15 text-accent-hover border border-accent/30">
                      {iv.type}
                    </span>
                    <h3 className="mt-2 font-heading text-base font-semibold text-white">
                      {iv.candidateName}
                    </h3>
                    <p className="text-xs text-muted">{iv.jobTitle}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      iv.status === 'Completed'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : iv.status === 'Cancelled'
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {iv.status}
                  </span>
                </div>

                {/* Logistics */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-body border-t border-border/50 pt-3">
                  <div className="flex items-center gap-1.5 text-muted">
                    <Calendar size={14} className="text-accent" />
                    <span>{new Date(iv.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted">
                    <Clock size={14} className="text-accent" />
                    <span>{iv.startTime} ({iv.durationMinutes}m)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted">
                    <User size={14} className="text-accent" />
                    <span>Interviewer: {iv.interviewerName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted truncate">
                    {iv.mode === 'Online' ? <Video size={14} className="text-accent" /> : <MapPin size={14} className="text-accent" />}
                    <span className="truncate">{iv.linkOrLocation || iv.mode}</span>
                  </div>
                </div>

                {/* Feedback pill display if completed */}
                {iv.feedbackSubmittedAt && (
                  <div className="mt-3 rounded-control border border-border/80 bg-raised/50 p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">Recommendation:</span>
                      <span
                        className={`font-bold ${
                          iv.recommendation?.includes('Yes') ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {iv.recommendation}
                      </span>
                    </div>
                    <div className="mt-1.5 flex gap-2 text-[11px] text-muted">
                      <span>Tech: <strong className="text-white">{iv.technicalRating}/5</strong></span>
                      <span>Comm: <strong className="text-white">{iv.communicationRating}/5</strong></span>
                      <span>Problem: <strong className="text-white">{iv.problemSolvingRating}/5</strong></span>
                    </div>
                    {iv.strengths && (
                      <p className="mt-1 text-[11px] text-body line-clamp-1">
                        <strong className="text-white">Strengths:</strong> {iv.strengths}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
                <button
                  type="button"
                  onClick={() => handleOpenQuestionsModal(iv)}
                  className="inline-flex items-center gap-1 rounded-control border border-purple-500/40 bg-purple-500/15 px-2.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/25 transition"
                >
                  ✨ AI Interview Questions
                </button>
                <a
                  href={`/api/applications/${iv.applicationId}/resume`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-control border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition"
                >
                  PDF Resume
                </a>
                {iv.status === 'Scheduled' && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenFeedback(iv)}
                      className="text-xs flex items-center gap-1"
                    >
                      <Star size={13} /> {iv.feedbackSubmittedAt ? 'Update Feedback' : 'Submit Feedback'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleCancelInterview(iv.id)}
                      className="rounded-control px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {iv.feedbackSubmittedAt && (
                  <Button
                    size="sm"
                    onClick={() => handleOpenDecision(iv)}
                    className="ml-auto text-xs flex items-center gap-1 bg-accent/20 text-accent-hover hover:bg-accent/30"
                  >
                    <Award size={13} /> Sovereign Final Decision
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-card border border-border bg-surface p-6 shadow-2xl">
            <h2 className="font-heading text-lg font-bold text-white">Schedule Interview</h2>
            <p className="mt-1 text-xs text-muted">
              Select candidate, specify logistics, and verify slot conflict checks.
            </p>

            {conflictWarning && (
              <div className="mt-4 rounded-control border border-amber-500/30 bg-amber-500/15 p-3 text-xs text-amber-200 flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Schedule Conflict Warning</p>
                  <p className="mt-0.5">{conflictWarning}</p>
                  <label className="mt-2 flex items-center gap-2 cursor-pointer text-white font-medium">
                    <input
                      type="checkbox"
                      checked={scheduleForm.confirmOverride}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, confirmOverride: e.target.checked })
                      }
                      className="rounded border-border bg-base text-accent focus:ring-accent"
                    />
                    I understand and confirm override for interviewer conflict
                  </label>
                </div>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted">Candidate Application</label>
                <select
                  required
                  value={scheduleForm.applicationId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, applicationId: e.target.value })}
                  className="mt-1 w-full rounded-control border border-border bg-base px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                >
                  <option value="">{availableApplications.length === 0 ? 'No applicants available' : 'Select candidate'}</option>
                  {availableApplications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.candidateName} — {a.jobTitle} ({a.status})
                    </option>
                  ))}
                </select>
                {availableApplications.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-400">
                    No applicants currently found across your job requisitions.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted">Interviewer Name</label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.interviewerName}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, interviewerName: e.target.value })}
                    className="mt-1 w-full rounded-control border border-border bg-base px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">Interview Type</label>
                  <select
                    value={scheduleForm.type}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}
                    className="mt-1 w-full rounded-control border border-border bg-base px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="Technical">Technical</option>
                    <option value="HR">HR Screen</option>
                    <option value="Managerial">Managerial</option>
                    <option value="Final">Final Executive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted">Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="mt-1 w-full rounded-control border border-border bg-base px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">Start Time</label>
                  <input
                    type="text"
                    required
                    placeholder="10:00 AM"
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    className="mt-1 w-full rounded-control border border-border bg-base px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">Duration (min)</label>
                  <input
                    type="number"
                    min="15"
                    max="240"
                    required
                    value={scheduleForm.durationMinutes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, durationMinutes: e.target.value })}
                    className="mt-1 w-full rounded-control border border-border bg-base px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted">Mode</label>
                  <select
                    value={scheduleForm.mode}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, mode: e.target.value })}
                    className="mt-1 w-full rounded-control border border-border bg-base px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="Online">Online Video</option>
                    <option value="On-site">On-site Office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">Meeting Link or Location</label>
                  <input
                    type="text"
                    placeholder="https://meet.google.com/..."
                    value={scheduleForm.linkOrLocation}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, linkOrLocation: e.target.value })}
                    className="mt-1 w-full rounded-control border border-border bg-base px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setScheduleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={schedulingLoading}>
                  {schedulingLoading ? 'Scheduling...' : 'Schedule Interview'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Structured Feedback Modal */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-card border border-border bg-surface p-6 shadow-2xl">
            <h2 className="font-heading text-lg font-bold text-white">Interview Feedback & Evaluation</h2>
            <p className="mt-1 text-xs text-muted">
              Submit structured 1-5 ratings and hiring recommendation for candidate <strong>{selectedInterview?.candidateName}</strong>.
            </p>

            <form onSubmit={handleFeedbackSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted">Technical Competency (1-5)</label>
                  <select
                    value={feedbackForm.technicalRating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, technicalRating: parseInt(e.target.value) })}
                    className="mt-1 w-full rounded-control border border-border bg-base px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>{num} - {num === 5 ? 'Mastery' : num === 4 ? 'Strong' : num === 3 ? 'Adequate' : 'Deficient'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">Communication (1-5)</label>
                  <select
                    value={feedbackForm.communicationRating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, communicationRating: parseInt(e.target.value) })}
                    className="mt-1 w-full rounded-control border border-border bg-base px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>{num} / 5</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">Problem Solving (1-5)</label>
                  <select
                    value={feedbackForm.problemSolvingRating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, problemSolvingRating: parseInt(e.target.value) })}
                    className="mt-1 w-full rounded-control border border-border bg-base px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>{num} / 5</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">Culture & Values Fit (1-5)</label>
                  <select
                    value={feedbackForm.cultureFitRating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, cultureFitRating: parseInt(e.target.value) })}
                    className="mt-1 w-full rounded-control border border-border bg-base px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>{num} / 5</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted">Hiring Recommendation</label>
                <div className="mt-1.5 grid grid-cols-4 gap-2">
                  {['StrongYes', 'Yes', 'No', 'StrongNo'].map((rec) => (
                    <button
                      key={rec}
                      type="button"
                      onClick={() => setFeedbackForm({ ...feedbackForm, recommendation: rec })}
                      className={`rounded-control py-2 text-xs font-semibold border transition ${
                        feedbackForm.recommendation === rec
                          ? rec.includes('Yes')
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-red-500/20 border-red-500 text-red-300'
                          : 'border-border bg-base text-muted hover:bg-raised hover:text-white'
                      }`}
                    >
                      {rec}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted">Demonstrated Strengths</label>
                <textarea
                  rows="2"
                  value={feedbackForm.strengths}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, strengths: e.target.value })}
                  placeholder="Key technical capabilities and project triumphs observed..."
                  className="mt-1 w-full rounded-control border border-border bg-base p-2 text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted">Concerns / Gaps</label>
                <textarea
                  rows="2"
                  value={feedbackForm.concerns}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, concerns: e.target.value })}
                  placeholder="Areas needing mentorship or further validation..."
                  className="mt-1 w-full rounded-control border border-border bg-base p-2 text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFeedbackModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={feedbackLoading}>
                  {feedbackLoading ? 'Saving...' : 'Submit Structured Feedback'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sovereign Final Decision Modal */}
      {decisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-2xl">
            <h2 className="font-heading text-lg font-bold text-white">Sovereign Final Decision</h2>
            <p className="mt-1 text-xs text-muted">
              Make the final hiring determination for <strong>{decisionTarget?.candidateName}</strong> on job <strong>{decisionTarget?.jobTitle}</strong>.
            </p>

            <div className="mt-3 rounded-control border border-accent/30 bg-accent/10 p-2.5 text-xs text-accent-hover">
              <strong>Human Authority Principle:</strong> This decision is executed under the sole authority of the recruiter. AI assessments and question generation serve only as advisory intelligence.
            </div>

            <form onSubmit={handleDecisionSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted">Decision</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {['Selected', 'Rejected'].map((dec) => (
                    <button
                      key={dec}
                      type="button"
                      onClick={() => setDecisionForm({ ...decisionForm, decision: dec })}
                      className={`rounded-control py-2 text-xs font-semibold border transition ${
                        decisionForm.decision === dec
                          ? dec === 'Selected'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-red-500/20 border-red-500 text-red-300'
                          : 'border-border bg-base text-muted hover:bg-raised hover:text-white'
                      }`}
                    >
                      {dec}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted">Decision Justification / Reason</label>
                <textarea
                  rows="3"
                  required
                  value={decisionForm.reason}
                  onChange={(e) => setDecisionForm({ ...decisionForm, reason: e.target.value })}
                  placeholder="Explain the basis for this final decision..."
                  className="mt-1 w-full rounded-control border border-border bg-base p-2 text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setDecisionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={decisionLoading}>
                  {decisionLoading ? 'Submitting...' : 'Confirm Final Decision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Interview Questions Modal for Conducting the Interview */}
      {questionsModalOpen && questionsInterviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-card border border-border bg-surface p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="font-heading text-lg font-bold text-white">
                  AI Interview Questions — {questionsInterviewTarget.candidateName}
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  Role: {questionsInterviewTarget.jobTitle} · Tailored questions & evaluation guidelines for interviewer
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleRegenerateInterviewQuestions}
                  disabled={questionsLoading}
                  className="text-xs"
                >
                  {questionsLoading ? 'Generating...' : '✨ Generate / Regenerate AI Questions'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuestionsModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {questionsLoading ? (
                <div className="py-10 text-center text-xs text-muted">
                  Generating tailored AI interview questions for {questionsInterviewTarget.candidateName}...
                </div>
              ) : interviewQuestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  No questions found. Click <strong>Generate / Regenerate AI Questions</strong> above.
                </div>
              ) : (
                interviewQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="rounded-control border border-border bg-input/40 p-3.5 text-xs"
                  >
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
                      <div className="mt-2 rounded border border-emerald-500/25 bg-emerald-500/10 p-2 text-[11px] text-emerald-300">
                        <strong className="text-emerald-400">Expected Answer Guideline: </strong>
                        {q.answerGuidelines}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

