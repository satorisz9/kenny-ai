// api/check-trust.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username } = req.body;

  if (!username || typeof username !== 'string' || username.trim() === '') {
    return res.status(400).json({ error: '有効なユーザー名を提供してください。' });
  }

  try {
    const response = await axios.post(`${process.env.DIFY_API_URL}/chat-messages`, {
      query: `Check the trustworthiness of ${username}`,
      response_mode: 'blocking',
      user: process.env.USER_IDENTIFIER || 'unique-user-id',
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
      },
    });

    const { answer } = response.data;

    const trustScoreMatch = answer.match(/trust score[:：]\s*(\d+)%/i);
    if (trustScoreMatch) {
      const trustScore = parseInt(trustScoreMatch[1], 10);
      return res.json({ trustScore });
    } else {
      return res.status(500).json({ error: '信頼性スコアを解析できませんでした。' });
    }
  } catch (error: any) {
    console.error('Error communicating with Dify API:', error.message);
    if (error.response && error.response.data && error.response.data.message) {
      return res.status(error.response.status).json({ error: error.response.data.message });
    } else {
      return res.status(500).json({ error: 'Dify APIエラーが発生しました。' });
    }
  }
};
