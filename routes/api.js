const express = require('express');
const router = express.Router();
const multer = require('multer');

const multerStorage = multer.memoryStorage();
const upload = multer({
    storage: multerStorage
});

const {GenerateTranscribeText} = require('../controller/GenerateTranscibeText');
const {GenerateKeyPointers} = require('../controller/GenerateKeyPointers');

// TRANSCRIBE ROUTE
router.post('/transcribe', upload.single('audio'), GenerateTranscribeText);



// KEY POINTERS ROUTE
router.post('/keyPoints', GenerateKeyPointers);


module.exports = router;