'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { User, Save, Lock, Loader } from 'lucide-react';
import { AxiosError } from 'axios';
import AppLayout from '@/components/layout/AppLayout';
import { authAPI } from '@/lib/api';
import { useAuth, type User as AuthUser } from '@/lib/AuthContext';

// ── Field must be OUTSIDE ProfilePage to prevent remount → focus loss ─────────
interface FieldProps {
  id: string; label: string; value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; autoComplete?: string;
}
function Field({ id, label, value, onChange, placeholder, type = 'text', autoComplete }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-agri-700 mb-1.5">{label}</label>
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        className="w-full px-4 py-2.5 rounded-xl border border-agri-200 bg-white text-sm text-gray-800
                   placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-agri-300
                   focus:border-agri-400 transition-colors duration-150"
      />
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name:            user?.name ?? '',
    phone:           user?.phone ?? '',
    city:            user?.farm_location?.city    ?? '',
    state:           user?.farm_location?.state   ?? '',
    country:         user?.farm_location?.country ?? 'India',
    farm_size_acres: user?.farm_size_acres?.toString() ?? '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleFormChange = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const handlePwChange = (field: keyof typeof pwForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setPwForm((prev) => ({ ...prev, [field]: e.target.value }));

  const profileMutation = useMutation(
    () => authAPI.profile({
      name: form.name.trim(), phone: form.phone.trim() || undefined,
      farm_size_acres: form.farm_size_acres ? parseFloat(form.farm_size_acres) : undefined,
      farm_location: { city: form.city.trim() || undefined, state: form.state.trim() || undefined, country: form.country },
    }).then((r) => r.data as { user: AuthUser }),
    {
      onSuccess: (data) => { updateUser(data.user); toast.success('Profile updated!'); },
      onError:   ()     => toast.error('Failed to update profile'),
    }
  );

  const passwordMutation = useMutation(
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
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-agri-700 flex items-center gap-2"><User size={24} /> Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and farm details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="bg-white rounded-2xl border border-agri-100 p-6 shadow-sm text-center">
          <div className="w-24 h-24 rounded-full bg-agri-600 text-white text-4xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-lg select-none">
            {user.name[0].toUpperCase()}
          </div>
          <h2 className="text-lg font-bold text-agri-700">{user.name}</h2>
          <p className="text-sm text-gray-400">{user.email}</p>
          <span className="inline-block mt-3 px-3 py-1 bg-agri-100 text-agri-700 text-xs font-bold rounded-full capitalize">
            🌱 {user.plan.replace(/_/g, ' ')} Plan
          </span>
          {user.farm_location?.city && (
            <p className="text-xs text-gray-400 mt-3">📍 {user.farm_location.city}{user.farm_location.state ? `, ${user.farm_location.state}` : ''}</p>
          )}
          {user.farm_size_acres != null && <p className="text-xs text-gray-400 mt-1">🌾 {user.farm_size_acres} acres</p>}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Personal info */}
          <div className="bg-white rounded-2xl border border-agri-100 p-6 shadow-sm">
            <h3 className="font-bold text-agri-700 mb-5">Personal Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="pf-name"  label="Full Name" value={form.name}  onChange={handleFormChange('name')}  placeholder="Your name"       autoComplete="name" />
                <Field id="pf-phone" label="Phone"     value={form.phone} onChange={handleFormChange('phone')} placeholder="+91 9876543210" autoComplete="tel"  />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field id="pf-city"    label="City"    value={form.city}    onChange={handleFormChange('city')}    placeholder="Nagpur"       autoComplete="address-level2" />
                <Field id="pf-state"   label="State"   value={form.state}   onChange={handleFormChange('state')}   placeholder="Maharashtra"  autoComplete="address-level1" />
                <Field id="pf-country" label="Country" value={form.country} onChange={handleFormChange('country')} placeholder="India"        autoComplete="country-name" />
              </div>
              <Field id="pf-acres" label="Farm Size (acres)" type="number" value={form.farm_size_acres} onChange={handleFormChange('farm_size_acres')} placeholder="5" />
              <button type="button" onClick={() => profileMutation.mutate()} disabled={profileMutation.isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-agri-600 text-white text-sm font-bold rounded-xl hover:bg-agri-700 transition-colors disabled:opacity-60">
                {profileMutation.isLoading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="bg-white rounded-2xl border border-agri-100 p-6 shadow-sm">
            <h3 className="font-bold text-agri-700 mb-5 flex items-center gap-2"><Lock size={16} /> Change Password</h3>
            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
              <Field id="pw-current" label="Current Password" type="password" value={pwForm.currentPassword} onChange={handlePwChange('currentPassword')} placeholder="••••••••" autoComplete="current-password" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="pw-new"     label="New Password"     type="password" value={pwForm.newPassword}     onChange={handlePwChange('newPassword')}     placeholder="Min 6 chars" autoComplete="new-password" />
                <Field id="pw-confirm" label="Confirm Password" type="password" value={pwForm.confirmPassword} onChange={handlePwChange('confirmPassword')} placeholder="Repeat"      autoComplete="new-password" />
              </div>
              <button type="submit" disabled={passwordMutation.isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-agri-600 text-white text-sm font-bold rounded-xl hover:bg-agri-700 transition-colors disabled:opacity-60">
                {passwordMutation.isLoading ? <Loader size={14} className="animate-spin" /> : <Lock size={14} />} Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
