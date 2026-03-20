'use client';

import Link from 'next/link';
import { Palette, Building, Truck, Menu, Clock } from 'lucide-react';

const SETTINGS_SECTIONS = [
  { href: '/admin/impostazioni/tema', icon: Palette, label: 'Tema Globale', description: 'Colori, font, pulsanti, stile hero' },
  { href: '/admin/impostazioni/attivita', icon: Building, label: 'Dati Attivita', description: 'Nome, indirizzi, telefono, WhatsApp, social' },
  { href: '/admin/impostazioni/spedizione', icon: Truck, label: 'Spedizione per CAP', description: 'Regole spedizione, costi per CAP' },
  { href: '/admin/impostazioni/orari', icon: Clock, label: 'Orari e Ritiro', description: 'Orari apertura, fasce ritiro, chiusure' },
  { href: '/admin/impostazioni/navigazione', icon: Menu, label: 'Navigazione', description: 'Menu, ordine voci, logo, favicon' },
];

export default function AdminImpostazioniPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Impostazioni</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SETTINGS_SECTIONS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow group"
          >
            <item.icon size={24} className="text-gray-400 group-hover:text-gray-900 transition-colors mb-3" />
            <h2 className="font-semibold text-gray-900">{item.label}</h2>
            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
