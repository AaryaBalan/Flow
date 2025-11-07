const db = require('../database/initDb');

// Generate a unique 6-digit join code
function generateJoinCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create a new project
exports.createProject = (req, res) => {
    const { title, description, authorId, authorName } = req.body;

    if (!title || !description || !authorId || !authorName) {
        return res.status(400).json({
            success: false,
            message: 'Title, description, authorId, and authorName are required'
        });
    }

    // Generate unique join code
    const joinCode = generateJoinCode();

    const query = `
        INSERT INTO Projects (title, description, authorId, authorName, joinCode, status, progress)
        VALUES (?, ?, ?, ?, ?, 'Active', 0)
    `;

    db.run(query, [title, description, authorId, authorName, joinCode], function (err) {
        if (err) {
            console.error('Error creating project:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Error creating project',
                error: err.message
            });
        }

        const projectId = this.lastID;

        // Add the creator as a member of the project
        const memberQuery = `INSERT INTO ProjectMembers (projectId, userId) VALUES (?, ?)`;

        db.run(memberQuery, [projectId, authorId], (memberErr) => {
            if (memberErr) {
                console.error('Error adding project creator as member:', memberErr.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error adding creator as member',
                    error: memberErr.message
                });
            }

            // Fetch the created project with member count
            const fetchQuery = `
                SELECT p.*, COUNT(pm.userId) as peopleJoined
                FROM Projects p
                LEFT JOIN ProjectMembers pm ON p.id = pm.projectId
                WHERE p.id = ?
                GROUP BY p.id
            `;

            db.get(fetchQuery, [projectId], (fetchErr, project) => {
                if (fetchErr) {
                    console.error('Error fetching created project:', fetchErr.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Project created but error fetching details'
                    });
                }

                res.status(201).json({
                    success: true,
                    message: 'Project created successfully',
                    project: project
                });
            });
        });
    });
};

// Join a project using join code
exports.joinProject = (req, res) => {
    const { joinCode, userId } = req.body;

    if (!joinCode || !userId) {
        return res.status(400).json({
            success: false,
            message: 'Join code and user ID are required'
        });
    }

    // Find project by join code (case-insensitive)
    const findProjectQuery = `SELECT * FROM Projects WHERE LOWER(joinCode) = LOWER(?)`;

    db.get(findProjectQuery, [joinCode], (err, project) => {
        if (err) {
            console.error('Error finding project:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Error finding project',
                error: err.message
            });
        }

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Invalid join code. Please check and try again.'
            });
        }

        // Check if user is the project owner
        if (project.authorId === userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot join your own project'
            });
        }

        // Check if user is already a member
        const checkMemberQuery = `SELECT * FROM ProjectMembers WHERE projectId = ? AND userId = ?`;

        db.get(checkMemberQuery, [project.id, userId], (checkErr, existingMember) => {
            if (checkErr) {
                console.error('Error checking membership:', checkErr.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error checking membership',
                    error: checkErr.message
                });
            }

            if (existingMember) {
                return res.status(400).json({
                    success: false,
                    message: 'You are already a member of this project'
                });
            }

            // Add user to project
            const addMemberQuery = `INSERT INTO ProjectMembers (projectId, userId) VALUES (?, ?)`;

            db.run(addMemberQuery, [project.id, userId], (addErr) => {
                if (addErr) {
                    console.error('Error joining project:', addErr.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Error joining project',
                        error: addErr.message
                    });
                }

                // Fetch updated project with member count
                const fetchQuery = `
                    SELECT p.*, COUNT(pm.userId) as peopleJoined
                    FROM Projects p
                    LEFT JOIN ProjectMembers pm ON p.id = pm.projectId
                    WHERE p.id = ?
                    GROUP BY p.id
                `;

                db.get(fetchQuery, [project.id], (fetchErr, updatedProject) => {
                    if (fetchErr) {
                        console.error('Error fetching project:', fetchErr.message);
                        return res.status(500).json({
                            success: false,
                            message: 'Joined but error fetching project details'
                        });
                    }

                    res.status(200).json({
                        success: true,
                        message: `Successfully joined "${project.title}"!`,
                        project: updatedProject
                    });
                });
            });
        });
    });
};

// Get all projects for a specific user
exports.getUserProjects = (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID is required'
        });
    }

    const query = `
        SELECT p.*, COUNT(pm2.userId) as peopleJoined
        FROM Projects p
        INNER JOIN ProjectMembers pm ON p.id = pm.projectId
        LEFT JOIN ProjectMembers pm2 ON p.id = pm2.projectId
        WHERE pm.userId = ?
        GROUP BY p.id
        ORDER BY p.createdAt DESC
    `;

    db.all(query, [userId], (err, projects) => {
        if (err) {
            console.error('Error fetching user projects:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Error fetching projects',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            projects: projects || []
        });
    });
};

// Get project by ID with member check
exports.getProjectById = (req, res) => {
    const { projectId } = req.params;
    const { userId } = req.query;

    if (!projectId) {
        return res.status(400).json({
            success: false,
            message: 'Project ID is required'
        });
    }

    const query = `
        SELECT p.*, COUNT(pm.userId) as peopleJoined
        FROM Projects p
        LEFT JOIN ProjectMembers pm ON p.id = pm.projectId
        WHERE p.id = ?
        GROUP BY p.id
    `;

    db.get(query, [projectId], (err, project) => {
        if (err) {
            console.error('Error fetching project:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Error fetching project',
                error: err.message
            });
        }

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if user is a member (if userId provided)
        if (userId) {
            const memberQuery = `SELECT * FROM ProjectMembers WHERE projectId = ? AND userId = ?`;

            db.get(memberQuery, [projectId, userId], (memberErr, member) => {
                if (memberErr) {
                    console.error('Error checking membership:', memberErr.message);
                }

                project.isMember = !!member;
                project.isAuthor = project.authorId == userId;

                res.status(200).json({
                    success: true,
                    project: project
                });
            });
        } else {
            res.status(200).json({
                success: true,
                project: project
            });
        }
    });
};

// Get all members of a project
exports.getProjectMembers = (req, res) => {
    const { projectId } = req.params;

    if (!projectId) {
        return res.status(400).json({
            success: false,
            message: 'Project ID is required'
        });
    }

    const query = `
        SELECT 
            u.id,
            u.name,
            u.email,
            u.designation,
            u.company,
            u.location,
            pm.joinedAt,
            p.authorId,
            CASE WHEN p.authorId = u.id THEN 1 ELSE 0 END as isOwner
        FROM ProjectMembers pm
        INNER JOIN Users u ON pm.userId = u.id
        INNER JOIN Projects p ON pm.projectId = p.id
        WHERE pm.projectId = ?
        ORDER BY isOwner DESC, pm.joinedAt ASC
    `;

    db.all(query, [projectId], (err, members) => {
        if (err) {
            console.error('Error fetching project members:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Error fetching project members',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            members: members || []
        });
    });
};
