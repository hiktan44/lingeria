const axios = require('axios');
const KIE_KEY = process.env.KIE_API_KEY;

async function testGemini() {
  try {
    const res = await axios.post('https://api.kie.ai/v1/chat/completions', {
      model: 'gemini-2.5-pro',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is this short word?' },
            { type: 'image_url', image_url: { url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png' } }
          ]
        }
      ]
    }, {
      headers: { Authorization: `Bearer ${KIE_KEY}`, 'Content-Type': 'application/json' }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.log('Error:', e?.response?.data || e.message);
  }
}
testGemini();
