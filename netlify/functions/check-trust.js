const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { username } = event.queryStringParameters;

  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'ユーザー名が必要です。' })
    };
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
    return {
      statusCode: 200,
      body: JSON.stringify({ trustScore: data.trustScore })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '信頼性の確認中にエラーが発生しました。' })
    };
  }
};