'use client';

import { useState, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader, Phone, CheckCircle, ArrowLeft, Leaf } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AxiosError } from 'axios';
import ClientGoogleLogin from '@/components/ClientGoogleLogin';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const msg = err.response?.data?.error as string | undefined;
    if (msg) return msg;
    if (!err.response) return 'Cannot reach the server. Check your connection.';
  }
  return 'Signup failed. Please try again.';
}

interface FormFieldProps {
  id: string; label: string; type?: string; value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; required?: boolean; autoComplete?: string; minLength?: number;
  extra?: React.ReactNode;
}

function FormField({ id, label, type = 'text', value, onChange, placeholder, required, autoComplete, minLength, extra }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive inline-block ml-0.5">*</span>}
      </label>
      <div className="relative">
        <Input
          id={id} type={type} value={value} onChange={onChange}
          placeholder={placeholder} required={required} autoComplete={autoComplete} minLength={minLength}
          className={extra ? 'pr-11' : ''}
        />
        {extra && <div className="absolute right-3 top-1/2 -translate-y-1/2">{extra}</div>}
      </div>
    </div>
  );
}

interface FormState {
  name: string; email: string; password: string; confirmPassword: string;
  phone: string; farm_size_acres: string; city: string; state: string; country: string;
}

const INITIAL_FORM: FormState = { name: '', email: '', password: '', confirmPassword: '', phone: '', farm_size_acres: '', city: '', state: '', country: 'India' };

export default function SignupPage() {
  const { signup, googleLogin } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const handleChange = useCallback((field: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === 'phone') setPhoneVerified(false);
  }, []);

  const toggleShowPw = useCallback(() => setShowPw((p) => !p), []);

  const handleSendOtp = async () => {
    const phone = form.phone.trim();
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match.'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await signup({
        name: form.name.trim(), email: form.email.trim(), password: form.password,
        phone: form.phone.trim() || undefined,
        farm_size_acres: form.farm_size_acres ? parseFloat(form.farm_size_acres) : undefined,
        farm_location: { city: form.city.trim() || undefined, state: form.state.trim() || undefined, country: form.country || 'India' },
      });
      toast.success('Account created! Welcome to PrithviCore 🌱');
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
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-gradient-to-br from-[#071a10] via-[#0a2418] to-[#050d09] items-center justify-center">
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/8 rounded-full blur-[100px]" />
        
        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
            <Leaf size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-4">Join PrithviCore</h2>
          <p className="text-white/50 text-sm leading-relaxed">Start monitoring your farm with real-time IoT data, AI disease detection, and automated recommendations.</p>
          
          <div className="mt-12 grid grid-cols-5 gap-3 max-w-[200px] mx-auto opacity-20">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ))}
          </div>
        </div>
      </div>

      {/* Form Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 py-12 relative overflow-y-auto">
        <Link href="/" className="fixed top-6 left-6 lg:left-auto lg:right-6 text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors z-50 bg-background/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/30">
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
            <p className="text-muted-foreground mt-1.5 text-sm">Start monitoring your farm with real-time IoT data</p>
          </div>

          <Card className="shadow-2xl shadow-emerald-500/5 rounded-2xl overflow-hidden">
            <CardContent className="p-8 sm:p-10">
              <div className="mb-5">
                <ClientGoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google sign-up failed')} text="Sign up with Google" />
              </div>

              <div className="flex items-center gap-3 my-7">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-2">Or continue with email</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField id="signup-name" label="Full Name" value={form.name} onChange={handleChange('name')} placeholder="Ramesh Kumar" required autoComplete="name" />
                  <div className="space-y-1.5">
                    <label htmlFor="signup-phone" className="block text-sm font-medium text-foreground">Phone</label>
                    <div className="flex gap-2">
                      <Input id="signup-phone" type="tel" value={form.phone} onChange={handleChange('phone')} placeholder="+91 9876543210" autoComplete="tel" className="flex-1" />
                      {form.phone.trim() && !phoneVerified && (
                        <Button type="button" variant="outline" onClick={handleSendOtp} disabled={otpSending} className="flex-shrink-0 text-xs px-3 h-11">
                          {otpSending ? <Loader size={12} className="animate-spin mr-1" /> : <Phone size={12} className="mr-1" />} Verify
                        </Button>
                      )}
                      {phoneVerified && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex-shrink-0 px-2">
                          <CheckCircle size={14} /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <FormField id="signup-email" label="Email" type="email" value={form.email} onChange={handleChange('email')} placeholder="name@example.com" required autoComplete="email" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField id="signup-password" label="Password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handleChange('password')} placeholder="Min 6 characters" required minLength={6} autoComplete="new-password"
                    extra={
                      <button type="button" onClick={toggleShowPw} className="text-muted-foreground hover:text-foreground transition-colors">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                  />
                  <FormField id="signup-confirm-password" label="Confirm Password" type="password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} placeholder="Repeat password" required autoComplete="new-password" />
                </div>

                {/* Farm details */}
                <div className="border-t border-border/30 pt-5 mt-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Farm Details (Optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField id="signup-city" label="City / Village" value={form.city} onChange={handleChange('city')} placeholder="Nagpur" autoComplete="address-level2" />
                    <FormField id="signup-state" label="State" value={form.state} onChange={handleChange('state')} placeholder="Maharashtra" autoComplete="address-level1" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <FormField id="signup-farm-size" label="Farm Size (acres)" type="number" value={form.farm_size_acres} onChange={handleChange('farm_size_acres')} placeholder="5" />
                    <div className="space-y-1.5">
                      <label htmlFor="signup-country" className="block text-sm font-medium text-foreground">Country</label>
                      <select id="signup-country" value={form.country} onChange={handleChange('country')} className="flex h-11 w-full rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition-all">
                        {['India', 'Bangladesh', 'Nepal', 'Sri Lanka', 'Pakistan', 'Other'].map((c) => (<option key={c} value={c}>{c}</option>))}
                      </select>
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
            <Card className="w-full max-w-sm shadow-2xl animate-slide-up">
              <CardContent className="p-8">
                <div className="text-center mb-6 flex flex-col items-center">
                  <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center text-2xl mb-4">📱</div>
                  <h3 className="text-xl font-bold text-foreground">Verify your phone</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Enter the 6-digit OTP sent to <strong className="text-foreground">{form.phone}</strong>
                  </p>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-lg px-3 py-2 font-medium">
                    💡 Mock mode: Check backend console for OTP
                  </div>
                </div>
                <Input type="text" maxLength={6} value={otpValue} onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" className="text-center text-2xl tracking-[0.5em] font-bold h-14 mb-6" autoFocus />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowOtpModal(false)} className="flex-1 h-11">Cancel</Button>
                  <Button onClick={handleVerifyOtp} disabled={otpVerifying || otpValue.length !== 6} className="flex-1 h-11">
                    {otpVerifying ? <Loader size={16} className="animate-spin" /> : 'Verify'}
                  </Button>
                </div>
                <button type="button" onClick={handleSendOtp} disabled={otpSending} className="w-full mt-4 text-xs text-primary font-semibold hover:underline disabled:opacity-50">
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
