const express = require('express');
const router = express.Router();
const projectControllers = require('../controllers/projectControllers');

// Create a new project
router.post('/create', projectControllers.createProject);

// Join a project using join code
router.post('/join', projectControllers.joinProject);

// Get all projects for a user
router.get('/user/:userId', projectControllers.getUserProjects);

// Get project members
router.get('/:projectId/members', projectControllers.getProjectMembers);

// Get project by ID
router.get('/:projectId', projectControllers.getProjectById);

module.exports = router;
