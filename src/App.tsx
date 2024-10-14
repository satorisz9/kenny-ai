import { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface DifyResponse {
  answer: string;
  totalTokens: number;
  totalPrice: string;
}

const App: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [response, setResponse] = useState<DifyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const isValidUsername = (username: string): boolean => /^@(\w){1,15}$/.test(username);

  const checkTrust = async () => {
    if (!isValidUsername(username.trim())) {
      setError('有効なユーザー名を入力してください（@から始まる1～15文字）。');
      setResponse(null);
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const response = await axios.post<DifyResponse>(
        `${import.meta.env.VITE_BACKEND_URL}/check-trust`,
        { username },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // タイムアウトを60秒に設定
        }
      );

      setResponse(response.data);
    } catch (err: any) {
      console.error('Error fetching trust score:', err);
      if (err.response) {
        setError(`エラー: ${err.response.status} - ${err.response.data.error || 'サーバーエラーが発生しました。'}`);
      } else if (err.request) {
        setError('サーバーからの応答がありませんでした。ネットワーク接続を確認してください。');
      } else {
        setError(`リクエスト設定エラー: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      checkTrust();
    }
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

        {response && (
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">分析結果</h2>
            <p className="text-lg text-gray-700 mb-4">{response.answer}</p>
            <div className="text-sm text-gray-500">
              <p>使用トークン数: {response.totalTokens}</p>
              <p>総コスト: ${response.totalPrice} USD</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;