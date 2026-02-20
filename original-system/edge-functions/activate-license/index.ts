// supabase/functions/activate-license/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { license_key, email } = await req.json()

    if (!license_key || !email) {
      return new Response(JSON.stringify({ success: false, error: 'license_key e email obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key.trim().toUpperCase())
      .single()

    if (error || !license) {
      return new Response(JSON.stringify({ success: false, error: 'Licença não encontrada' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (license.status === 'suspended') {
      return new Response(JSON.stringify({ success: false, error: 'Licença suspensa' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (license.status === 'expired') {
      return new Response(JSON.stringify({ success: false, error: 'Licença expirada' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Se já está ativada com outro email, bloqueia
    if (license.email && license.email.toLowerCase() !== email.toLowerCase() && license.activations >= license.max_activations) {
      return new Response(JSON.stringify({ success: false, error: 'Licença já ativada em outro dispositivo' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verifica limite de ativações (para nova ativação)
    if (!license.email && license.activations >= license.max_activations) {
      return new Response(JSON.stringify({ success: false, error: 'Limite de ativações atingido' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Ativa
    const updates: any = {
      status: 'active',
      last_seen_at: new Date().toISOString(),
    }
    if (!license.email) {
      updates.email = email
      updates.activations = (license.activations || 0) + 1
      updates.activated_at = new Date().toISOString()
    }

    await supabase.from('licenses').update(updates).eq('id', license.id)

    // Cria token de sessão
    const token = crypto.randomUUID() + '-' + Date.now()
    await supabase.from('license_sessions').insert({
      license_id: license.id,
      token,
      device_info: req.headers.get('user-agent') || 'extension',
    })

    await supabase.from('usage_logs').insert({
      license_id: license.id,
      email,
      action: 'activate',
      details: { success: true }
    })

    return new Response(JSON.stringify({
      success: true,
      activated: true,
      plan: license.plan,
      session_token: token,
      expires_at: license.expires_at,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
