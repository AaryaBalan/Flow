const express = require('express');
const router = express.Router();
const { createUser, getUserByEmail, updateSetup, updateProfile, getUserById } = require('../controllers/userControllers');

// Route to create a new user
router.post('/create', createUser);
router.get('/email/:email', getUserByEmail);
router.get('/:id', getUserById);
router.post('/updateSetup', updateSetup);
router.put('/profile/:id', updateProfile);

module.exports = router;