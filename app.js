const express = require('express');
const cors = require('cors');
require('dotenv').config();
const routes = require('./routes/api');
const port = process.env.PORT;

const app = express();


// MIDDLEWARE
app.use(cors());
app.use(express.json());


// ROUTES
app.use('/api', routes);



app.listen(port, () => {
    console.log('Server is running on port', port);
});