import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link as RouterLink } from 'react-router-dom';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { UserMenu } from '@/components/UserMenu';
import { supabase } from '@/lib/supabaseClient';

function TagInput({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState('');

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(values.filter((v) => v !== tag));
  }

  return (
    <div>
      <label className="field-label">{label}</label>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 bg-brand-100 text-brand-800 text-xs font-medium px-2 py-0.5 rounded-full"
            >
              {v}
              <button
                type="button"
                onClick={() => removeTag(v)}
                className="text-brand-600 hover:text-brand-800 ml-0.5 font-bold leading-none"
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className="field-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(); }
          }}
          placeholder={`Add ${label.toLowerCase()} and press Enter`}
        />
        <button
          type="button"
          onClick={addTag}
          className="btn-outline text-sm px-3 py-1.5 whitespace-nowrap"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [major, setMajor] = useState('');
  const [positions, setPositions] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  // Initialize form once profile + user are available
  useEffect(() => {
    if (!profile && !user) return;
    setFirstName(user?.user_metadata?.first_name ?? '');
    setLastName(user?.user_metadata?.last_name ?? '');
    setMajor(profile?.major ?? '');
    setPositions(profile?.positions ?? []);
    setLocations(profile?.locations ?? []);
  }, [profile, user]);

  async function handleSave() {
    try {
      await Promise.all([
        updateProfile.mutateAsync({ major: major || null, positions, locations }),
        supabase.auth.updateUser({ data: { first_name: firstName || null, last_name: lastName || null } }),
      ]);
      toast.success('Profile saved');
    } catch {
      toast.error('Save failed');
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      <AppHeader>
        <RouterLink
          to="/"
          className="text-accent-200 border border-accent-400 rounded-md px-3 py-1.5 text-sm hover:bg-white/10 transition-colors flex items-center gap-1.5"
        >
          <span className="text-sm">←</span>
          Dashboard
        </RouterLink>
        <UserMenu />
      </AppHeader>

      <div className="max-w-[800px] mx-auto py-8 px-4">
        <div className="bg-white rounded-xl border border-brand-100 overflow-hidden">
          {/* Card header */}
          <div className="bg-brand-50 border-b-2 border-brand-200 px-8 py-4">
            <h2 className="text-lg font-bold text-brand-800">User Profile</h2>
          </div>

          <div className="px-8 py-6">
            {isLoading ? (
              <div className="flex flex-col gap-4">
                <div className="animate-pulse bg-gray-200 rounded h-10 w-full" />
                <div className="animate-pulse bg-gray-200 rounded h-20 w-full" />
                <div className="animate-pulse bg-gray-200 rounded h-20 w-full" />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">First Name</label>
                    <input
                      className="field-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label className="field-label">Last Name</label>
                    <input
                      className="field-input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Major</label>
                  <input
                    className="field-input"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g. Computer Science"
                  />
                </div>

                <TagInput
                  label="Positions Looking For"
                  values={positions}
                  onChange={setPositions}
                />

                <TagInput
                  label="Preferred Locations"
                  values={locations}
                  onChange={setLocations}
                />

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={updateProfile.isPending}
                    className="btn-primary text-sm px-6"
                  >
                    {updateProfile.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Saving…
                      </span>
                    ) : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
