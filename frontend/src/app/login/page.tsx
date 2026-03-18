'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AxiosError } from 'axios';
import ClientGoogleLogin from '@/components/ClientGoogleLogin';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const serverMsg = err.response?.data?.error as string | undefined;
    if (serverMsg) return serverMsg;
    if (!err.response) return 'Cannot reach the server. Check your internet connection.';
  }
  return 'Login failed. Please try again.';
}

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden selection:bg-primary/20">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/30 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md z-10 w-[400px]">
        {/* Logo Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-xl shadow-primary/20 text-primary-foreground transform transition-transform hover:scale-105 duration-300">
            🌿
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">PrithviCore</h1>
          <p className="text-muted-foreground mt-1 tracking-wide text-sm font-medium uppercase">Smart Farming System</p>
        </div>

        <Card className="backdrop-blur-md bg-card/95 border-border shadow-2xl overflow-hidden rounded-3xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground mb-8">Sign in to your farm dashboard</p>

            {/* Google Sign-In */}
            <div className="mb-6">
              <ClientGoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google sign-in failed')}
                text="Sign in with Google"
              />
            </div>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-[1px] bg-border" />
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Or</span>
              <div className="flex-1 h-[1px] bg-border" />
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-sm font-semibold text-foreground">
                  Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-sm font-semibold text-foreground flex justify-between">
                  <span>Password</span>
                  <Link href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</Link>
                </label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={toggleShowPw}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-[15px] font-bold mt-2 shadow-md hover:shadow-lg transition-all"
              >
                {loading ? (
                  <>
                    <Loader justify-center size={18} className="animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground font-medium">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary font-bold hover:underline">
                Sign up for free
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
