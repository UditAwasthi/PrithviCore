'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { User, Save, Lock, Loader } from 'lucide-react';
import { AxiosError } from 'axios';
import AppLayout from '@/components/layout/AppLayout';
import { authAPI } from '@/lib/api';
import { useAuth, type User as AuthUser } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface FieldProps {
  id: string; label: string; value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; autoComplete?: string;
}

function Field({ id, label, value, onChange, placeholder, type = 'text', autoComplete }: FieldProps) {
  return (
    <div className="space-y-1.5 w-full">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">{label}</label>
      <Input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
      />
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    city: user?.farm_location?.city ?? '',
    state: user?.farm_location?.state ?? '',
    country: user?.farm_location?.country ?? 'India',
    farm_size_acres: user?.farm_size_acres?.toString() ?? '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleFormChange = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const handlePwChange = (field: keyof typeof pwForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setPwForm((prev) => ({ ...prev, [field]: e.target.value }));

  const profileMutation = useMutation(
    ['profile'],
    () => authAPI.profile({
      name: form.name.trim(), phone: form.phone.trim() || undefined,
      farm_size_acres: form.farm_size_acres ? parseFloat(form.farm_size_acres) : undefined,
      farm_location: { city: form.city.trim() || undefined, state: form.state.trim() || undefined, country: form.country },
    }).then((r) => r.data as { user: AuthUser }),
    {
      onSuccess: (data) => { updateUser(data.user); toast.success('Profile updated!'); },
      onError: () => { toast.error('Failed to update profile'); },
    }
  );

  const passwordMutation = useMutation(
    ['password'],
    () => authAPI.password({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }).then((r) => r.data),
    {
      onSuccess: () => { toast.success('Password changed!'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
      onError: (err: unknown) => {
        const msg = err instanceof AxiosError ? (err.response?.data?.error ?? 'Password change failed') : 'Password change failed';
        toast.error(msg as string);
      },
    }
  );

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    passwordMutation.mutate();
  };

  if (!user) return null;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <User size={28} className="text-primary" /> Profile Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account credentials and farm parameters</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="xl:col-span-1">
          <Card className="shadow-sm border-border/50 text-center sticky top-24">
            <CardContent className="pt-8">
              <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-primary to-green-500 text-white text-5xl font-black flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 select-none transform transition-transform hover:scale-105 duration-300">
                {user.name[0].toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">{user.name}</h2>
              <p className="text-sm font-medium text-muted-foreground mt-1 mb-6">{user.email}</p>
              
              <div className="bg-muted/40 rounded-2xl p-4 text-left border border-border/50">
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-3">Account Details</p>
                
                <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-xs text-muted-foreground font-semibold">Tier</span>
                  <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-black rounded-md uppercase tracking-wider">
                    {user.plan.replace(/_/g, ' ')}
                  </span>
                </div>
                
                {user.farm_location?.city && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-xs text-muted-foreground font-semibold">Location</span>
                    <span className="text-xs font-bold text-foreground truncate max-w-[120px]" title={`${user.farm_location.city}, ${user.farm_location.state}`}>
                      {user.farm_location.city}
                    </span>
                  </div>
                )}
                
                {user.farm_size_acres != null && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-xs text-muted-foreground font-semibold">Farm Size</span>
                    <span className="text-xs font-bold text-foreground">{user.farm_size_acres} acres</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2 space-y-6">
          {/* Personal info */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/30">
              <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field id="pf-name" label="Full Name" value={form.name} onChange={handleFormChange('name')} placeholder="Your name" autoComplete="name" />
                  <Field id="pf-phone" label="Phone" value={form.phone} onChange={handleFormChange('phone')} placeholder="+91 9876543210" autoComplete="tel" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Field id="pf-city" label="City" value={form.city} onChange={handleFormChange('city')} placeholder="Nagpur" autoComplete="address-level2" />
                  <Field id="pf-state" label="State" value={form.state} onChange={handleFormChange('state')} placeholder="Maharashtra" autoComplete="address-level1" />
                  <Field id="pf-country" label="Country" value={form.country} onChange={handleFormChange('country')} placeholder="India" autoComplete="country-name" />
                </div>
                <div className="sm:w-1/3">
                  <Field id="pf-acres" label="Farm Size (acres)" type="number" value={form.farm_size_acres} onChange={handleFormChange('farm_size_acres')} placeholder="5" />
                </div>
                
                <div className="pt-4 border-t border-border/30 flex justify-end">
                  <Button type="button" onClick={() => profileMutation.mutate()} disabled={profileMutation.isLoading} className="font-bold shadow-sm px-6">
                    {profileMutation.isLoading ? <Loader size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/30">
               <CardTitle className="text-lg font-bold flex items-center gap-2 whitespace-nowrap"><Lock size={18} className="text-muted-foreground" /> Change Password</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePasswordSubmit} noValidate className="space-y-5">
                <div className="sm:w-1/2">
                   <Field id="pw-current" label="Current Password" type="password" value={pwForm.currentPassword} onChange={handlePwChange('currentPassword')} placeholder="••••••••" autoComplete="current-password" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field id="pw-new" label="New Password" type="password" value={pwForm.newPassword} onChange={handlePwChange('newPassword')} placeholder="Min 6 characters" autoComplete="new-password" />
                  <Field id="pw-confirm" label="Confirm Password" type="password" value={pwForm.confirmPassword} onChange={handlePwChange('confirmPassword')} placeholder="Repeat new password" autoComplete="new-password" />
                </div>
                <div className="pt-4 border-t border-border/30 flex justify-end">
                  <Button type="submit" disabled={passwordMutation.isLoading} variant="secondary" className="font-bold shadow-sm px-6">
                    {passwordMutation.isLoading ? <Loader size={16} className="animate-spin mr-2" /> : <Lock size={16} className="mr-2" />} Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
