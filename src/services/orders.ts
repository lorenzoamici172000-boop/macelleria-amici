import type { SupabaseClient } from '@supabase/supabase-js';
import type { Order, OrderStatus, PaymentStatus, ORDER_STATUS_TRANSITIONS } from '@/types';

export async function getUserOrders(
  supabase: SupabaseClient,
  userId: string,
  filters?: { search?: string; status?: OrderStatus }
): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('order_status', filters.status);
  }
  if (filters?.search) {
    query = query.or(`order_number.eq.${parseInt(filters.search) || 0},notes.ilike.%${filters.search}%`);
  }

  const { data } = await query;
  return (data ?? []) as Order[];
}

export async function getOrderById(
  supabase: SupabaseClient,
  orderId: string,
  userId?: string
): Promise<Order | null> {
  let query = supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', orderId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data } = await query.single();
  return data as Order | null;
}

export async function getOrderByNumber(
  supabase: SupabaseClient,
  orderNumber: number
): Promise<Order | null> {
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*), user:profiles(first_name, last_name, email, username)')
    .eq('order_number', orderNumber)
    .single();
  return data as Order | null;
}

// ---- Admin functions ----

export async function getAllOrders(
  supabase: SupabaseClient,
  filters?: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    search?: string;
    orderType?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ orders: Order[]; total: number }> {
  let query = supabase
    .from('orders')
    .select('*, items:order_items(*), user:profiles(first_name, last_name, email, username)', { count: 'exact' })
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('order_status', filters.status);
  if (filters?.paymentStatus) query = query.eq('payment_status', filters.paymentStatus);
  if (filters?.orderType) query = query.eq('order_type', filters.orderType);
  if (filters?.search) {
    const num = parseInt(filters.search);
    if (!isNaN(num)) {
      query = query.eq('order_number', num);
    }
  }
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1);

  const { data, count } = await query;
  return { orders: (data ?? []) as Order[], total: count ?? 0 };
}

export async function getReservations(
  supabase: SupabaseClient,
  status?: 'all' | 'active' | 'old' | 'very_old'
): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*, items:order_items(*), user:profiles(first_name, last_name, email, username)')
    .eq('order_type', 'in_store_payment')
    .in('order_status', ['reserved', 'preparing'])
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  const { data } = await query;
  return (data ?? []) as Order[];
}

export async function updateOrderStatus(
  supabase: SupabaseClient,
  orderId: string,
  newStatus: OrderStatus,
  validTransitions: Record<string, string[]>
): Promise<{ success: boolean; error?: string }> {
  // Get current order
  const { data: order } = await supabase
    .from('orders')
    .select('order_status')
    .eq('id', orderId)
    .single();

  if (!order) return { success: false, error: 'Ordine non trovato' };

  // Validate transition
  const allowed = validTransitions[order.order_status];
  if (!allowed?.includes(newStatus)) {
    return { success: false, error: `Transizione non valida: ${order.order_status} → ${newStatus}` };
  }

  const { error } = await supabase
    .from('orders')
    .update({ order_status: newStatus })
    .eq('id', orderId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updatePaymentStatus(
  supabase: SupabaseClient,
  orderId: string,
  status: PaymentStatus
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: status })
    .eq('id', orderId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getFailedRefunds(supabase: SupabaseClient): Promise<Order[]> {
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*), user:profiles(first_name, last_name, email)')
    .eq('payment_status', 'refund_failed_retry')
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false });

  return (data ?? []) as Order[];
}
