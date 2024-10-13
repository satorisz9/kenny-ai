// src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import asyncHandler from './asyncHandler';

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェアの設定
app.use(cors());
app.use(express.json());

// リクエストボディの型定義
interface CheckTrustRequest {
  username: string;
}

// Dify APIレスポンスの型定義
interface DifyChatMessagesResponse {
  event: string;
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: {
    usage: {
      prompt_tokens: number;
      prompt_unit_price: string;
      prompt_price_unit: string;
      prompt_price: string;
      completion_tokens: number;
      completion_unit_price: string;
      completion_price_unit: string;
      completion_price: string;
      total_tokens: number;
      total_price: string;
      currency: string;
      latency: number;
    };
    retriever_resources: Array<{
      position: number;
      dataset_id: string;
      dataset_name: string;
      document_id: string;
      document_name: string;
      segment_id: string;
      score: number;
      content: string;
    }>;
  };
  created_at: number;
}

// エラーハンドリング用のミドルウェア
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: '内部サーバーエラーが発生しました。' });
});

// エンドポイント: /api/check-trust
app.post(
  '/api/check-trust',
  asyncHandler(async (req: Request<{}, {}, CheckTrustRequest>, res: Response) => {
    const { username } = req.body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      res.status(400).json({ error: '有効なユーザー名を提供してください。' });
      return;
    }

    try {
      // Dify APIへのリクエスト
      const response = await axios.post<DifyChatMessagesResponse>(
        `${process.env.DIFY_API_URL}/chat-messages`,
        {
          query: `Check the trustworthiness of ${username}`,
          response_mode: 'blocking',
          user: process.env.USER_IDENTIFIER || 'unique-user-id', // ユニークなユーザーIDを適宜設定
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
          },
        }
      );

      const { answer } = response.data;

      // 信頼性スコアの抽出（Difyの応答形式に基づいて解析）
      const trustScoreMatch = answer.match(/trust score[:：]\s*(\d+)%/i);
      if (trustScoreMatch) {
        const trustScore = parseInt(trustScoreMatch[1], 10);
        res.json({ trustScore });
      } else {
        // 予期しない応答形式の場合
        res.status(500).json({ error: '信頼性スコアを解析できませんでした。' });
      }
    } catch (error: any) {
      console.error('Error communicating with Dify API:', error.message);
      if (error.response && error.response.data && error.response.data.message) {
        res.status(error.response.status).json({ error: error.response.data.message });
      } else {
        res.status(500).json({ error: 'Dify APIエラーが発生しました。' });
      }
    }
  })
);

// サーバーの起動
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
