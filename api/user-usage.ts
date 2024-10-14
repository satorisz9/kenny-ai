import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Clerk } from '@clerk/clerk-sdk-node';

interface UserUsage {
  count: number;
  lastReset: string;
}

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'ユーザーIDが必要です。' });
  }

  try {
    const user = await clerk.users.getUser(userId);
    const userMetadata = user.privateMetadata as { usage?: UserUsage };
    let usage: UserUsage = userMetadata.usage || { count: 0, lastReset: new Date().toISOString() };

    // Reset count if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (usage.lastReset.split('T')[0] !== today) {
      usage = { count: 0, lastReset: new Date().toISOString() };
      await clerk.users.updateUser(userId, {
        privateMetadata: { usage },
      });
    }

    res.status(200).json(usage);
  } catch (error) {
    console.error('Error fetching user usage:', error);
    res.status(500).json({ error: 'ユーザー使用状況の取得中にエラーが発生しました。' });
  }
}