'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError('Email o password non corretti');
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Errore di accesso'); setIsLoading(false); return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') {
        setError('Accesso non autorizzato');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch {
      setError('Errore di accesso');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4"><Shield size={40} className="text-gray-500" /></div>
        <h1 className="text-2xl text-white text-center mb-1" style={{ fontFamily: 'var(--font-display)' }}>Pannello Admin</h1>
        <p className="text-gray-400 text-center mb-6 text-sm">Macelleria Amici</p>
        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm block mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-gray-500" />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-gray-500" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition-colors">
            {isLoading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
