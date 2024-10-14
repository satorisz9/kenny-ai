import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'jpy',
    });

    res.status(200).json(paymentIntent.client_secret);
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ error: '支払い処理の準備中にエラーが発生しました。' });
  }
}