import { supabase } from './supabase'

export type Role = 'super_admin' | 'admin' | 'viewer'
export type Signup = { id: string; email: string; language: string; payment_provider: string; note: string | null; status: string; created_at: string }
export type Filters = { q: string; language: string; provider: string; status: string }
export type Stats = {
  total: number; today: number; last7: number; removals: number
  by_language: Record<string, number>; by_provider: Record<string, number>
  daily: { day: string; count: number }[]
}
export type Member = { user_id: string; email: string; role: Role; created_at: string; last_sign_in_at: string | null }
export type AuditRow = { id: number; at: string; actor_email: string | null; action: string; target: string | null }

const ERRORS: Record<string, string> = {
  forbidden: 'You do not have permission to do that.',
  user_not_found: 'No account with that email. Create the user in Supabase Authentication first.',
  cannot_change_self: 'You cannot change your own role.',
  cannot_remove_self: 'You cannot remove yourself.',
  invalid_role: 'That role is not valid.',
  invalid_status: 'That status is not valid.',
  not_found: 'That record no longer exists.',
}

export function errorMessage(e: { message?: string } | null | undefined): string {
  const m = e?.message ?? ''
  const hit = Object.keys(ERRORS).find((k) => m.includes(k))
  return hit ? ERRORS[hit] : 'Something went wrong. Please try again.'
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(errorMessage(error))
  return data as T
}

export const api = {
  me: () => rpc<Role | null>('admin_me'),
  stats: () => rpc<Stats>('admin_waitlist_stats'),
  list: (f: Filters, limit: number, offset: number) =>
    rpc<{ total: number; rows: Signup[] }>('admin_waitlist_list', {
      p_search: f.q || null, p_language: f.language || null, p_provider: f.provider || null,
      p_status: f.status || null, p_limit: limit, p_offset: offset,
    }),
  setStatus: (id: string, status: string) => rpc('admin_waitlist_set_status', { p_id: id, p_status: status }),
  remove: (id: string) => rpc('admin_waitlist_delete', { p_id: id }),
  logExport: (count: number) => rpc('admin_log_export', { p_count: count }),
  team: () => rpc<Member[]>('admin_team_list'),
  addMember: (email: string, role: Role) => rpc('admin_team_add', { p_email: email, p_role: role }),
  setRole: (user: string, role: Role) => rpc('admin_team_set_role', { p_user: user, p_role: role }),
  removeMember: (user: string) => rpc('admin_team_remove', { p_user: user }),
  audit: (limit: number, offset: number) => rpc<{ total: number; rows: AuditRow[] }>('admin_audit_list', { p_limit: limit, p_offset: offset }),
}
