import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { GitCompare, Award, CheckCircle, AlertCircle, Briefcase, GraduationCap, Code, ArrowRight } from 'lucide-react';
import { applicationsApi } from '../../api/applications';
import { jobsApi } from '../../api/jobs';
import { Button } from '../../components/common/Button.jsx';
import { PageSpinner } from '../../components/common/Spinner.jsx';

export default function CandidateCompare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allApplications, setAllApplications] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // Load applicants from all jobs to allow selection
  useEffect(() => {
    async function loadApplicants() {
      try {
        const jobs = await jobsApi.listMine();
        const apps = [];
        for (const j of jobs || []) {
          try {
            const list = await jobsApi.applications(j.id);
            for (const a of list || []) {
              apps.push({ ...a, jobTitle: j.title });
            }
          } catch {}
        }
        setAllApplications(apps);

        // Check search params
        const urlIds = searchParams.get('ids');
        if (urlIds) {
          const split = urlIds.split(',').filter(Boolean);
          setSelectedIds(split);
          fetchComparison(split);
        } else if (apps.length >= 2) {
          // Default compare first 2 or 3
          const initial = apps.slice(0, 3).map((a) => a.id);
          setSelectedIds(initial);
          fetchComparison(initial);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadApplicants();
  }, []);

  const fetchComparison = async (ids) => {
    if (!ids || ids.length === 0) {
      setCandidates([]);
      return;
    }
    setLoading(true);
    try {
      const data = await applicationsApi.compare(ids);
      setCandidates(data || []);
      setSearchParams({ ids: ids.join(',') });
    } catch (err) {
      console.error(err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCandidate = (id) => {
    let next;
    if (selectedIds.includes(id)) {
      next = selectedIds.filter((x) => x !== id);
    } else {
      if (selectedIds.length >= 3) {
        alert('You can compare at most 3 candidates simultaneously.');
        return;
      }
      next = [...selectedIds, id];
    }
    setSelectedIds(next);
    fetchComparison(next);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-control bg-accent/20 text-accent-hover">
            <GitCompare size={18} />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">Side-by-Side Candidate Comparison</h1>
        </div>
        <p className="mt-1 text-sm text-muted">
          Analyze technical proficiencies, AI assessment scores, experience depth, and project evidence side-by-side to make confident hiring choices.
        </p>
      </div>

      {/* Candidate Selector Bar */}
      <div className="rounded-card border border-border bg-surface p-4 shadow-sm">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Select up to 3 candidates to compare:
        </label>
        <div className="flex flex-wrap gap-2">
          {allApplications.map((app) => {
            const isSelected = selectedIds.includes(app.id);
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => handleToggleCandidate(app.id)}
                className={`rounded-control px-3 py-1.5 text-xs font-medium border transition flex items-center gap-2 ${
                  isSelected
                    ? 'border-accent bg-accent/20 text-accent-hover shadow-sm'
                    : 'border-border bg-base text-muted hover:border-border/80 hover:text-white'
                }`}
              >
                <span>{app.candidateName}</span>
                <span className="text-[10px] text-muted">({app.jobTitle})</span>
                {isSelected && <CheckCircle size={13} className="text-accent-hover" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Grid */}
      {loading ? (
        <PageSpinner label="Aligning candidate metrics and synthesizing comparison table..." />
      ) : candidates.length < 2 ? (
        <div className="rounded-card border border-border bg-surface p-12 text-center">
          <GitCompare className="mx-auto h-12 w-12 text-muted/50" />
          <h3 className="mt-3 text-sm font-semibold text-white">Select at least 2 candidates</h3>
          <p className="mt-1 text-xs text-muted">
            Choose candidates above to view their side-by-side evaluation metrics.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-sm">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-raised/50">
                <th className="p-4 font-semibold text-muted w-44">Attribute</th>
                {candidates.map((cand) => (
                  <th key={cand.id} className="p-4 font-semibold text-white min-w-[260px]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-heading text-base font-bold text-white">
                          {cand.candidate?.fullName || 'Candidate'}
                        </div>
                        <div className="text-[11px] text-muted">{cand.jobTitle}</div>
                      </div>
                      <span className="rounded-full bg-accent/20 border border-accent/40 px-2.5 py-0.5 text-xs font-bold text-accent-hover">
                        {Math.round(cand.overrideScore ?? cand.overallScore ?? 0)}/100
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {/* Status */}
              <tr>
                <td className="p-4 font-medium text-muted bg-raised/20">Stage</td>
                {candidates.map((cand) => (
                  <td key={cand.id} className="p-4">
                    <span className="inline-block rounded-full bg-raised px-2.5 py-0.5 text-[11px] font-semibold text-white border border-border">
                      {cand.status}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Experience */}
              <tr>
                <td className="p-4 font-medium text-muted bg-raised/20">Experience</td>
                {candidates.map((cand) => (
                  <td key={cand.id} className="p-4">
                    <div className="flex items-center gap-1.5 text-white font-medium">
                      <Briefcase size={14} className="text-accent" />
                      {cand.candidate?.totalExperienceYears} Years
                    </div>
                    <div className="mt-1 space-y-1 text-[11px] text-muted">
                      {(cand.candidate?.experience || []).slice(0, 2).map((exp, idx) => (
                        <div key={idx} className="truncate">
                          <strong>{exp.title}</strong> at {exp.company} ({exp.startYear} - {exp.endYear || 'Present'})
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Verified Skills */}
              <tr>
                <td className="p-4 font-medium text-muted bg-raised/20">Key Skills</td>
                {candidates.map((cand) => (
                  <td key={cand.id} className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {(cand.candidate?.skills || []).map((sk) => (
                        <span
                          key={sk.name}
                          className="inline-flex items-center gap-1 rounded border border-border bg-raised/80 px-2 py-0.5 text-[11px] text-body"
                        >
                          {sk.name}
                          {sk.verified && <CheckCircle size={10} className="text-emerald-400" />}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Education */}
              <tr>
                <td className="p-4 font-medium text-muted bg-raised/20">Education</td>
                {candidates.map((cand) => (
                  <td key={cand.id} className="p-4 text-muted">
                    {(cand.candidate?.education || []).map((edu, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] mt-0.5">
                        <GraduationCap size={13} className="text-accent shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-white">{edu.degree}</p>
                          <p>{edu.institution} ({edu.year})</p>
                        </div>
                      </div>
                    ))}
                  </td>
                ))}
              </tr>

              {/* Projects */}
              <tr>
                <td className="p-4 font-medium text-muted bg-raised/20">Notable Projects</td>
                {candidates.map((cand) => (
                  <td key={cand.id} className="p-4">
                    <div className="space-y-2">
                      {(cand.candidate?.projects || []).slice(0, 2).map((proj, idx) => (
                        <div key={idx} className="rounded-control border border-border/70 bg-base p-2 text-[11px]">
                          <p className="font-semibold text-white">{proj.name}</p>
                          <p className="mt-0.5 text-muted line-clamp-2">{proj.description}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(proj.technologies || []).map((t) => (
                              <span key={t} className="rounded bg-raised px-1.5 py-0.2 text-[10px] text-accent-hover">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Recruiter Notes count */}
              <tr>
                <td className="p-4 font-medium text-muted bg-raised/20">Private Notes</td>
                {candidates.map((cand) => (
                  <td key={cand.id} className="p-4 text-muted">
                    <span className="font-semibold text-white">{(cand.notes || []).length}</span> recruiter note(s) logged
                  </td>
                ))}
              </tr>

              {/* Action Links */}
              <tr>
                <td className="p-4 font-medium text-muted bg-raised/20">Review Dossier</td>
                {candidates.map((cand) => (
                  <td key={cand.id} className="p-4">
                    <Link
                      to={`/recruiter/jobs/${cand.jobId}/applicants/${cand.id}`}
                      className="inline-flex items-center gap-1.5 text-xs text-accent-hover hover:underline font-semibold"
                    >
                      Open Full Dossier <ArrowRight size={14} />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

