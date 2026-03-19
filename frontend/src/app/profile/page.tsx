'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Loader, Eye, EyeOff, User as UserIcon, MapPin, Ruler, CalendarClock, Mail, Shield } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth, type User } from '@/lib/AuthContext';
import { authAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [farmSize, setFarmSize] = useState(String(user?.farm_size_acres ?? ''));
  const [city, setCity] = useState(user?.farm_location?.city ?? '');
  const [state, setState] = useState(user?.farm_location?.state ?? '');
  const [saving, setSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        farm_size_acres: farmSize ? parseFloat(farmSize) : undefined,
        farm_location: { city: city || undefined, state: state || undefined, country: user?.farm_location?.country || 'India' },
      };
      await authAPI.profile(payload);
      // Update user context with new data
      if (user) {
        updateUser({ ...user, name, farm_size_acres: farmSize ? parseFloat(farmSize) : user.farm_size_acres, farm_location: { ...user.farm_location, city, state } } as User);
      }
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePwChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { toast.error('Passwords do not match.'); return; }
    setChangingPw(true);
    try {
      await authAPI.password({ current_password: currentPw, new_password: newPw });
      toast.success('Password changed successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch {
      toast.error('Password change failed. Check current password.');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <UserIcon size={26} className="text-emerald-500" /> My Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal details, farm information, and account security</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Profile Card */}
        <Card className="xl:col-span-1 h-fit">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-white text-3xl font-black flex items-center justify-center shadow-xl shadow-emerald-500/20 ring-4 ring-background">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>

            <h2 className="text-xl font-bold mt-4 text-foreground tracking-tight">{user?.name ?? 'User'}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1"><Mail size={12} /> {user?.email}</p>

            <div className="w-full border-t border-border/30 mt-6 pt-5 space-y-3 text-left">
              {[
                { icon: <MapPin size={14} className="text-emerald-500" />, label: 'Location', value: user?.farm_location?.city ? `${user.farm_location.city}, ${user.farm_location.state}` : 'Not set' },
                { icon: <Ruler size={14} className="text-sky-500" />, label: 'Farm Size', value: user?.farm_size_acres ? `${user.farm_size_acres} acres` : 'Not set' },
                { icon: <CalendarClock size={14} className="text-amber-500" />, label: 'Plan', value: user?.plan ?? 'Free' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground font-medium">{item.icon} {item.label}</span>
                  <span className="font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit Forms */}
        <div className="xl:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-base font-bold flex items-center gap-2"><UserIcon size={17} className="text-muted-foreground" /> Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field id="prof-name" label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                  <Field id="prof-email" label="Email" value={user?.email ?? ''} disabled />
                </div>
                <div className="border-t border-border/20 pt-5 mt-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Farm Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field id="prof-city" label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Pune" />
                    <Field id="prof-state" label="State" value={state} onChange={(e) => setState(e.target.value)} placeholder="Maharashtra" />
                    <Field id="prof-size" label="Farm Size (acres)" type="number" value={farmSize} onChange={(e) => setFarmSize(e.target.value)} placeholder="5" />
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="shadow-lg mt-2 px-6">
                  {saving ? <><Loader size={14} className="animate-spin mr-2" /> Saving…</> : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-base font-bold flex items-center gap-2"><Shield size={17} className="text-amber-500" /> Change Password</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handlePwChange} className="space-y-4">
                <Field id="prof-cur-pw" label="Current Password" type={showPw ? 'text' : 'password'} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required
                  extra={
                    <button type="button" onClick={() => setShowPw(!showPw)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field id="prof-new-pw" label="New Password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
                  <Field id="prof-confirm-pw" label="Confirm Password" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
                </div>
                <Button type="submit" disabled={changingPw} className="shadow-lg px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-amber-500/20">
                  {changingPw ? <><Loader size={14} className="animate-spin mr-2" /> Updating…</> : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

interface FieldProps {
  id: string; label: string; type?: string; value: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean; required?: boolean; placeholder?: string; minLength?: number;
  extra?: React.ReactNode;
}
function Field({ id, label, type = 'text', value, onChange, disabled, required, placeholder, minLength, extra }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        <Input id={id} type={type} value={value} onChange={onChange} disabled={disabled} required={required} placeholder={placeholder} minLength={minLength}
          className={cn(disabled && 'opacity-60', extra ? 'pr-10' : '')} />
        {extra && <div className="absolute right-3 top-1/2 -translate-y-1/2">{extra}</div>}
      </div>
    </div>
  );
}
