const express = require('express');
const multer = require('multer');
const speech = require('@google-cloud/speech');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');
require('dotenv').config();
const app = express();
const client = new speech.SpeechClient();
const storage = new Storage();
const bucketName = process.env.BUCKET_NAME; // Replace with your bucket name
const bucket = storage.bucket(bucketName);
// process.env.GOOGLE_APPLICATION_CREDENTIALS = './auth.json';
const multerStorage = multer.memoryStorage();
const upload = multer({
    storage: multerStorage
});
app.use(cors());


    app.use(express.json());
const OpenAI= require("openai").OpenAI;
const OPENAI_API_KEY = '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'; 
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
//   const openai = new OpenAIApi(configuration);

app.post('/api/keyPoints', async (req, res) => {
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
                    role:'user',
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
  });

















app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).send('No audio file uploaded');
            return;
        }

        const audioFile = bucket.file(req.file.originalname);
        const writeStream = audioFile.createWriteStream({
            resumable: false,
            metadata: {
                contentType: req.file.mimetype
            }
        });

        writeStream.on('error', (err) => {
            console.error('Error uploading audio file to GCS:', err);
            res.status(500).send('Error uploading audio file');
        });

        writeStream.on('finish', async () => {
            try {
                const gcsUri = `gs://${bucketName}/${req.file.originalname}`;
                const audio = {
                    uri: gcsUri
                };

                let encoding;
                switch (req.file.mimetype) {
                    case 'audio/mpeg':
                        encoding = 'MP3';
                        break;
                    case 'audio/wav':
                        encoding = 'LINEAR16';
                        break;
                    case 'audio/ogg':
                        encoding = 'OGG_OPUS';
                        break;
                    default:
                        encoding = 'ENCODING_UNSPECIFIED'; // Default encoding
                        break;
                } 

                const config = {
                    encoding: encoding,
                    sampleRateHertz: 44100,
                    languageCode: 'en-US',
                    audioChannelCount: 2
                };

                const request = {
                    audio: audio,
                    config: config,
                };
                const [operation] = await client.longRunningRecognize(request);
                const [response] = await operation.promise();

                const transcription = response.results
                    .map(result => result.alternatives[0].transcript)
                    .join('\n');

                res.send({transcription});
            } catch (err) {
                console.error('Error transcribing audio:', err);
                res.status(500).send('Transcription failed');
            }
        });

        writeStream.end(req.file.buffer);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Server error');
    }
});









app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
