'use client';

import {
  useState,
  useCallback,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AxiosError } from 'axios';

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------
function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const msg = err.response?.data?.error as string | undefined;
    if (msg) return msg;
    if (!err.response) return 'Cannot reach the server. Check your connection.';
  }
  return 'Signup failed. Please try again.';
}

// ---------------------------------------------------------------------------
// Shared input className — constant, never recreated
// ---------------------------------------------------------------------------
const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-agri-200 bg-white text-sm ' +
  'text-gray-800 placeholder-gray-300 ' +
  'focus:outline-none focus:ring-2 focus:ring-agri-300 focus:border-agri-400 ' +
  'transition-colors duration-150';

// ---------------------------------------------------------------------------
// FormField — defined OUTSIDE SignupPage so React never unmounts it on re-render.
// If it were defined inside, React would treat it as a new component type on
// every render and forcibly unmount → remount the <input>, losing focus.
// ---------------------------------------------------------------------------
interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  extra?: React.ReactNode; // for the show/hide button on password fields
}

function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  minLength,
  extra,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-agri-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          className={extra ? `${inputCls} pr-11` : inputCls}
        />
        {extra}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form state type
// ---------------------------------------------------------------------------
interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  farm_size_acres: string;
  city: string;
  state: string;
  country: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  farm_size_acres: '',
  city: '',
  state: '',
  country: 'India',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SignupPage() {
  const { signup } = useAuth();
  const router     = useRouter();

  const [form,    setForm]    = useState<FormState>(INITIAL_FORM);
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  // Generic field setter — useCallback so the reference is stable
  const handleChange = useCallback(
    (field: keyof FormState) =>
      (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  const toggleShowPw = useCallback(() => setShowPw((p) => !p), []);

  // --------------------------------------------------------------------
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
        phone:    form.phone.trim() || undefined,
        farm_size_acres: form.farm_size_acres
          ? parseFloat(form.farm_size_acres)
          : undefined,
        farm_location: {
          city:    form.city.trim()    || undefined,
          state:   form.state.trim()   || undefined,
          country: form.country        || 'India',
        },
      });
      toast.success('Account created! Welcome to AgriDrishti 🌱');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-agri-50 via-white to-agri-100 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-agri-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-agri-100/40 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg py-8">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-agri-600 rounded-2xl text-2xl mb-3 shadow-lg select-none">
            🌱
          </div>
          <h1 className="text-2xl font-extrabold text-agri-700">
            Create your farm account
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Start monitoring your farm with real-time IoT data
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-agri-100 p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* ── Account details ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="signup-name"
                label="Full Name"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Ramesh Kumar"
                required
                autoComplete="name"
              />
              <FormField
                id="signup-phone"
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="+91 9876543210"
                autoComplete="tel"
              />
            </div>

            <FormField
              id="signup-email"
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="farmer@example.com"
              required
              autoComplete="email"
            />

            {/* ── Passwords ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="signup-password"
                label="Password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange('password')}
                placeholder="Min 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                extra={
                  <button
                    type="button"
                    onClick={toggleShowPw}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />
              <FormField
                id="signup-confirm-password"
                label="Confirm Password"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                placeholder="Repeat password"
                required
                autoComplete="new-password"
              />
            </div>

            {/* ── Farm details ─────────────────────────────────────── */}
            <div className="border-t border-agri-100 pt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Farm Details (optional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  id="signup-city"
                  label="City / Village"
                  value={form.city}
                  onChange={handleChange('city')}
                  placeholder="Nagpur"
                  autoComplete="address-level2"
                />
                <FormField
                  id="signup-state"
                  label="State"
                  value={form.state}
                  onChange={handleChange('state')}
                  placeholder="Maharashtra"
                  autoComplete="address-level1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <FormField
                  id="signup-farm-size"
                  label="Farm Size (acres)"
                  type="number"
                  value={form.farm_size_acres}
                  onChange={handleChange('farm_size_acres')}
                  placeholder="5"
                />
                <div>
                  <label
                    htmlFor="signup-country"
                    className="block text-sm font-semibold text-agri-700 mb-1.5"
                  >
                    Country
                  </label>
                  <select
                    id="signup-country"
                    value={form.country}
                    onChange={handleChange('country')}
                    className={inputCls}
                  >
                    {[
                      'India',
                      'Bangladesh',
                      'Nepal',
                      'Sri Lanka',
                      'Pakistan',
                      'Other',
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Submit ───────────────────────────────────────────── */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-agri-600 to-agri-500 text-white font-bold rounded-xl text-sm
                         hover:from-agri-700 hover:to-agri-600 active:scale-[0.98]
                         transition-all shadow-lg shadow-agri-200/60
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create Farm Account 🌱'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-agri-600 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

