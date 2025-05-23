// question-generator.js
const axios = require('axios');

// Replace with your actual Hugging Face token (keep secret!)
const HUGGING_FACE_TOKEN = 'hf_xxx'; // put your real token here

const generateQuestion = async (competencyText) => {
  try {
    const prompt = `Gumawa ng isang tanong na multiple choice batay sa sumusunod na paksa: "${competencyText}". Isama ang tanong, 4 na pagpipilian, at ang tamang sagot.`;

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/google/mt5-small',
      {
        inputs: prompt,
      },
      {
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error generating question:', error.response?.data || error.message);
    return null;
  }
};

// Example usage
generateQuestion('Paggamit ng wastong pang-ukol sa pangungusap').then((output) => {
  console.log('Generated:', output);
});

module.exports = generateQuestion;
