const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

// Load environment variables from .env file
dotenv.config();

const port = 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.use('/api/users', userRoutes);


// Sample route
app.get('/', (req, res) => {
    res.send('Hello World!');
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});