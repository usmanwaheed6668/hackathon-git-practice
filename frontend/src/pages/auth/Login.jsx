import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Eye, EyeOff, RotateCcw, UserRound, Users } from 'lucide-react';
import { authApi } from '../../api/auth';
import { getErrorMessage } from '../../api/client';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { DEMO_ACCOUNTS, ROLES, homeForRole } from '../../utils/constants';
import { isValidEmail } from '../../utils/validators';
import AuthLayout, { RoleSegmented } from './AuthLayout.jsx';

function targetFor(user, from) {
  const home = homeForRole(user.role);
  if (from && from.startsWith(home)) return from;
  return home;
}

export default function Login() {
  const { login, user, initializing } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [role, setRole] = useState(ROLES.Recruiter);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [lockSeconds, setLockSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Live lockout countdown.
  useEffect(() => {
    if (lockSeconds <= 0) return undefined;
    const t = setInterval(() => setLockSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [lockSeconds > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!initializing && user) {
    return <Navigate to={targetFor(user, from)} replace />;
  }

  const fillDemo = (r) => {
    setRole(r);
    setEmail(DEMO_ACCOUNTS[r].email);
    setPassword(DEMO_ACCOUNTS[r].password);
    setFieldErrors({});
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!isValidEmail(email)) errs.email = 'Please enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    setError('');
    try {
      const u = await login(email.trim(), password);
      toast.success(`Welcome back, ${u.name}!`);
      navigate(targetFor(u, from), { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 423) {
        const retry = Number(err.response.data?.retryAfterSeconds) || 60;
        setLockSeconds(retry);
      } else if (status === 401) {
        setError('Invalid email or password.');
      } else if (status === 429) {
        setError('Too many requests. Please wait a minute and try again.');
      } else {
        setError(getErrorMessage(err, 'Sign in failed. Please try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onReset = async () => {
    setResetting(true);
    try {
      const res = await authApi.resetDemo();
      toast.success(res?.message || 'Demo data has been reset.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not reset demo data.'));
    } finally {
      setResetting(false);
    }
  };

  const locked = lockSeconds > 0;

  return (
    <AuthLayout>
      <h2 className="text-[28px] font-semibold leading-9">Sign in to TalentIQ</h2>
      <p className="mt-1 text-sm text-muted">Enter your account details below</p>

      {locked && (
        <div role="alert" className="mt-6 flex gap-3 rounded-card border border-danger/25 bg-danger/[0.1] p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          <div className="flex-1">
            <p className="text-sm font-medium text-danger">Too many attempts, try again shortly</p>
            <p className="mt-1 flex flex-wrap justify-between gap-2 font-mono text-[13px] text-body">
              <span>Account temporarily locked</span>
              <span className="text-danger">{lockSeconds}s remaining</span>
            </p>
          </div>
        </div>
      )}

      {error && !locked && (
        <div role="alert" className="mt-6 flex items-center gap-3 rounded-card border border-danger/25 bg-danger/[0.1] px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 text-danger" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        <RoleSegmented value={role} onChange={setRole} />

        <Input
          label={role === ROLES.Recruiter ? 'Work email address' : 'Email address'}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          error={fieldErrors.email}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          error={fieldErrors.password}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="focus-ring rounded p-1.5 text-muted hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={locked}>
          {locked ? `Locked (${lockSeconds}s)` : 'Sign in'}
          {!locked && !submitting && <ArrowRight size={18} />}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="focus-ring rounded font-medium text-accent-hover hover:underline">
          Create an account
        </Link>
      </p>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Or instant preview</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={() => fillDemo(ROLES.Recruiter)}>
          <Users size={16} /> Fill demo recruiter
        </Button>
        <Button variant="secondary" onClick={() => fillDemo(ROLES.Candidate)}>
          <UserRound size={16} /> Fill demo candidate
        </Button>
      </div>

      {import.meta.env.DEV && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onReset}
            disabled={resetting}
            className="focus-ring inline-flex items-center gap-1.5 rounded text-xs text-muted hover:text-white disabled:opacity-60"
          >
            <RotateCcw size={13} className={resetting ? 'animate-spin' : ''} />
            {resetting ? 'Resetting demo data…' : 'Reset demo data'}
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
