require('dotenv').config();
const axios = require('axios');

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not set in .env');
    process.exit(1);
  }
  try {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say hello!' },
        ],
        max_tokens: 10,
        temperature: 0,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('OpenAI API success! Response:');
    console.log(res.data.choices[0].message.content);
  } catch (err) {
    if (err.response) {
      console.error('OpenAI API error:', err.response.data);
    } else {
      console.error('Request error:', err.message);
    }
    process.exit(2);
  }
}

testOpenAI();
