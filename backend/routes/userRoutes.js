const express = require('express');
const router = express.Router();
const { createUser, getUserByEmail, updateSetup, updateProfile } = require('../controllers/userControllers');

// Route to create a new user
router.post('/create', createUser);
router.get('/email/:email', getUserByEmail);
router.post('/updateSetup', updateSetup);
router.put('/profile/:id', updateProfile);

module.exports = router;