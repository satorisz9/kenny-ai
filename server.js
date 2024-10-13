import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/api/check-trust', async (req, res) => {
  const { username } = req.query;
  
  if (!username) {
    return res.status(400).json({ error: 'ユーザー名が必要です。' });
  }

  try {
    const difyResponse = await fetch(`${process.env.DIFY_API_URL}/check-trust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`
      },
      body: JSON.stringify({ username })
    });

    if (!difyResponse.ok) {
      throw new Error('Dify APIリクエストに失敗しました。');
    }

    const data = await difyResponse.json();
    res.json({ trustScore: data.trustScore });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '信頼性の確認中にエラーが発生しました。' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});