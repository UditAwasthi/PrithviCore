'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader, ArrowLeft, Leaf } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex selection:bg-primary/20">
      {/* Decorative Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#071a10] via-[#0a2418] to-[#050d09] items-center justify-center">
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-violet-500/5 rounded-full blur-[80px]" />
        
        {/* Content */}
        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
            <Leaf size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-4">Welcome to PrithviCore</h2>
          <p className="text-white/70 text-sm leading-relaxed">The intelligent operating system for modern agriculture. Monitor, analyze, and optimize your farm with real-time IoT data and AI insights.</p>
          
          {/* Decorative grid dots */}
          <div className="mt-12 grid grid-cols-5 gap-3 max-w-[200px] mx-auto opacity-20">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ))}
          </div>
        </div>
      </div>

      {/* Form Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <Link href="/" className="absolute top-6 left-6 text-foreground/70 dark:text-foreground/80 hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors z-50 bg-background/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/30 dark:border-emerald-500/20">
          <ArrowLeft size={14} /> Home
        </Link>

        {/* Background Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none lg:hidden" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none lg:hidden" />

        <div className="relative w-full max-w-[420px] z-10">
          {/* Logo (mobile only) */}
          <div className="text-center mb-8 flex flex-col items-center lg:hidden">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
              <Leaf size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">PrithviCore</h1>
          </div>

          <Card className="shadow-2xl shadow-emerald-500/5 dark:shadow-emerald-500/10 rounded-2xl overflow-hidden dark:ring-1 dark:ring-emerald-500/10">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold tracking-tight mb-1.5 text-foreground">Welcome back</h2>
              <p className="text-sm text-foreground/60 dark:text-foreground/70 mb-7">Sign in to your farm dashboard</p>

              {/* Google */}
              <div className="mb-5">
                <ClientGoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google sign-in failed')}
                  text="Sign in with Google"
                />
              </div>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border dark:bg-emerald-500/15" />
                <span className="text-xs text-foreground/50 dark:text-foreground/60 font-semibold uppercase tracking-wider">Or</span>
                <div className="flex-1 h-px bg-border dark:bg-emerald-500/15" />
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="text-sm font-medium text-foreground">Email</label>
                  <Input id="login-email" type="email" autoComplete="email" value={email} onChange={handleEmailChange} required placeholder="name@example.com" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="text-sm font-medium text-foreground flex justify-between">
                    <span>Password</span>
                    <Link href="#" className="text-xs text-primary hover:underline font-medium">Forgot?</Link>
                  </label>
                  <div className="relative">
                    <Input id="login-password" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={handlePasswordChange} required placeholder="••••••••" className="pr-10" />
                    <button type="button" onClick={toggleShowPw} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 dark:text-foreground/60 hover:text-foreground transition-colors">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-11 text-sm font-semibold mt-2 shadow-lg">
                  {loading ? (<><Loader size={16} className="animate-spin mr-2" /> Signing in...</>) : 'Sign In'}
                </Button>
              </form>

              <p className="mt-7 text-center text-sm text-foreground/60 dark:text-foreground/70">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Sign up free</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
