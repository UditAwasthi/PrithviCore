'use client';

import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader, User as UserIcon, MapPin, Ruler, CalendarClock, Mail } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth, type User } from '@/lib/AuthContext';
import { authAPI } from '@/lib/api';
import { State, City } from 'country-state-city';
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

  const [country, setCountry] = useState(user?.farm_location?.country || 'India');
  const [selectedStateCode, setSelectedStateCode] = useState('');

  const getCountryCode = (name: string) => {
    const map: Record<string, string> = { 'India': 'IN', 'Bangladesh': 'BD', 'Nepal': 'NP', 'Sri Lanka': 'LK', 'Pakistan': 'PK' };
    return map[name] || '';
  };

  useEffect(() => {
    if (user?.farm_location?.state) {
      const cCode = getCountryCode(country);
      const states = State.getStatesOfCountry(cCode);
      const st = states.find(s => s.name === user?.farm_location?.state);
      if (st) setSelectedStateCode(st.isoCode);
    }
  }, [user, country]);

  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value);
    setState('');
    setCity('');
    setSelectedStateCode('');
  };

  const handleStateSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedStateCode(code);
    const cCode = getCountryCode(country);
    const stateName = State.getStateByCodeAndCountry(code, cCode)?.name || code;
    setState(stateName);
    setCity('');
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        farm_size_acres: farmSize ? parseFloat(farmSize) : undefined,
        farm_location: { city: city || undefined, state: state || undefined, country },
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



  return (
    <AppLayout>
      {user?.is_guest ? (
        <div className="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-md mx-auto animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 rounded-3xl flex items-center justify-center text-emerald-500 mb-8 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20 rotate-3">
            <UserIcon size={40} />
          </div>
          <h2 className="text-3xl font-black text-foreground mb-4 tracking-tight">Unlock Profile Setup</h2>
          <p className="text-muted-foreground mb-10 text-base leading-relaxed">
            You are currently exploring in free trial mode. Sign up to save your farm&apos;s location, dimensions, and preferences permanently.
          </p>
          <Link href="/signup">
            <Button size="lg" className="rounded-full shadow-xl shadow-emerald-500/20 px-8 py-6 text-base font-bold group">
              Create Free Account
            </Button>
          </Link>
        </div>
      ) : (
      <>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="prof-state" className="block text-sm font-medium text-foreground">State</label>
                      {getCountryCode(country) ? (
                        <select id="prof-state" value={selectedStateCode} onChange={handleStateSelect} className="flex h-11 w-full rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition-all">
                          <option value="">Select State</option>
                          {State.getStatesOfCountry(getCountryCode(country)).map(s => (
                            <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                          ))}
                        </select>
                      ) : (
                        <Input id="prof-state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="prof-city" className="block text-sm font-medium text-foreground">City</label>
                      {getCountryCode(country) && selectedStateCode ? (
                        <select id="prof-city" value={city} onChange={(e) => setCity(e.target.value)} className="flex h-11 w-full rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition-all">
                          <option value="">Select City</option>
                          {City.getCitiesOfState(getCountryCode(country), selectedStateCode).map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <Input id="prof-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="prof-country" className="block text-sm font-medium text-foreground">Country</label>
                      <select id="prof-country" value={country} onChange={handleCountryChange} className="flex h-11 w-full rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition-all">
                        {['India', 'Bangladesh', 'Nepal', 'Sri Lanka', 'Pakistan', 'Other'].map((c) => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                    <Field id="prof-size" label="Farm Size (acres)" type="number" value={farmSize} onChange={(e) => setFarmSize(e.target.value)} placeholder="e.g. 5" />
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="shadow-lg mt-2 px-6">
                  {saving ? <><Loader size={14} className="animate-spin mr-2" /> Saving…</> : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>


        </div>
      </div>
      </>
      )}
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
