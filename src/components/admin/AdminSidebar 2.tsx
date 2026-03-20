'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Image, Settings,
  Star, BarChart3, Tag, LogOut, Truck, Clock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/utils/helpers';

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/ordini', icon: ShoppingCart, label: 'Ordini' },
  { href: '/admin/prodotti', icon: Package, label: 'Prodotti' },
  { href: '/admin/categorie', icon: Tag, label: 'Categorie' },
  { href: '/admin/pagine', icon: FileText, label: 'Pagine' },
  { href: '/admin/media', icon: Image, label: 'Media' },
  { href: '/admin/recensioni', icon: Star, label: 'Recensioni' },
  { href: '/admin/statistiche', icon: BarChart3, label: 'Statistiche' },
  { href: '/admin/impostazioni', icon: Settings, label: 'Impostazioni' },
  { href: '/admin/impostazioni/tema', icon: Settings, label: 'Tema' },
  { href: '/admin/impostazioni/attivita', icon: Clock, label: 'Dati attività' },
  { href: '/admin/impostazioni/spedizione', icon: Truck, label: 'Spedizione' },
  { href: '/admin/impostazioni/navigazione', icon: FileText, label: 'Navigazione' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  return (
    <aside className="w-64 bg-gray-900 text-gray-300 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-bold text-white">Admin</h2>
        <p className="text-xs text-gray-500">Macelleria Amici</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-gray-800 text-white'
                : 'hover:bg-gray-800/50 hover:text-white'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/admin';
          }}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Esci
        </button>
      </div>
    </aside>
  );
}
