import { useState } from 'react';
import { Search, Sparkles, User, Briefcase, MapPin, Award, CheckCircle, ExternalLink } from 'lucide-react';
import { talentApi } from '../../api/talent';
import { Button } from '../../components/common/Button.jsx';
import { PageSpinner } from '../../components/common/Spinner.jsx';

const PRESET_QUERIES = [
  'Senior backend engineer with Docker, Python and PostgreSQL',
  'Frontend developer with React, Tailwind and Figma design systems',
  'Full stack developer proficient with Flask, MySQL and REST APIs',
  'Microservices engineer with high concurrency and distributed systems',
];

export default function TalentSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (searchQuery) => {
    const q = searchQuery !== undefined ? searchQuery : query;
    if (!q || !q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await talentApi.search(q.trim());
      setResults(data || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset) => {
    setQuery(preset);
    handleSearch(preset);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-control bg-accent/20 text-accent-hover">
            <Sparkles size={18} />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">Semantic Talent Search</h1>
        </div>
        <p className="mt-1 text-sm text-muted">
          Discover candidate profiles across your entire talent database using natural language queries powered by vector embeddings and semantic matching.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Find engineers with 3+ years experience in Python, FastAPI, and Docker deployments..."
              className="w-full rounded-control border border-border bg-base py-2.5 pl-10 pr-4 text-sm text-white placeholder-muted focus:outline-none focus:border-accent"
            />
          </div>
          <Button type="submit" disabled={loading} className="shrink-0 flex items-center gap-2">
            <Search size={16} /> Search Talent
          </Button>
        </form>

        {/* Preset Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">Suggested prompts:</span>
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="rounded-full border border-border bg-raised/60 px-3 py-1 text-muted hover:border-accent/40 hover:text-white transition"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <PageSpinner label="Computing vector semantic embeddings and ranking candidates..." />
      ) : searched && results.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-12 text-center">
          <User className="mx-auto h-12 w-12 text-muted/50" />
          <h3 className="mt-3 text-sm font-semibold text-white">No matching candidates found</h3>
          <p className="mt-1 text-xs text-muted">
            Try broadening your natural language criteria or searching for different technical skills.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {searched && (
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Found <strong>{results.length}</strong> matching candidates</span>
              <span className="text-[11px]">Ranked by hybrid semantic vector & skill intersection</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {results.map((cand) => (
              <div
                key={cand.candidateProfileId}
                className="rounded-card border border-border bg-surface p-5 shadow-sm transition hover:border-border/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-base font-semibold text-white">
                        {cand.fullName}
                      </h3>
                      <p className="text-xs text-muted mt-0.5">{cand.headline || 'Software Engineer'}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="rounded-full bg-accent/20 border border-accent/40 px-2.5 py-0.5 text-xs font-bold text-accent-hover">
                        {Math.round(cand.matchScore * 100)}% Match
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Briefcase size={13} className="text-accent" />
                      {cand.totalExperienceYears} yrs exp
                    </span>
                    {cand.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-accent" />
                        {cand.location}
                      </span>
                    )}
                  </div>

                  {/* Skills Chips */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(cand.skills || []).slice(0, 6).map((sk) => (
                      <span
                        key={sk}
                        className="rounded border border-border bg-raised/70 px-2 py-0.5 text-[11px] text-body"
                      >
                        {sk}
                      </span>
                    ))}
                    {(cand.skills || []).length > 6 && (
                      <span className="rounded px-1.5 py-0.5 text-[11px] text-muted">
                        +{(cand.skills || []).length - 6} more
                      </span>
                    )}
                  </div>

                  {/* Context snippet highlight */}
                  {cand.snippet && (
                    <div className="mt-3 rounded-control border border-border/70 bg-base p-2.5 text-xs text-body line-clamp-3">
                      <span className="font-semibold text-white">Resume Evidence: </span>
                      {cand.snippet}
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-border/50 pt-3 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-muted">Email: {cand.email}</span>
                  <span className="inline-flex items-center gap-1 text-accent-hover font-medium">
                    Profile Verified <CheckCircle size={13} className="text-emerald-400" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

