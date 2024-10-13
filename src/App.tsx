import React, { useState, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';

function App() {
  const [username, setUsername] = useState('');
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('App component mounted');
  }, []);

  const checkTrust = async () => {
    if (!username) {
      setError('ユーザー名を入力してください。');
      return;
    }

    setLoading(true);
    setError('');
    setTrustScore(null);

    try {
      console.log('Fetching trust score for:', username);
      const response = await fetch(`https://api.dify.ai/v1/check-trust?username=${encodeURIComponent(username)}`);
      if (!response.ok) {
        throw new Error('APIリクエストに失敗しました。');
      }
      const data = await response.json();
      console.log('Received trust score:', data.trustScore);
      setTrustScore(data.trustScore);
    } catch (err) {
      console.error('Error fetching trust score:', err);
      setError('信頼性の確認中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Kenny AI</h1>
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
            />
            <button
              onClick={checkTrust}
              disabled={loading}
              className="absolute right-2 top-2 bg-blue-500 text-white p-1 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
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