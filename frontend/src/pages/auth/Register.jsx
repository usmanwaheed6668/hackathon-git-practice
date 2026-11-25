import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Check, Eye, EyeOff, X } from 'lucide-react';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES, homeForRole } from '../../utils/constants';
import { isValidEmail, passwordChecks, passwordStrength, validatePassword } from '../../utils/validators';
import AuthLayout, { RoleSegmented } from './AuthLayout.jsx';

const STRENGTH_COLORS = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-success', 'bg-success'];

function StrengthMeter({ password }) {
  const { score, label } = passwordStrength(password);
  const checks = passwordChecks(password);
  const rules = [
    { ok: checks.length, text: 'At least 8 characters' },
    { ok: checks.letter, text: 'Contains a letter' },
    { ok: checks.number, text: 'Contains a number' },
  ];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              password && score >= i ? STRENGTH_COLORS[score] : 'bg-border'
            }`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {rules.map((r) => (
            <li key={r.text} className={`flex items-center gap-1 text-xs ${r.ok ? 'text-success' : 'text-muted'}`}>
              {r.ok ? <Check size={12} /> : <X size={12} />}
              {r.text}
            </li>
          ))}
        </ul>
        {label && <span className="font-mono text-[11px] text-muted">{label}</span>}
      </div>
    </div>
  );
}

export default function Register() {
  const { register, user, initializing } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState(ROLES.Candidate);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!initializing && user) return <Navigate to={homeForRole(user.role)} replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required.';
    else if (form.fullName.trim().length > 100) e.fullName = 'Full name is too long.';
    if (!isValidEmail(form.email)) e.email = 'Please enter a valid email address.';
    const pw = validatePassword(form.password);
    if (pw) e.password = pw;
    if (!form.confirm) e.confirm = 'Please confirm your password.';
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    return e;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    setError('');
    try {
      const u = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
      });
      toast.success('Account created. Welcome to TalentIQ!');
      navigate(homeForRole(u.role), { replace: true });
    } catch (err) {
      const fe = getFieldErrors(err);
      if (fe.name && !fe.fullName) fe.fullName = fe.name;
      setErrors(fe);
      if (err?.response?.status === 409) {
        setErrors((x) => ({ ...x, email: x.email || 'An account with this email already exists.' }));
      } else if (!Object.keys(fe).length) {
        setError(getErrorMessage(err, 'Registration failed. Please try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-[28px] font-semibold leading-9">Create your account</h2>
      <p className="mt-1 text-sm text-muted">Choose how you will use TalentIQ</p>

      {error && (
        <div role="alert" className="mt-6 flex items-center gap-3 rounded-card border border-danger/25 bg-danger/[0.1] px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 text-danger" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        <RoleSegmented value={role} onChange={setRole} />
        <Input
          label="Full name"
          autoComplete="name"
          value={form.fullName}
          onChange={set('fullName')}
          placeholder="Jane Doe"
          error={errors.fullName}
          maxLength={100}
        />
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          placeholder="you@example.com"
          error={errors.email}
        />
        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
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
          <StrengthMeter password={form.password} />
        </div>
        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Create account {!submitting && <ArrowRight size={18} />}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="focus-ring rounded font-medium text-accent-hover hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
