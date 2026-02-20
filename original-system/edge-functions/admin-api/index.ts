// supabase/functions/admin-api/index.ts
// API centralizada para o painel admin

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
}

// Token secreto do admin — defina em Supabase Secrets
const ADMIN_SECRET = Deno.env.get('ADMIN_SECRET') || 'original-admin-2025'

function unauthorized() {
  return new Response(JSON.stringify({ error: 'Não autorizado' }), {
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const body = await req.json()
    const { action, token } = body

    // Verificação do token admin
    if (token !== ADMIN_SECRET) return unauthorized()

    // ── LIST LICENSES ──────────────────────────────────────────
    if (action === 'list_licenses') {
      const { page = 1, limit = 50, search = '', status = '' } = body
      let query = supabase.from('licenses').select('*', { count: 'exact' })

      if (search) {
        query = query.or(`license_key.ilike.%${search}%,email.ilike.%${search}%`)
      }
      if (status) query = query.eq('status', status)

      query = query.order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      const { data, error, count } = await query
      if (error) throw error
      return ok({ licenses: data, total: count, page, limit })
    }

    // ── CREATE LICENSE ─────────────────────────────────────────
    if (action === 'create_license') {
      const { email, plan = 'pro', max_activations = 1, expires_days, notes, quantity = 1 } = body
      const created = []

      for (let i = 0; i < Math.min(quantity, 100); i++) {
        const { data, error } = await supabase.rpc('create_license', {
          p_email: email || null,
          p_plan: plan,
          p_max_activations: max_activations,
          p_expires_days: expires_days || null,
          p_notes: notes || null,
        })
        if (error) throw error
        created.push(data)
      }

      return ok({ success: true, licenses: created })
    }

    // ── UPDATE LICENSE ─────────────────────────────────────────
    if (action === 'update_license') {
      const { id, updates } = body
      const allowed = ['status', 'plan', 'email', 'max_activations', 'expires_at', 'notes']
      const safeUpdates: any = {}
      allowed.forEach(k => { if (updates[k] !== undefined) safeUpdates[k] = updates[k] })

      const { data, error } = await supabase.from('licenses').update(safeUpdates).eq('id', id).select().single()
      if (error) throw error
      return ok({ success: true, license: data })
    }

    // ── DELETE LICENSE ─────────────────────────────────────────
    if (action === 'delete_license') {
      const { id } = body
      const { error } = await supabase.from('licenses').delete().eq('id', id)
      if (error) throw error
      return ok({ success: true })
    }

    // ── REVOKE LICENSE ─────────────────────────────────────────
    if (action === 'revoke_license') {
      const { id } = body
      const { data, error } = await supabase.from('licenses')
        .update({ status: 'suspended' }).eq('id', id).select().single()
      if (error) throw error
      // Remove sessões
      await supabase.from('license_sessions').delete().eq('license_id', id)
      return ok({ success: true, license: data })
    }

    // ── STATS ──────────────────────────────────────────────────
    if (action === 'get_stats') {
      const [total, active, suspended, expired, logs] = await Promise.all([
        supabase.from('licenses').select('*', { count: 'exact', head: true }),
        supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
        supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
        supabase.from('usage_logs').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      ])

      return ok({
        total_licenses: total.count || 0,
        active_licenses: active.count || 0,
        suspended_licenses: suspended.count || 0,
        expired_licenses: expired.count || 0,
        validations_today: logs.count || 0,
      })
    }

    // ── RECENT LOGS ────────────────────────────────────────────
    if (action === 'get_logs') {
      const { limit = 100 } = body
      const { data, error } = await supabase.from('usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return ok({ logs: data })
    }

    // ── ADMIN LOGIN ────────────────────────────────────────────
    if (action === 'admin_login') {
      // Simples: senha mastertoken
      const { password } = body
      if (password === ADMIN_SECRET) {
        return ok({ success: true, token: ADMIN_SECRET })
      }
      return new Response(JSON.stringify({ success: false, error: 'Senha incorreta' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Ação desconhecida' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  function ok(data: any) {
    return new Response(JSON.stringify(data), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
