import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { Clerk } from '@clerk/clerk-sdk-node';

interface DifyResponse {
  answer: string;
  metadata: {
    usage: {
      total_tokens: number;
      total_price: string;
    };
  };
}

interface UserUsage {
  count: number;
  lastReset: string;
}

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

const handler = async (req: VercelRequest, res: VercelResponse) => {
  console.log('Received request:', req.method, req.body);

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      console.log('Method Not Allowed');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username, userId } = req.body;
    console.log('Username:', username, 'UserId:', userId);

    if (!username || typeof username !== 'string' || username.trim() === '') {
      console.log('Invalid username');
      return res.status(400).json({ error: '有効なユーザー名を提供してください。' });
    }

    if (!userId) {
      console.log('Missing userId');
      return res.status(400).json({ error: 'ユーザーIDが必要です。' });
    }

    // Check user's usage
    const user = await clerk.users.getUser(userId);
    const userMetadata = user.privateMetadata as { usage?: UserUsage };
    let userUsage: UserUsage = userMetadata.usage || { count: 0, lastReset: new Date().toISOString() };

    // Reset count if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (userUsage.lastReset.split('T')[0] !== today) {
      userUsage = { count: 0, lastReset: new Date().toISOString() };
    }

    if (userUsage.count >= 3) {
      console.log('Usage limit exceeded');
      return res.status(403).json({ error: '本日の利用回数上限に達しました。' });
    }

    console.log('Sending request to Dify API');
    const response = await axios.post<DifyResponse>(
      `${process.env.DIFY_API_URL}/chat-messages`,
      {
        inputs: {},
        query: username,
        response_mode: 'blocking',
        user: process.env.USER_IDENTIFIER || 'unique-user-id',
        conversation_id: '',
        files: []
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        },
        timeout: 50000,
      }
    );

    console.log('Received response from Dify API:', response.data);
    const { answer, metadata } = response.data;

    // Update user's usage
    userUsage.count += 1;
    await clerk.users.updateUser(userId, {
      privateMetadata: { usage: userUsage },
    });

    return res.status(200).json({
      answer,
      totalTokens: metadata.usage.total_tokens,
      totalPrice: metadata.usage.total_price
    });
  } catch (error: any) {
    console.error('Error in check-trust function:', error);

    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Dify API responded with error:', error.response.data);
        return res.status(error.response.status).json({ error: error.response.data.message || 'Dify APIエラーが発生しました。' });
      } else if (error.request) {
        console.error('No response received from Dify API:', error.request);
        return res.status(500).json({ error: 'Dify APIへのリクエストがタイムアウトしました。' });
      } else {
        console.error('Error setting up request to Dify API:', error.message);
        return res.status(500).json({ error: 'Dify APIへのリクエスト中にエラーが発生しました。' });
      }
    }

    console.error('Unhandled error:', error);
    return res.status(500).json({ error: '内部サーバーエラーが発生しました。' });
  }
};

export default handler;