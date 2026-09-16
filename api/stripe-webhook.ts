/**
 * Vercel Serverless API: /api/stripe-webhook
 * Procesa los eventos de Stripe (pago exitoso, cancelación, renovación).
 * Actualiza la tabla 'profiles' en Supabase con el plan y fecha de expiración.
 *
 * Eventos manejados:
 *   checkout.session.completed → primer pago exitoso
 *   invoice.payment_succeeded  → renovación mensual exitosa
 *   customer.subscription.deleted → cancelación de suscripción
 *   customer.subscription.updated → cambio de plan
 *
 * Variables de entorno requeridas en Vercel:
 *   STRIPE_SECRET_KEY        → sk_live_...
 *   STRIPE_WEBHOOK_SECRET    → whsec_...  (desde Stripe Dashboard > Webhooks)
 *   SUPABASE_URL             → https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY     → service_role key (con permisos de escritura sin RLS)
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
})

// Usamos la service_role key (bypasa RLS — solo en backend nunca en frontend)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

// Mapeo de Price IDs → nombre del plan
function getPlanFromPriceId(priceId: string): 'personal' | 'pro' | null {
  if (priceId === process.env.STRIPE_PRICE_PERSONAL) return 'personal'
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro'
  return null
}

export const config = {
  api: { bodyParser: false }, // Stripe necesita el raw body para verificar firma
}

async function getRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  let event: Stripe.Event

  try {
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    switch (event.type) {
      // ── Primer pago completado ──────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id || session.client_reference_id
        const plan = session.metadata?.plan

        if (userId && plan) {
          // Obtener fecha de expiración de la suscripción
          const subscriptionId = session.subscription as string
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const expiresAt = new Date((subscription.current_period_end) * 1000).toISOString()

          await supabaseAdmin.from('profiles').upsert({
            id: userId,
            plan,
            plan_expires_at: expiresAt,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })

          console.log(`✅ Plan '${plan}' activado para usuario ${userId}`)
        }
        break
      }

      // ── Renovación mensual exitosa ─────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string
        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.supabase_user_id
        const priceId = subscription.items.data[0]?.price?.id
        const plan = getPlanFromPriceId(priceId)
        const expiresAt = new Date(subscription.current_period_end * 1000).toISOString()

        if (userId && plan) {
          await supabaseAdmin.from('profiles').update({
            plan,
            plan_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          }).eq('id', userId)

          console.log(`🔄 Renovación plan '${plan}' para usuario ${userId} hasta ${expiresAt}`)
        }
        break
      }

      // ── Suscripción cancelada ──────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id

        if (userId) {
          await supabaseAdmin.from('profiles').update({
            plan: 'free',
            plan_expires_at: null,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          }).eq('id', userId)

          console.log(`❌ Suscripción cancelada — usuario ${userId} vuelve a 'free'`)
        }
        break
      }

      // ── Cambio de plan (upgrade/downgrade) ────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id
        const priceId = subscription.items.data[0]?.price?.id
        const plan = getPlanFromPriceId(priceId)
        const expiresAt = new Date(subscription.current_period_end * 1000).toISOString()

        if (userId && plan) {
          await supabaseAdmin.from('profiles').update({
            plan,
            plan_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          }).eq('id', userId)

          console.log(`⬆️ Plan actualizado a '${plan}' para usuario ${userId}`)
        }
        break
      }

      default:
        console.log(`Evento no manejado: ${event.type}`)
    }
  } catch (err: any) {
    console.error('Error procesando webhook:', err)
    return res.status(500).json({ error: err.message })
  }

  return res.status(200).json({ received: true })
}
