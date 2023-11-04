require('dotenv').config();
const OpenAI= require("openai").OpenAI;


const OPENAI_API_KEY = process.env.OPENAI_API_KEY; 
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

const generateKeyPointers = async (req, res) => {
    const inputText = req.body.text || '';
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a kind and friendly chatbot.'
                },
                {
                    role: 'user',
                    content: `Extract key points from the following text:\n"${inputText}"\n\nKey points:`
                }
            ]
        });
        const completion = response.choices[0].message.content;
        return res.status(200).json({
            success: true,
            message: completion,
        })
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate key points' });
    }
}


exports.GenerateKeyPointers = generateKeyPointers;