// supabase/functions/validate-license/index.ts
// Deploy: supabase functions deploy validate-license

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

    if (!license_key) {
      return new Response(JSON.stringify({ success: false, error: 'license_key obrigatória' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Busca a licença
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key.trim().toUpperCase())
      .single()

    if (error || !license) {
      return new Response(JSON.stringify({ success: false, valid: false, error: 'Licença não encontrada' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verifica status
    if (license.status !== 'active') {
      return new Response(JSON.stringify({ success: false, valid: false, error: `Licença ${license.status}` }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verifica expiração
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await supabase.from('licenses').update({ status: 'expired' }).eq('id', license.id)
      return new Response(JSON.stringify({ success: false, valid: false, error: 'Licença expirada' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verifica email se fornecido
    if (email && license.email && license.email.toLowerCase() !== email.toLowerCase()) {
      return new Response(JSON.stringify({ success: false, valid: false, error: 'E-mail não corresponde a esta licença' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Atualiza last_seen
    await supabase.from('licenses').update({ last_seen_at: new Date().toISOString() }).eq('id', license.id)

    // Log
    await supabase.from('usage_logs').insert({
      license_id: license.id,
      email: license.email || email,
      action: 'validate',
      details: { success: true }
    })

    return new Response(JSON.stringify({
      success: true,
      valid: true,
      plan: license.plan,
      email: license.email,
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
