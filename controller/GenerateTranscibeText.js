require('dotenv').config();
const speech = require('@google-cloud/speech');
const { Storage } = require('@google-cloud/storage');


const client = new speech.SpeechClient();
const storage = new Storage();
const bucketName = process.env.BUCKET_NAME;
const bucket = storage.bucket(bucketName);



const generateTranscribeText = (req, res) => {
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
}

exports.GenerateTranscribeText = generateTranscribeText;