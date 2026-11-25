import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Sparkles, Trash2 } from 'lucide-react';
import { getErrorMessage, getValidationErrors } from '../../api/client';
import { jobsApi } from '../../api/jobs';
import Button from '../../components/common/Button.jsx';
import Card, { CardHeader } from '../../components/common/Card.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { PageSpinner } from '../../components/common/Spinner.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { PageHeader } from '../../components/layout/DashboardLayout.jsx';
import { JOB_TYPE_OPTIONS } from '../../utils/constants';

export default function JobForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [extractingAi, setExtractingAi] = useState(false);
  const [extractedByAi, setExtractedByAi] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('FullTime');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [description, setDescription] = useState('');
  const [minExperienceYears, setMinExperienceYears] = useState(2);

  const [skills, setSkills] = useState([
    { name: 'Python', importance: 5, isRequired: true },
    { name: 'PostgreSQL', importance: 4, isRequired: true },
    { name: 'Docker', importance: 3, isRequired: false },
  ]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillImportance, setNewSkillImportance] = useState(4);
  const [newSkillRequired, setNewSkillRequired] = useState(true);

  const [qualifications, setQualifications] = useState([
    'BS in Computer Science or equivalent technical field',
  ]);
  const [newQual, setNewQual] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    jobsApi
      .get(id)
      .then((job) => {
        setTitle(job.title || '');
        setDepartment(job.department || '');
        setLocation(job.location || '');
        setType(job.type || 'FullTime');
        setSalaryMin(job.salaryMin !== null ? String(job.salaryMin) : '');
        setSalaryMax(job.salaryMax !== null ? String(job.salaryMax) : '');
        setCurrency(job.currency || 'PKR');
        setDescription(job.description || '');
        setMinExperienceYears(job.minExperienceYears || 0);
        setSkills(job.skills || []);
        setQualifications(job.qualifications || []);
      })
      .catch((err) => {
        toast.error(`Failed to load job: ${getErrorMessage(err)}`);
        navigate('/recruiter/jobs');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const addSkill = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Skill already added.');
      return;
    }
    setSkills([...skills, { name: trimmed, importance: newSkillImportance, isRequired: newSkillRequired }]);
    setNewSkillName('');
    setNewSkillImportance(4);
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkillImportance = (index, value) => {
    const updated = [...skills];
    updated[index].importance = Number(value);
    setSkills(updated);
  };

  const addQualification = () => {
    const trimmed = newQual.trim();
    if (!trimmed) return;
    setQualifications([...qualifications, trimmed]);
    setNewQual('');
  };

  const removeQualification = (index) => {
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const handleExtractAi = async () => {
    if (!description.trim()) {
      toast.error('Please enter a role description first to extract requirements.');
      return;
    }
    setExtractingAi(true);
    try {
      const res = await jobsApi.extractRequirements(description);
      const combinedSkills = [
        ...(res.requiredSkills || []).map((s) => ({ name: s.name, importance: s.importance, isRequired: true })),
        ...(res.preferredSkills || []).map((s) => ({ name: s.name, importance: s.importance, isRequired: false })),
      ];

      if (combinedSkills.length > 0) setSkills(combinedSkills);
      if (res.minExperienceYears > 0) setMinExperienceYears(res.minExperienceYears);
      if (res.qualifications?.length > 0) setQualifications(res.qualifications);

      setExtractedByAi(true);
      toast.success('AI extracted requirements! Please review and calibrate below.');
    } catch (err) {
      toast.error(`AI Extraction failed: ${getErrorMessage(err)}`);
    } finally {
      setExtractingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    const payload = {
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      type,
      salaryMin: salaryMin ? Number(salaryMin) : null,
      salaryMax: salaryMax ? Number(salaryMax) : null,
      currency: currency.trim() || 'PKR',
      description: description.trim(),
      minExperienceYears: Number(minExperienceYears),
      skills,
      qualifications,
    };

    try {
      if (isEdit) {
        await jobsApi.update(id, payload);
        toast.success('Job requisition updated successfully.');
        navigate(`/recruiter/jobs/${id}`);
      } else {
        const created = await jobsApi.create(payload);
        toast.success('Job requisition created successfully.');
        navigate(`/recruiter/jobs/${created.id}`);
      }
    } catch (err) {
      const errors = getValidationErrors(err);
      if (errors && Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      }
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSpinner label="Loading requisition..." />;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/recruiter/jobs" className="flex items-center gap-1.5 text-xs text-muted hover:text-white">
            <ArrowLeft size={14} /> Back to jobs
          </Link>
        }
        title={isEdit ? 'Edit Job Requisition' : 'Create Job Requisition'}
        subtitle="Define target candidate requirements, compensation, and required competencies"
        actions={
          <div className="flex items-center gap-2">
            {extractedByAi && (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent-hover">
                <Sparkles size={12} /> AI suggested, please review
              </span>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={handleExtractAi}
              loading={extractingAi}
              className="flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-accent" />
              Extract requirements with AI
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader title="Role Overview" subtitle="General job requisition information" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Job Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                error={fieldErrors.title}
              />
            </div>
            <Input
              label="Department"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Infrastructure, Core Engineering"
              error={fieldErrors.department}
            />
            <Input
              label="Location"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Lahore / Remote, San Francisco"
              error={fieldErrors.location}
            />
            <Select
              label="Employment Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={JOB_TYPE_OPTIONS}
              error={fieldErrors.type}
            />
            <Input
              label="Minimum Experience (Years)"
              type="number"
              min="0"
              max="40"
              value={minExperienceYears}
              onChange={(e) => setMinExperienceYears(e.target.value)}
              error={fieldErrors.minExperienceYears}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Compensation & Currency" subtitle="Target salary brackets for this grade" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Minimum Salary"
              type="number"
              min="0"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder="e.g. 250000"
              error={fieldErrors.salaryMin}
            />
            <Input
              label="Maximum Salary"
              type="number"
              min="0"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder="e.g. 450000"
              error={fieldErrors.salaryMax}
            />
            <Input
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="PKR, USD"
              error={fieldErrors.currency}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Job Description" subtitle="Comprehensive description of responsibilities and scope" />
          <div className="space-y-1">
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the technical responsibilities, squad mission, and daily operations..."
              className="w-full rounded-control border border-border bg-input p-3 text-sm text-body placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {fieldErrors.description && <p className="text-xs text-danger">{fieldErrors.description}</p>}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Required & Preferred Skills"
            subtitle="Skills used by AI scoring to evaluate candidate suitability (Importance 1-5)"
          />

          <div className="space-y-3">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-control border border-border bg-input p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium text-white">{skill.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      skill.isRequired
                        ? 'bg-accent/15 text-accent-hover border border-accent/25'
                        : 'bg-raised text-muted border border-border'
                    }`}
                  >
                    {skill.isRequired ? 'Required' : 'Preferred'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">Weight:</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={skill.importance}
                      onChange={(e) => updateSkillImportance(index, e.target.value)}
                      className="h-1.5 w-24 accent-accent cursor-pointer"
                    />
                    <span className="w-4 font-mono text-xs font-semibold text-accent">{skill.importance}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="text-muted hover:text-danger transition-colors p-1"
                    title="Remove skill"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            <div className="mt-4 flex flex-col gap-3 rounded-control border border-dashed border-border p-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a competency (e.g. Redis, Kubernetes, React)..."
                className="flex-1 rounded-control border border-border bg-input px-3 py-1.5 text-sm text-body placeholder-muted focus:border-accent focus:outline-none"
              />

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-body cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSkillRequired}
                    onChange={(e) => setNewSkillRequired(e.target.checked)}
                    className="rounded border-border accent-accent"
                  />
                  Required
                </label>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">Imp:</span>
                  <select
                    value={newSkillImportance}
                    onChange={(e) => setNewSkillImportance(Number(e.target.value))}
                    className="rounded border border-border bg-input px-2 py-1 text-xs text-body"
                  >
                    <option value={5}>5 (Critical)</option>
                    <option value={4}>4 (High)</option>
                    <option value={3}>3 (Medium)</option>
                    <option value={2}>2 (Low)</option>
                    <option value={1}>1 (Bonus)</option>
                  </select>
                </div>

                <Button type="button" size="sm" onClick={addSkill} className="flex items-center gap-1">
                  <Plus size={14} /> Add
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Qualifications" subtitle="Educational or credential benchmarks" />
          <div className="space-y-2">
            {qualifications.map((qual, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-control border border-border bg-input px-3 py-2 text-sm text-body"
              >
                <span>{qual}</span>
                <button
                  type="button"
                  onClick={() => removeQualification(index)}
                  className="text-muted hover:text-danger transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newQual}
                onChange={(e) => setNewQual(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                placeholder="Add qualification benchmark..."
                className="flex-1 rounded-control border border-border bg-input px-3 py-1.5 text-sm text-body placeholder-muted focus:border-accent focus:outline-none"
              />
              <Button type="button" size="sm" onClick={addQualification}>
                Add
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Link to="/recruiter/jobs">
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" loading={submitting}>
            {isEdit ? 'Update Requisition' : 'Create Requisition'}
          </Button>
        </div>
      </form>
    </>
  );
}

