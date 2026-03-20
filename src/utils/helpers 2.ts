import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';
import { it, enGB } from 'date-fns/locale';
import type { Locale } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string, locale: Locale = 'it'): string {
  try {
    return format(parseISO(date), 'dd/MM/yyyy', {
      locale: locale === 'it' ? it : enGB,
    });
  } catch {
    return date;
  }
}

export function formatDateTime(date: string, locale: Locale = 'it'): string {
  try {
    return format(parseISO(date), 'dd/MM/yyyy HH:mm', {
      locale: locale === 'it' ? it : enGB,
    });
  } catch {
    return date;
  }
}

export function timeAgo(date: string, locale: Locale = 'it'): string {
  try {
    return formatDistanceToNow(parseISO(date), {
      addSuffix: true,
      locale: locale === 'it' ? it : enGB,
    });
  } catch {
    return date;
  }
}

export function getReservationAge(createdAt: string): 'new' | 'old' | 'very_old' {
  const days = differenceInDays(new Date(), parseISO(createdAt));
  if (days < 7) return 'new';
  if (days < 30) return 'old';
  return 'very_old';
}

export function getReservationAgeColor(age: 'new' | 'old' | 'very_old'): string {
  switch (age) {
    case 'new': return 'bg-green-100 text-green-800 border-green-200';
    case 'old': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'very_old': return 'bg-red-100 text-red-800 border-red-200';
  }
}

export function getReservationAgeLabel(age: 'new' | 'old' | 'very_old'): string {
  switch (age) {
    case 'new': return 'Nuova';
    case 'old': return 'Vecchia';
    case 'very_old': return 'Molto vecchia';
  }
}

export function generateWhatsAppLink(number: string, message?: string): string {
  const cleaned = number.replace(/\D/g, '');
  const fullNumber = cleaned.startsWith('39') ? cleaned : `39${cleaned}`;
  const url = `https://wa.me/${fullNumber}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function generateSafeFilename(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() ?? '';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    reserved: 'bg-purple-100 text-purple-800',
    pending_payment: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    picked_up: 'bg-teal-100 text-teal-800',
    preparing: 'bg-orange-100 text-orange-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-gray-100 text-gray-800',
    failed: 'bg-red-100 text-red-800',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-800';
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    not_required: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-800',
    authorized: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    canceled: 'bg-gray-100 text-gray-600',
    refunded: 'bg-purple-100 text-purple-800',
    partially_refunded: 'bg-orange-100 text-orange-800',
    refund_failed_retry: 'bg-red-200 text-red-900',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-800';
}
