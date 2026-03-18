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
import { Eye, EyeOff, Loader, Phone, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AxiosError } from 'axios';
import ClientGoogleLogin from '@/components/ClientGoogleLogin';
import { authAPI } from '@/lib/api';

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
// Shared input className
// ---------------------------------------------------------------------------
const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-agri-200 bg-white text-sm ' +
  'text-gray-900 placeholder-gray-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-agri-300 focus:border-agri-400 ' +
  'transition-colors duration-150';

// ---------------------------------------------------------------------------
// FormField
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
  extra?: React.ReactNode;
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
      <label htmlFor={id} className="block text-sm font-semibold text-gray-800 mb-1.5">
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
  const { signup, googleLogin } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const handleChange = useCallback(
    (field: keyof FormState) =>
      (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        if (field === 'phone') setPhoneVerified(false);
      },
    []
  );

  const toggleShowPw = useCallback(() => setShowPw((p) => !p), []);

  // Send OTP
  const handleSendOtp = async () => {
    const phone = form.phone.trim();
    if (!phone) {
      toast.error('Please enter a phone number first.');
      return;
    }
    setOtpSending(true);
    try {
      await authAPI.sendOtp(phone);
      toast.success('OTP sent! Check your console (mock mode).');
      setShowOtpModal(true);
      setOtpValue('');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast.error('Please enter a 6-digit OTP.');
      return;
    }
    setOtpVerifying(true);
    try {
      await authAPI.verifyOtp(form.phone.trim(), otpValue);
      toast.success('Phone number verified! ✅');
      setPhoneVerified(true);
      setShowOtpModal(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setOtpVerifying(false);
    }
  };

  // Google Login handler — receives access_token string
  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    try {
      await googleLogin(credential);
      toast.success('Account created! Welcome to PrithviCore 🌱');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        farm_size_acres: form.farm_size_acres
          ? parseFloat(form.farm_size_acres)
          : undefined,
        farm_location: {
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          country: form.country || 'India',
        },
      });
      toast.success('Account created! Welcome to PrithviCore 🌱');
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
          <h1 className="text-2xl font-extrabold text-agri-800">PrithviCore</h1>
          <p className="text-sm text-gray-500 mt-1">
            Start monitoring your farm with real-time IoT data
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-agri-100 p-8">
          {/* Google Sign-Up */}
          <div className="mb-4">
            <ClientGoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google sign-up failed')}
              text="Sign up with Google"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">or sign up with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

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
              {/* Phone with OTP verify button */}
              <div>
                <label htmlFor="signup-phone" className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Phone
                </label>
                <div className="flex gap-2">
                  <input
                    id="signup-phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    placeholder="+91 9876543210"
                    autoComplete="tel"
                    className={`${inputCls} flex-1`}
                  />
                  {form.phone.trim() && !phoneVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending}
                      className="px-3 py-2 bg-agri-600 text-white text-xs font-bold rounded-xl hover:bg-agri-700 transition-colors disabled:opacity-60 flex-shrink-0 flex items-center gap-1"
                    >
                      {otpSending ? <Loader size={12} className="animate-spin" /> : <Phone size={12} />}
                      Verify
                    </button>
                  )}
                  {phoneVerified && (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-bold flex-shrink-0 px-2">
                      <CheckCircle size={14} /> Verified
                    </span>
                  )}
                </div>
              </div>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
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
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
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
                    className="block text-sm font-semibold text-gray-800 mb-1.5"
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

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-agri-600 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ── OTP Verification Modal ────────────────────────────── */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm animate-slide-up">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-agri-100 rounded-2xl text-2xl mb-3">
                📱
              </div>
              <h3 className="text-xl font-bold text-agri-800">Verify your phone</h3>
              <p className="text-sm text-gray-500 mt-1">
                Enter the 6-digit OTP sent to <strong className="text-gray-700">{form.phone}</strong>
              </p>
              <p className="text-xs text-amber-700 mt-2 bg-amber-50 rounded-lg px-3 py-1.5 inline-block">
                💡 Mock mode: Check your backend console for the OTP
              </p>
            </div>

            <input
              type="text"
              maxLength={6}
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className={`${inputCls} text-center text-2xl tracking-[0.5em] font-bold mb-4`}
              autoFocus
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otpVerifying || otpValue.length !== 6}
                className="flex-1 py-3 bg-gradient-to-r from-agri-600 to-agri-500 text-white font-bold rounded-xl text-sm
                           hover:from-agri-700 hover:to-agri-600 transition-all
                           disabled:opacity-60 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {otpVerifying ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    Verifying…
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpSending}
              className="w-full mt-3 text-xs text-agri-600 font-semibold hover:underline disabled:opacity-50"
            >
              {otpSending ? 'Sending…' : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
