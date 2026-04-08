'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader, Phone, CheckCircle, ArrowLeft, Leaf } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AxiosError } from 'axios';
import ClientGoogleLogin from '@/components/ClientGoogleLogin';
import { authAPI } from '@/lib/api';
import { State, City } from 'country-state-city';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  farm_size_acres: string;
  country: string;
  state: string;
  city: string;
}

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  phone: z.string().default(''),
  farm_size_acres: z.string().default(''),
  country: z.string().default('India'),
  state: z.string().default(''),
  city: z.string().default(''),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const msg = err.response?.data?.error as string | undefined;
    if (msg) return msg;
  }
  return 'Signup failed. Please try again.';
}

export default function SignupPage() {
  const { signup, googleLogin } = useAuth();
  const router = useRouter();

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStateCode, setSelectedStateCode] = useState('');

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(signupSchema) as any,
    defaultValues: { 
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      farm_size_acres: '',
      country: 'India', 
      state: '', 
      city: '' 
    },
  });

  const country = watch('country');
  const phone = watch('phone');

  const getCountryCode = (name: string) => {
    const map: Record<string, string> = { India: 'IN', Bangladesh: 'BD', Nepal: 'NP', 'Sri Lanka': 'LK', Pakistan: 'PK' };
    return map[name] || '';
  };

  const cCode = getCountryCode(country);

  const handleSendOtp = async () => {
    if (!phone) { toast.error('Please enter a phone number first.'); return; }
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
    if (otpValue.length !== 6) { toast.error('Please enter a 6-digit OTP.'); return; }
    setOtpVerifying(true);
    try {
      await authAPI.verifyOtp(phone || '', otpValue);
      toast.success('Phone number verified! ✅');
      setPhoneVerified(true);
      setShowOtpModal(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    try {
      await googleLogin(credential);
      toast.success('Account created! 🌱');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await signup({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        phone: data.phone?.trim() || undefined,
        farm_size_acres: data.farm_size_acres ? parseFloat(data.farm_size_acres) : undefined,
        farm_location: {
          city: data.city || undefined,
          state: data.state || undefined,
          country: data.country || 'India',
        },
      });
      toast.success('Account created! 🌱');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPw = () => setShowPw((p) => !p);

  return (
    <div className="min-h-screen bg-background flex selection:bg-primary/20">
      {/* Decorative Left Panel */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-gradient-to-br from-[#071a10] via-[#0a2418] to-[#050d09] items-center justify-center">
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/8 rounded-full blur-[100px]" />
        
        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
            <Leaf size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-4">Join PrithviCore</h2>
          <p className="text-white/70 text-sm leading-relaxed">Start monitoring your farm with real-time IoT data, AI disease detection, and automated recommendations.</p>
          
          <div className="mt-12 grid grid-cols-5 gap-3 max-w-[200px] mx-auto opacity-20">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ))}
          </div>
        </div>
      </div>

      {/* Form Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 py-12 relative overflow-y-auto">
        <Link href="/" className="fixed top-6 left-6 lg:left-auto lg:right-6 text-foreground/70 dark:text-foreground/80 hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors z-50 bg-background/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/30 dark:border-emerald-500/20">
          <ArrowLeft size={14} /> Home
        </Link>

        {/* Bg orbs mobile */}
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none lg:hidden" />

        <div className="relative w-full max-w-xl z-10">
          {/* Logo mobile */}
          <div className="text-center mb-8 flex flex-col items-center lg:hidden">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
              <Leaf size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Join PrithviCore</h1>
          </div>

          <Card className="shadow-2xl shadow-emerald-500/5 dark:shadow-emerald-500/10 rounded-2xl overflow-hidden dark:ring-1 dark:ring-emerald-500/10">
            <CardContent className="p-8 sm:p-10">
              <div className="mb-5">
                <ClientGoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google sign-up failed')} text="Sign up with Google" />
              </div>

              <div className="flex items-center gap-3 my-7">
                <div className="flex-1 h-px bg-border/50 dark:bg-emerald-500/15" />
                <span className="text-xs text-foreground/50 dark:text-foreground/60 font-semibold uppercase tracking-wider px-2">Or continue with email</span>
                <div className="flex-1 h-px bg-border/50 dark:bg-emerald-500/15" />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <Input {...register('name')} placeholder="Full Name" />
                    {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Phone</label>
                    <div className="flex gap-2">
                      <Input {...register('phone')} placeholder="Mobile Number" className="flex-1" />
                      {phone?.trim() && !phoneVerified && (
                        <Button type="button" variant="outline" onClick={handleSendOtp} disabled={otpSending} className="flex-shrink-0 text-xs h-11">
                          {otpSending ? <Loader size={12} className="animate-spin mr-1" /> : <Phone size={12} className="mr-1" />} Verify
                        </Button>
                      )}
                    </div>
                    {phoneVerified && <p className="text-xs text-emerald-500 font-medium mt-1">✓ Verified</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input type="email" {...register('email')} placeholder="Email Address" />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <div className="relative">
                      <Input type={showPw ? 'text' : 'password'} {...register('password')} placeholder="Min 6 characters" />
                      <button type="button" onClick={toggleShowPw} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                    <Input type="password" {...register('confirmPassword')} placeholder="Confirm Password" />
                    {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                {/* Farm details */}
                <div className="border-t border-border/30 pt-5 mt-5">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4">Farm Details (Optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Country</label>
                      <select {...register('country')} onChange={(e) => { register('country').onChange(e); setValue('state', ''); setValue('city', ''); setSelectedStateCode(''); }} className="flex h-11 w-full rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm px-4 py-2 text-sm focus:ring-2 focus:ring-primary/40 outline-none transition-all">
                        {['India', 'Bangladesh', 'Nepal', 'Sri Lanka', 'Pakistan', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">State</label>
                      {cCode ? (
                        <select value={selectedStateCode} onChange={(e) => { const code = e.target.value; setSelectedStateCode(code); const sName = State.getStateByCodeAndCountry(code, cCode)?.name || code; setValue('state', sName); setValue('city', ''); }} className="flex h-11 w-full rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm px-4 py-2 text-sm focus:ring-2 focus:ring-primary/40 outline-none transition-all">
                          <option value="">Select State</option>
                          {State.getStatesOfCountry(cCode).map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                        </select>
                      ) : (
                        <Input {...register('state')} placeholder="State" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">City / Village</label>
                      {cCode && selectedStateCode ? (
                        <select {...register('city')} className="flex h-11 w-full rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm px-4 py-2 text-sm focus:ring-2 focus:ring-primary/40 outline-none transition-all">
                          <option value="">Select City</option>
                          {City.getCitiesOfState(cCode, selectedStateCode).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                      ) : (
                        <Input {...register('city')} placeholder="City / Village" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Farm Size (acres)</label>
                      <Input type="number" {...register('farm_size_acres')} placeholder="e.g. 5" />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 text-sm font-semibold mt-3 shadow-lg rounded-xl">
                  {loading ? <><Loader size={16} className="animate-spin mr-2" /> Creating account...</> : 'Create Farm Account'}
                </Button>
              </form>

              <p className="mt-7 text-center text-sm text-muted-foreground">
                Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* OTP Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
             <Card className="w-full max-w-sm shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-6 flex flex-col items-center">
                  <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center text-2xl mb-4">📱</div>
                  <h3 className="text-xl font-bold text-foreground">Verify your phone</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Enter the 6-digit OTP sent to <strong className="text-foreground">{phone}</strong>
                  </p>
                </div>
                <Input type="text" maxLength={6} value={otpValue} onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))} className="text-center text-2xl tracking-[0.5em] font-bold h-14 mb-6" autoFocus />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowOtpModal(false)} className="flex-1 h-11">Cancel</Button>
                  <Button onClick={handleVerifyOtp} disabled={otpVerifying || otpValue.length !== 6} className="flex-1 h-11">
                    {otpVerifying ? <Loader size={16} className="animate-spin" /> : 'Verify'}
                  </Button>
                </div>
                <button type="button" onClick={handleSendOtp} disabled={otpSending} className="w-full mt-4 text-xs text-primary font-semibold hover:underline">
                  {otpSending ? 'Sending...' : 'Resend OTP'}
                </button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
