import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

interface DifyResponse {
  answer: string;
  metadata: {
    usage: {
      total_tokens: number;
      total_price: string;
    };
  };
}

const handler = async (req: VercelRequest, res: VercelResponse) => {
  console.log('Received request:', req.method, req.body);

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      console.log('Method Not Allowed');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username } = req.body;
    console.log('Username:', username);

    if (!username || typeof username !== 'string' || username.trim() === '') {
      console.log('Invalid username');
      return res.status(400).json({ error: '有効なユーザー名を提供してください。' });
    }

    console.log('Sending request to Dify API');
    const response = await axios.post<DifyResponse>(
      `${process.env.DIFY_API_URL}/chat-messages`,
      {
        inputs: {},
        query: username, // ユーザーIDのみを送信
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
        timeout: 50000, // タイムアウトを50秒に設定
      }
    );

    console.log('Received response from Dify API:', response.data);
    const { answer, metadata } = response.data;

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