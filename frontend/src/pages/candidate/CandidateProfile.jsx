import { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, FileText, Plus, RefreshCw, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { candidatesApi } from '../../api/candidates';
import Button from '../../components/common/Button.jsx';
import Card, { CardHeader } from '../../components/common/Card.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import { PageSpinner } from '../../components/common/Spinner.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { PageHeader } from '../../components/layout/DashboardLayout.jsx';
import useAsync from '../../hooks/useAsync';
import { formatDate } from '../../utils/dates';

export default function CandidateProfile() {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const { data: profile, loading, reload } = useAsync(candidatesApi.me, []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewResumeModal, setViewResumeModal] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [totalExperienceYears, setTotalExperienceYears] = useState(0);

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [newEvidence, setNewEvidence] = useState('');

  const [education, setEducation] = useState([]);
  const [newDegree, setNewDegree] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newYear, setNewYear] = useState('');

  const [experience, setExperience] = useState([]);
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpCompany, setNewExpCompany] = useState('');
  const [newExpStartYear, setNewExpStartYear] = useState('');
  const [newExpEndYear, setNewExpEndYear] = useState('');
  const [newExpDesc, setNewExpDesc] = useState('');

  const [projects, setProjects] = useState([]);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjTech, setNewProjTech] = useState('');

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName || '');
    setEmail(profile.email || '');
    setPhone(profile.phone || '');
    setLocation(profile.location || '');
    setHeadline(profile.headline || '');
    setSummary(profile.summary || '');
    setTotalExperienceYears(profile.totalExperienceYears || 0);
    setSkills(profile.skills || []);
    setEducation(profile.education || []);
    setExperience(profile.experience || []);
    setProjects(profile.projects || []);
  }, [profile]);

  // Skill handlers
  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Skill already exists.');
      return;
    }
    setSkills([...skills, { name: trimmed, evidence: newEvidence.trim() || null, source: 'Manual' }]);
    setNewSkill('');
    setNewEvidence('');
  };

  const handleRemoveSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // Education handlers
  const handleAddEducation = () => {
    if (!newDegree.trim() || !newInstitution.trim()) return;
    setEducation([
      ...education,
      { degree: newDegree.trim(), institution: newInstitution.trim(), year: newYear ? Number(newYear) : null },
    ]);
    setNewDegree('');
    setNewInstitution('');
    setNewYear('');
  };

  const handleRemoveEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Experience handlers
  const handleAddExperience = () => {
    if (!newExpTitle.trim() || !newExpCompany.trim()) return;
    setExperience([
      ...experience,
      {
        title: newExpTitle.trim(),
        company: newExpCompany.trim(),
        startYear: newExpStartYear ? Number(newExpStartYear) : null,
        endYear: newExpEndYear ? Number(newExpEndYear) : null,
        description: newExpDesc.trim() || null,
      },
    ]);
    setNewExpTitle('');
    setNewExpCompany('');
    setNewExpStartYear('');
    setNewExpEndYear('');
    setNewExpDesc('');
  };

  const handleRemoveExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  // Project handlers
  const handleAddProject = () => {
    if (!newProjName.trim()) return;
    const techs = newProjTech
      ? newProjTech.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    setProjects([
      ...projects,
      { name: newProjName.trim(), description: newProjDesc.trim() || null, technologies: techs },
    ]);
    setNewProjName('');
    setNewProjDesc('');
    setNewProjTech('');
  };

  const handleRemoveProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  // File upload handler
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('DOCX not supported yet, please upload a PDF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5 MB limit.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const res = await candidatesApi.uploadResume(file, (p) => setUploadProgress(p));
      toast.success(res.message || 'Resume uploaded and parsed successfully.');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReparse = async () => {
    setReparsing(true);
    try {
      await candidatesApi.reparse();
      toast.success('Resume parsed and structured profile updated with AI.');
      reload();
    } catch (err) {
      toast.error(`Re-parsing failed: ${getErrorMessage(err)}`);
    } finally {
      setReparsing(false);
    }
  };

  // Save profile
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const skillsToSave = [...skills];
      if (newSkill.trim() && !skillsToSave.some((s) => s.name.toLowerCase() === newSkill.trim().toLowerCase())) {
        skillsToSave.push({ name: newSkill.trim(), evidence: newEvidence.trim() || null, source: 'Manual' });
        setNewSkill('');
        setNewEvidence('');
      }

      const eduToSave = [...education];
      if (newDegree.trim() && newInstitution.trim()) {
        eduToSave.push({
          degree: newDegree.trim(),
          institution: newInstitution.trim(),
          year: newYear ? Number(newYear) : null,
        });
        setNewDegree('');
        setNewInstitution('');
        setNewYear('');
      }

      const expToSave = [...experience];
      if (newExpTitle.trim() && newExpCompany.trim()) {
        expToSave.push({
          title: newExpTitle.trim(),
          company: newExpCompany.trim(),
          startYear: newExpStartYear ? Number(newExpStartYear) : null,
          endYear: newExpEndYear ? Number(newExpEndYear) : null,
          description: newExpDesc.trim() || null,
        });
        setNewExpTitle('');
        setNewExpCompany('');
        setNewExpStartYear('');
        setNewExpEndYear('');
        setNewExpDesc('');
      }

      const projToSave = [...projects];
      if (newProjName.trim()) {
        const techs = newProjTech
          ? newProjTech.split(',').map((t) => t.trim()).filter(Boolean)
          : [];
        projToSave.push({
          name: newProjName.trim(),
          description: newProjDesc.trim() || null,
          technologies: techs,
        });
        setNewProjName('');
        setNewProjDesc('');
        setNewProjTech('');
      }

      await candidatesApi.update({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        location: location.trim() || null,
        headline: headline.trim() || null,
        summary: summary.trim() || null,
        totalExperienceYears: Number(totalExperienceYears),
        skills: skillsToSave,
        education: eduToSave,
        experience: expToSave,
        projects: projToSave,
      });
      toast.success('Candidate profile saved successfully.');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) return <PageSpinner label="Loading dossier..." />;

  return (
    <>
      <PageHeader
        eyebrow="Candidate Verification Space"
        title="Profile & Resume"
        subtitle="Manage your engineering dossier, competencies, credentials, and resume artifacts"
        actions={
          <Button onClick={handleSave} loading={saving}>
            Confirm and Save
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Resume Dropzone Card */}
        <Card>
          <CardHeader title="Resume Artifact" subtitle="Upload standard vector text PDF (up to 5 MB)" />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-input/40 p-8 text-center transition-colors hover:border-accent cursor-pointer"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf"
              className="hidden"
            />

            <UploadCloud size={36} className="text-accent" />
            <p className="mt-3 text-sm font-semibold text-white">
              Drop your resume here, or <span className="text-accent">browse files</span>
            </p>
            <p className="mt-1 text-xs text-muted">Upload PDF (up to 5 MB). Encrypted & private.</p>

            {uploading && (
              <div className="mt-4 w-full max-w-xs">
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-raised">
                  <div className="h-full bg-accent transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {profile?.resumeFileName && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-control border border-border bg-raised p-3">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-accent" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{profile.resumeFileName}</p>
                      {profile.parseStatus === 'Parsed' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 size={12} className="text-emerald-400" /> Parse Successful
                        </span>
                      )}
                      {profile.parseStatus === 'Failed' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-danger/40 bg-danger/20 px-2.5 py-0.5 text-[11px] font-semibold text-danger">
                          <AlertCircle size={12} /> Parse Failed
                        </span>
                      )}
                      {profile.parseStatus === 'Empty' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/20 px-2.5 py-0.5 text-[11px] font-semibold text-warning">
                          <AlertTriangle size={12} /> Scanned / Empty
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      Uploaded {profile.resumeUploadedAt ? formatDate(profile.resumeUploadedAt) : 'recently'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {profile.resumeRawText && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setViewResumeModal(true)}
                      className="flex items-center gap-1.5"
                    >
                      <FileText size={13} /> View Text
                    </Button>
                  )}
                  <a
                    href={`/api/candidates/file/${profile.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-control border border-border bg-raised px-3 py-1.5 text-xs font-medium text-body hover:bg-input hover:text-white transition"
                  >
                    Open PDF
                  </a>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleReparse}
                    loading={reparsing}
                    className="flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} /> Re-parse AI
                  </Button>
                </div>
              </div>

              {profile.parseStatus === 'Parsed' && (
                <div className="flex items-start gap-3 rounded-control border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Resume Saved & Attached to Profile</p>
                    <p className="mt-0.5 text-emerald-200/90 leading-relaxed">
                      Your PDF resume has been successfully parsed, saved, and attached to your candidate profile. It will automatically be included and displayed to the recruiter whenever you submit a job application.
                    </p>
                  </div>
                </div>
              )}

              {profile.parseError && (
                <div className="rounded-control border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                  <span className="font-semibold">Parsing Notice: </span>{profile.parseError}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader title="Personal Information" subtitle="Contact & identity details" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Chen"
            />
            <Input
              label="Email Address"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
            />
            <Input
              label="Location / Remote Preference"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lahore / Remote"
            />
            <div className="sm:col-span-2">
              <Input
                label="Headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Backend Engineer | Python, Distributed Systems"
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Total Experience (Years)"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={totalExperienceYears}
                onChange={(e) => setTotalExperienceYears(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-muted">Executive Summary</label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of engineering background and technical achievements..."
                className="w-full rounded-control border border-border bg-input p-3 text-sm text-body placeholder-muted focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Technical Skills */}
        <Card>
          <CardHeader title="Extracted & Verified Skills" subtitle="Skills showcased in candidate dossiers" />
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {skills.map((s, idx) => (
                <div key={idx} className="group relative">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs ${
                      s.verified
                        ? 'border-accent/40 bg-input text-white'
                        : 'border-border bg-input text-body'
                    }`}
                  >
                    {s.verified && (
                      <CheckCircle2 size={12} className="text-success" title="Verified verbatim against resume" />
                    )}
                    <span>{s.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(idx)}
                      className="ml-1 text-muted hover:text-danger"
                    >
                      ×
                    </button>
                  </span>

                  {s.evidence && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden w-64 rounded-control border border-border bg-surface p-2 text-[11px] text-body shadow-2xl group-hover:block z-30">
                      <p className="font-semibold text-accent font-sans">Resume Evidence Excerpt:</p>
                      <p className="italic mt-0.5 text-muted line-clamp-3">"{s.evidence}"</p>
                    </div>
                  )}
                </div>
              ))}
              {skills.length === 0 && <p className="text-xs text-muted">No skills added yet.</p>}
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Skill name (e.g. Python, Docker)..."
                className="flex-1 rounded-control border border-border bg-input px-3 py-1.5 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
              />
              <input
                type="text"
                value={newEvidence}
                onChange={(e) => setNewEvidence(e.target.value)}
                placeholder="Evidence / Years (optional)..."
                className="flex-1 rounded-control border border-border bg-input px-3 py-1.5 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
              />
              <Button type="button" size="sm" onClick={handleAddSkill}>
                Add Skill
              </Button>
            </div>
          </div>
        </Card>

        {/* Work Experience */}
        <Card>
          <CardHeader title="Work Experience" subtitle="Track record across engineering squads" />
          <div className="space-y-3">
            {experience.map((exp, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between rounded-control border border-border bg-input p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {exp.title} <span className="text-muted font-normal">at {exp.company}</span>
                  </p>
                  <p className="text-xs text-muted font-mono">
                    {exp.startYear || '—'} – {exp.endYear || 'Present'}
                  </p>
                  {exp.description && <p className="mt-1 text-xs text-body">{exp.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(idx)}
                  className="text-muted hover:text-danger p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={newExpTitle}
                  onChange={(e) => setNewExpTitle(e.target.value)}
                  placeholder="Role Title (e.g. Staff Engineer)..."
                  className="rounded-control border border-border bg-input px-3 py-1.5 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
                />
                <input
                  type="text"
                  value={newExpCompany}
                  onChange={(e) => setNewExpCompany(e.target.value)}
                  placeholder="Company (e.g. Stripe)..."
                  className="rounded-control border border-border bg-input px-3 py-1.5 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
                />
                <input
                  type="number"
                  value={newExpStartYear}
                  onChange={(e) => setNewExpStartYear(e.target.value)}
                  placeholder="Start Year (e.g. 2021)..."
                  className="rounded-control border border-border bg-input px-3 py-1.5 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
                />
                <input
                  type="number"
                  value={newExpEndYear}
                  onChange={(e) => setNewExpEndYear(e.target.value)}
                  placeholder="End Year (leave blank for Present)..."
                  className="rounded-control border border-border bg-input px-3 py-1.5 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
                />
              </div>
              <textarea
                rows={2}
                value={newExpDesc}
                onChange={(e) => setNewExpDesc(e.target.value)}
                placeholder="Key contributions and architecture highlights..."
                className="w-full rounded-control border border-border bg-input p-2 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
              />
              <Button type="button" size="sm" onClick={handleAddExperience}>
                Add Work Experience
              </Button>
            </div>
          </div>
        </Card>

        {/* Education & Projects */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Education */}
          <Card>
            <CardHeader title="Education" />
            <div className="space-y-2">
              {education.map((ed, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-control border border-border bg-input p-2.5 text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{ed.degree}</p>
                    <p className="text-muted">{ed.institution} {ed.year ? `· ${ed.year}` : ''}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(idx)}
                    className="text-muted hover:text-danger p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              <div className="space-y-1.5 pt-2">
                <input
                  type="text"
                  value={newDegree}
                  onChange={(e) => setNewDegree(e.target.value)}
                  placeholder="Degree (e.g. BS in Computer Science)..."
                  className="w-full rounded-control border border-border bg-input px-3 py-1.5 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInstitution}
                    onChange={(e) => setNewInstitution(e.target.value)}
                    placeholder="Institution (e.g. FAST-NUCES)..."
                    className="flex-1 rounded-control border border-border bg-input px-3 py-1.5 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
                  />
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="Year..."
                    className="w-20 rounded-control border border-border bg-input px-2 py-1.5 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
                  />
                </div>
                <Button type="button" size="sm" onClick={handleAddEducation}>
                  Add Education
                </Button>
              </div>
            </div>
          </Card>

          {/* Featured Projects */}
          <Card>
            <CardHeader title="Featured Projects" />
            <div className="space-y-2">
              {projects.map((pr, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between rounded-control border border-border bg-input p-2.5 text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{pr.name}</p>
                    {pr.description && <p className="text-muted mt-0.5">{pr.description}</p>}
                    {pr.technologies?.length > 0 && (
                      <p className="font-mono text-[10px] text-accent mt-1">
                        {pr.technologies.join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(idx)}
                    className="text-muted hover:text-danger p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              <div className="space-y-1.5 pt-2">
                <input
                  type="text"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="Project Name..."
                  className="w-full rounded-control border border-border bg-input px-3 py-1.5 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
                />
                <input
                  type="text"
                  value={newProjTech}
                  onChange={(e) => setNewProjTech(e.target.value)}
                  placeholder="Technologies (comma separated, e.g. Python, Docker)..."
                  className="w-full rounded-control border border-border bg-input px-3 py-1.5 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Brief description..."
                  className="w-full rounded-control border border-border bg-input p-2 text-xs text-body placeholder-muted focus:border-accent focus:outline-none"
                />
                <Button type="button" size="sm" onClick={handleAddProject}>
                  Add Project
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} loading={saving} size="lg">
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Resume Viewer Modal */}
      {viewResumeModal && (
        <Modal
          isOpen={true}
          onClose={() => setViewResumeModal(false)}
          title={`Extracted Resume Content: ${profile?.resumeFileName || 'Resume'}`}
        >
          <div className="space-y-3">
            <p className="text-xs text-muted">
              Raw text extracted from your PDF and processed by the AI pipeline:
            </p>
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-control border border-border bg-input p-4 font-mono text-xs leading-relaxed text-body">
              {profile?.resumeRawText || 'No text extracted from this document.'}
            </pre>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewResumeModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

