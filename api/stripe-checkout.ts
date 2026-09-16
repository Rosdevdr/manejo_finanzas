/**
 * Vercel Serverless API: /api/stripe-checkout
 * Crea una sesión de Stripe Checkout para el plan solicitado.
 *
 * POST /api/stripe-checkout
 * Body: { plan: 'personal' | 'pro', userId: string, userEmail: string }
 * Response: { url: string } — URL de Stripe Checkout para redirigir al usuario
 *
 * Variables de entorno requeridas en Vercel:
 *   STRIPE_SECRET_KEY     → sk_live_... o sk_test_...
 *   STRIPE_PRICE_PERSONAL → price_... (Price ID del plan Personal en Stripe)
 *   STRIPE_PRICE_PRO      → price_... (Price ID del plan Pro en Stripe)
 *   VITE_APP_URL          → https://tu-app.vercel.app (sin trailing slash)
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
})

const PRICE_IDS: Record<string, string> = {
  personal: process.env.STRIPE_PRICE_PERSONAL || '',
  pro: process.env.STRIPE_PRICE_PRO || '',
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { plan, userId, userEmail } = req.body

  if (!plan || !userId) {
    return res.status(400).json({ error: 'Faltan parámetros: plan y userId son requeridos' })
  }

  const priceId = PRICE_IDS[plan]
  if (!priceId) {
    return res.status(400).json({ error: `Plan inválido: ${plan}` })
  }

  try {
    const appUrl = process.env.VITE_APP_URL || 'https://manejo-finanzas.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail || undefined,
      client_reference_id: userId,          // ID de Supabase del usuario
      metadata: {
        supabase_user_id: userId,
        plan,
      },
      success_url: `${appUrl}/?checkout=success&plan=${plan}`,
      cancel_url: `${appUrl}/?checkout=cancelled`,
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          plan,
        },
      },
      // Permite pagar en DOP si tu cuenta de Stripe está configurada para RD
      // currency: 'dop',
    })

    return res.status(200).json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err)
    return res.status(500).json({ error: err.message || 'Error al crear sesión de pago' })
  }
}
