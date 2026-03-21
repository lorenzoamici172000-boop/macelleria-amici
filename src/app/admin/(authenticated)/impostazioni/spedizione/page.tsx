'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCents, decimalToCents, centsToDecimal } from '@/utils/currency';
import { Plus, Trash2, Save } from 'lucide-react';
import { revalidatePublicPages } from '@/utils/revalidate';
import type { ShippingRule } from '@/types';

export default function AdminSpedizionePage() {
  const supabase = createClient();
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRule, setNewRule] = useState({ zip_code: '', cost_decimal: '', description: '', estimated_days: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRules = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('shipping_rules').select('*').order('zip_code');
    setRules((data ?? []) as ShippingRule[]);
    setIsLoading(false);
  };

  useEffect(() => { loadRules(); }, []);

  const handleAdd = async () => {
    setError(''); setSuccess('');
    if (!/^\d{5}$/.test(newRule.zip_code)) { setError('CAP non valido (5 cifre)'); return; }
    if (!newRule.cost_decimal || parseFloat(newRule.cost_decimal) < 0) { setError('Costo non valido'); return; }

    // Check duplicate active
    const existing = rules.find(r => r.zip_code === newRule.zip_code && r.is_active);
    if (existing) { setError('Esiste già una regola attiva per questo CAP'); return; }

    const { error: dbError } = await supabase.from('shipping_rules').insert({
      zip_code: newRule.zip_code,
      cost_cent: decimalToCents(newRule.cost_decimal),
      description: newRule.description,
      estimated_days: newRule.estimated_days,
      is_active: true,
    });

    if (dbError) { setError("Errore DB: " + dbError.message + " - Code: " + dbError.code + " - Details: " + dbError.details); return; }
    setNewRule({ zip_code: '', cost_decimal: '', description: '', estimated_days: '' });
    setSuccess('Regola aggiunta');
    revalidatePublicPages();
    loadRules();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await supabase.from('shipping_rules').update({ is_active: !isActive }).eq('id', id);
    loadRules();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa regola?')) return;
    await supabase.from('shipping_rules').delete().eq('id', id);
    loadRules();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Regole spedizione per CAP</h1>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {success && <div className="p-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>}

      {/* Add new */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-semibold mb-3">Aggiungi regola</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input placeholder="CAP (5 cifre)" value={newRule.zip_code} maxLength={5}
            onChange={(e) => setNewRule(p => ({ ...p, zip_code: e.target.value.replace(/\D/g, '') }))} />
          <Input placeholder="Costo (€)" value={newRule.cost_decimal} type="number" min="0" step="0.01"
            onChange={(e) => setNewRule(p => ({ ...p, cost_decimal: e.target.value }))} />
          <Input placeholder="Descrizione" value={newRule.description}
            onChange={(e) => setNewRule(p => ({ ...p, description: e.target.value }))} />
          <Button onClick={handleAdd} className="bg-gray-900 text-white hover:bg-gray-800">
            <Plus size={16} className="mr-1" /> Aggiungi
          </Button>
        </div>
      </div>

      {/* Rules list */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">CAP</th>
              <th className="text-right p-3">Costo</th>
              <th className="text-left p-3">Descrizione</th>
              <th className="text-center p-3">Stato</th>
              <th className="text-center p-3">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Caricamento...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nessuna regola configurata</td></tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono font-medium">{rule.zip_code}</td>
                  <td className="p-3 text-right">{formatCents(rule.cost_cent)}</td>
                  <td className="p-3 text-gray-500">{rule.description || '-'}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggle(rule.id, rule.is_active)}
                      className={`px-2 py-0.5 rounded text-xs ${rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {rule.is_active ? 'Attiva' : 'Inattiva'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleDelete(rule.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
