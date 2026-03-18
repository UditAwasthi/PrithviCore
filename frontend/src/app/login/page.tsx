'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AxiosError } from 'axios';
import ClientGoogleLogin from '@/components/ClientGoogleLogin';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const serverMsg = err.response?.data?.error as string | undefined;
    if (serverMsg) return serverMsg;
    if (!err.response) {
      return 'Cannot reach the server. Check your internet connection.';
    }
  }
  return 'Login failed. Please try again.';
}

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-agri-200 bg-white text-sm ' +
  'text-gray-900 placeholder-gray-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-agri-300 focus:border-agri-400 ' +
  'transition-colors duration-150';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);
  const toggleShowPw = () => setShowPw((prev) => !prev);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back! 🌱');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Google Login handler — receives access_token string
  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    try {
      await googleLogin(credential);
      toast.success('Welcome back! 🌱');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-agri-50 via-white to-agri-100 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-agri-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-agri-300/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-agri-600 rounded-2xl text-3xl mb-4 shadow-lg select-none">
            🌱
          </div>
          <h1 className="text-3xl font-extrabold text-agri-800">PrithviCore</h1>
          <p className="text-gray-500 mt-1 text-sm">Smart Farming System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-agri-100 p-8">
          <h2 className="text-xl font-bold text-agri-800 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in to your farm dashboard</p>

          {/* Google Sign-In */}
          <div className="mb-4">
            <ClientGoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google sign-in failed')}
              text="Sign in with Google"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold text-gray-800 mb-1.5"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                required
                placeholder="farmer@example.com"
                className={inputCls}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold text-gray-800 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  placeholder="••••••••"
                  className={`${inputCls} pr-12`}
                />
                <button
                  type="button"
                  onClick={toggleShowPw}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-agri-600 to-agri-500 text-white font-bold rounded-xl text-sm
                         hover:from-agri-700 hover:to-agri-600 active:scale-[0.98]
                         transition-all shadow-lg shadow-agri-200/60
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-agri-600 font-bold hover:underline"
            >
              Sign up free
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          PrithviCore · Smart IoT Farming Platform
        </p>
      </div>
    </div>
  );
}
