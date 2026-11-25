import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronRight, DollarSign, FileText, MapPin, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { applicationsApi } from '../../api/applications';
import { candidatesApi } from '../../api/candidates';
import { jobsApi } from '../../api/jobs';
import Button from '../../components/common/Button.jsx';
import Card, { CardHeader } from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import { PageSpinner } from '../../components/common/Spinner.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { PageHeader } from '../../components/layout/DashboardLayout.jsx';
import useAsync from '../../hooks/useAsync';
import { formatDate, formatSalaryRange } from '../../utils/dates';

export default function JobView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);

  const { data: profile } = useAsync(candidatesApi.me, []);
  const { data: job, loading, error, reload } = useAsync(() => jobsApi.getOpen(id), [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      await applicationsApi.apply(job.id, coverNote.trim() || undefined);
      toast.success('Application submitted successfully!');
      setApplyModalOpen(false);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <PageSpinner label="Loading requisition details..." />;
  if (error || !job) {
    return (
      <Card>
        <p className="text-sm text-danger">Failed to load job: {getErrorMessage(error)}</p>
        <Link to="/candidate/jobs" className="mt-3 inline-block text-xs text-accent">
          Return to open positions
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
          <Link to="/candidate/jobs" className="flex items-center gap-1.5 text-xs text-muted hover:text-white">
            <ArrowLeft size={14} /> Back to open roles
          </Link>
        }
        title={job.title}
        subtitle={`${job.department} · ${job.location} · ${job.type}`}
        actions={
          job.hasApplied ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                <CheckCircle2 size={14} /> Application Submitted
              </span>
              <Link to="/candidate/applications">
                <Button variant="secondary" size="sm">
                  Track in Applications
                </Button>
              </Link>
            </div>
          ) : job.status === 'Closed' ? (
            <span className="rounded-full bg-raised px-3 py-1 text-xs font-medium text-muted">
              Position Closed
            </span>
          ) : (
            <Button onClick={() => setApplyModalOpen(true)} className="flex items-center gap-2">
              <Send size={15} /> Apply for this role
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Role Overview" />
            <div className="whitespace-pre-line text-sm leading-relaxed text-body">
              {job.description}
            </div>
          </Card>

          <Card>
            <CardHeader title="Skill Profile" subtitle="Competencies evaluated during matching" />
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Required Competencies ({requiredSkills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {requiredSkills.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-accent/25 bg-accent/15 px-3 py-1 font-mono text-xs font-medium text-accent-hover"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>

              {preferredSkills.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    Preferred Competencies ({preferredSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {preferredSkills.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-border bg-raised px-3 py-1 font-mono text-xs text-body"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
            <CardHeader title="Position Highlights" />
            <dl className="space-y-3.5 text-xs">
              <div>
                <dt className="text-muted">Target Compensation</dt>
                <dd className="mt-1 font-mono text-base font-semibold text-accent-hover">
                  {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Location</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-white">
                  <MapPin size={14} className="text-muted" /> {job.location}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Department</dt>
                <dd className="mt-1 text-sm font-medium text-white">{job.department}</dd>
              </div>
              <div>
                <dt className="text-muted">Employment Type</dt>
                <dd className="mt-1 text-sm font-medium text-white">{job.type}</dd>
              </div>
              <div>
                <dt className="text-muted">Minimum Experience</dt>
                <dd className="mt-1 text-sm font-medium text-white">{job.minExperienceYears} years</dd>
              </div>
              <div>
                <dt className="text-muted">Posted</dt>
                <dd className="mt-1 text-body">{formatDate(job.createdAt)}</dd>
              </div>
            </dl>

            {!job.hasApplied && job.status === 'Open' && (
              <div className="mt-6 pt-4 border-t border-border">
                <Button onClick={() => setApplyModalOpen(true)} className="w-full flex items-center justify-center gap-2">
                  <Send size={15} /> Apply Now
                </Button>
              </div>
            )}
          </Card>

          <Card className="border border-accent/20 bg-accent/5">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="shrink-0 text-accent" />
              <div>
                <h4 className="text-xs font-semibold text-white">Candidate Privacy Guarantee</h4>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Your profile details and resume artifacts are exclusively accessible by the authorized hiring squad for this requisition.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title={`Apply: ${job.title}`}
      >
        <form onSubmit={handleApply} className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            Your verified candidate dossier and uploaded resume will be attached to this requisition. You may optionally include a brief note to the hiring squad below.
          </p>

          {profile?.resumeFileName ? (
            <div className="flex items-center gap-2.5 rounded-control border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-white">Attached Resume: </span>
                <span className="font-mono text-emerald-200">{profile.resumeFileName}</span>
                <span className="block text-[11px] text-emerald-400/90 mt-0.5">
                  This PDF resume is attached to your profile and will be sent directly to the recruiter with your application.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-control border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              <FileText size={16} className="text-amber-400 shrink-0" />
              <span>Tip: Upload a PDF resume on your Profile page so recruiters can review your original document.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Cover Note (Optional)
            </label>
            <textarea
              rows={4}
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              placeholder="Highlight key engineering contributions, system architecture experience, or relevant repositories..."
              className="w-full rounded-control border border-border bg-input p-3 text-sm text-body placeholder-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={applying}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

