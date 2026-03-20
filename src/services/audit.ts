import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminAuditLog } from '@/types';

export async function logAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string,
  oldValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      old_value: oldValue ?? null,
      new_value: newValue ?? null,
    });
  } catch (error) {
    // Audit logging should never block operations
    console.error('Audit log error:', error);
  }
}

export async function getRecentAuditLogs(
  supabase: SupabaseClient,
  limit: number = 50
): Promise<AdminAuditLog[]> {
  const { data } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as AdminAuditLog[];
}

export async function getAuditLogsForEntity(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string
): Promise<AdminAuditLog[]> {
  const { data } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  return (data ?? []) as AdminAuditLog[];
}
