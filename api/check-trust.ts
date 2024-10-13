// api/check-trust.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

interface CheckTrustResponse {
  trustScore: number;
}

interface ErrorResponse {
  error: string;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username } = req.body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({ error: '有効なユーザー名を提供してください。' });
    }

    const response = await axios.post(
      `${process.env.DIFY_API_URL}/chat-messages`,
      {
        query: `Check the trustworthiness of ${username}`,
        response_mode: 'blocking',
        user: process.env.USER_IDENTIFIER || 'unique-user-id',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        },
      }
    );

    const { answer } = response.data;

    const trustScoreMatch = answer.match(/trust score[:：]\s*(\d+)%/i);
    if (trustScoreMatch) {
      const trustScore = parseInt(trustScoreMatch[1], 10);
      return res.status(200).json({ trustScore });
    } else {
      return res.status(500).json({ error: '信頼性スコアを解析できませんでした。' });
    }
  } catch (error: any) {
    console.error('Error in check-trust function:', error.message);

    if (axios.isAxiosError(error)) {
      if (error.response) {
        return res.status(error.response.status).json({ error: error.response.data.message || 'Dify APIエラーが発生しました。' });
      } else if (error.request) {
        return res.status(500).json({ error: 'Dify APIへのリクエストがタイムアウトしました。' });
      } else {
        return res.status(500).json({ error: 'Dify APIへのリクエスト中にエラーが発生しました。' });
      }
    }

    return res.status(500).json({ error: '内部サーバーエラーが発生しました。' });
  }
};
