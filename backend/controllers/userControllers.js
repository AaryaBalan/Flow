const sqlite3 = require("sqlite3").verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/database.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Create Users table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    designation TEXT,
    company TEXT,
    location TEXT,
    phone TEXT,
    about TEXT,
    skills TEXT,
    experience TEXT,
    github TEXT,
    linkedin TEXT,
    setupCompleted INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

module.exports.createUser = (req, res) => {
    console.log('Request body:', req.body);
    const { name, email, password } = req.body;
    db.run(`INSERT INTO Users (name, email, password) VALUES (?, ?, ?)`,
        [name, email, password], function (err) {
            if (err) {
                console.error('Error inserting user', err);
                res.status(500).send({ message: 'Error creating user', status: 'error' });
            } else {
                res.status(201).send({ message: 'User created successfully', userId: this.lastID, status: 'success' });
            }
        });
};

module.exports.getUserByEmail = (req, res) => {
    const { email } = req.params;
    console.log(`Fetching user with email: ${email}`);
    db.get(
        `SELECT * FROM Users WHERE email = ?`,
        [email],
        (err, row) => {
            if (err) {
                console.error("Error fetching user by email:", err);
                res.status(500).send("Error fetching user");
            } else {
                if (!row) {
                    return res.status(200).send({ exist: false });
                }
                res.status(200).send({ user: row, exist: true });
            }
        }
    );
}

module.exports.updateSetup = (req, res) => {
    const {
        designation,
        company,
        location,
        phone,
        about,
        skills,
        experience,
        github,
        linkedin
    } = req.body;
    const userId = req.body.userId;
    db.run(`UPDATE Users SET designation = ?, company = ?, location = ?, phone = ?, about = ?, skills = ?, experience = ?, github = ?, linkedin = ?, setupCompleted = 1 WHERE id = ?`,
        [designation, company, location, phone, about, skills, experience, github, linkedin, userId],
        function (err) {
            if (err) {
                console.error('Error updating user setup', err);
                res.status(500).send({ message: 'Error updating setup', status: 'error' });
            } else {
                res.status(200).send({ message: 'Setup updated successfully', status: 'success' });
            }
        });
}

module.exports.updateProfile = (req, res) => {
    const { id } = req.params;
    const {
        name,
        email,
        designation,
        company,
        location,
        phone,
        about,
        skills,
        experience,
        github,
        linkedin
    } = req.body;

    console.log(`Updating profile for user ID: ${id}`);

    db.run(
        `UPDATE Users SET 
            name = ?, 
            email = ?, 
            designation = ?, 
            company = ?, 
            location = ?, 
            phone = ?, 
            about = ?, 
            skills = ?, 
            experience = ?, 
            github = ?, 
            linkedin = ? 
        WHERE id = ?`,
        [name, email, designation, company, location, phone, about, skills, experience, github, linkedin, id],
        function (err) {
            if (err) {
                console.error('Error updating user profile:', err);
                res.status(500).send({
                    success: false,
                    message: 'Error updating profile'
                });
            } else {
                if (this.changes === 0) {
                    res.status(404).send({
                        success: false,
                        message: 'User not found'
                    });
                } else {
                    // Fetch updated user data
                    db.get('SELECT * FROM Users WHERE id = ?', [id], (err, row) => {
                        if (err) {
                            res.status(500).send({
                                success: false,
                                message: 'Error fetching updated profile'
                            });
                        } else {
                            res.status(200).send({
                                success: true,
                                message: 'Profile updated successfully',
                                user: row
                            });
                        }
                    });
                }
            }
        }
    );
}

module.exports.getUserById = (req, res) => {
    const { id } = req.params;
    console.log(`Fetching user with ID: ${id}`);

    db.get(
        `SELECT id, name, email, designation, company, location, phone, about, skills, experience, github, linkedin, createdAt FROM Users WHERE id = ?`,
        [id],
        (err, row) => {
            if (err) {
                console.error("Error fetching user by ID:", err);
                res.status(500).send({
                    success: false,
                    message: 'Error fetching user'
                });
            } else {
                if (!row) {
                    return res.status(404).send({
                        success: false,
                        message: 'User not found'
                    });
                }
                res.status(200).send({
                    success: true,
                    user: row
                });
            }
        }
    );
}