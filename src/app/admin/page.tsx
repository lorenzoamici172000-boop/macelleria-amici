'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debug, setDebug] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebug('');
    setIsLoading(true);

    try {
      setDebug('Step 1: Signing in...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (authError) {
        setError('Login fallito: ' + authError.message);
        setDebug('Auth error: ' + JSON.stringify(authError));
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Nessun utente restituito');
        setIsLoading(false);
        return;
      }

      setDebug('Step 2: User ID = ' + authData.user.id + '. Checking profile...');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        setError('Errore profilo: ' + profileError.message + ' (code: ' + profileError.code + ')');
        setDebug('Profile error: ' + JSON.stringify(profileError));
        setIsLoading(false);
        return;
      }

      if (!profile) {
        setError('Profilo non trovato per user ID: ' + authData.user.id);
        setIsLoading(false);
        return;
      }

      setDebug('Step 3: Role = ' + profile.role);

      if (profile.role !== 'admin') {
        setError('Ruolo non admin. Ruolo attuale: ' + (profile.role || 'NULL'));
        setIsLoading(false);
        return;
      }

      setDebug('Step 4: Redirecting to dashboard...');
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError('Errore: ' + (err?.message || String(err)));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl text-white text-center mb-2" style={{ fontFamily: 'var(--font-display)' }}>Pannello Admin</h1>
        <p className="text-gray-400 text-center mb-6 text-sm">Macelleria Amici</p>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm break-all">{error}</div>}
        {debug && <div className="bg-blue-900/50 border border-blue-500 text-blue-200 p-3 rounded mb-4 text-xs break-all">{debug}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          </div>
          <div>
            <label className="text-gray-300 text-sm">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          </div>
          <button type="submit" disabled={isLoading}
            className="w-full py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50">
            {isLoading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
