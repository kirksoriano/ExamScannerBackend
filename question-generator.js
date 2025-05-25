require('dotenv').config(); // Load env variables

const axios = require('axios');

const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;

const generateQuestion = async (competencyText) => {
  try {
    const prompt = `Gumawa ng isang tanong na multiple choice batay sa sumusunod na paksa: "${competencyText}". Isama ang tanong, 4 na pagpipilian, at ang tamang sagot.`;

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct',
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json'

        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error generating question:', error.response?.data || error.message);
    return null;
  }
};

module.exports = generateQuestion;
