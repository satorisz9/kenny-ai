// src/App.tsx
import React, { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import axios from 'axios';

function App() {
  const [username, setUsername] = useState('');
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkTrust = async () => {
    if (!username.trim()) {
      setError('ユーザー名を入力してください。');
      setTrustScore(null);
      return;
    }

    setLoading(true);
    setError('');
    setTrustScore(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/check-trust`,
        { username },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { trustScore } = response.data;
      setTrustScore(trustScore);
    } catch (err: any) {
      console.error('Error fetching trust score:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('信頼性の確認中にエラーが発生しました。');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      checkTrust();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Xアカウント信頼性チェッカー</h1>
        <div className="mb-6">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Xのユーザー名
          </label>
          <div className="relative">
            <input
              type="text"
              id="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              aria-label="Xのユーザー名"
            />
            <button
              onClick={checkTrust}
              disabled={loading}
              className="absolute right-2 top-2 bg-blue-500 text-white p-1 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="信頼性をチェック"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">信頼性を確認中...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <div className="flex">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {trustScore !== null && (
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">信頼性スコア</h2>
            <p className={`text-4xl font-bold ${getTrustColor(trustScore)}`}>{trustScore}%</p>
            <p className="mt-2 text-gray-600">
              {trustScore >= 80
                ? '高い信頼性があります。'
                : trustScore >= 60
                ? '中程度の信頼性があります。'
                : '信頼性が低い可能性があります。'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
