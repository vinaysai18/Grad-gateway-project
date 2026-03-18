const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/UI.html'));
});

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    },
    connectTimeout: 10000
});

// Initialize Database Tables
async function initDb() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL database.');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('student', 'employee') NOT NULL,
                fullname VARCHAR(255),
                studentId VARCHAR(255)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS jobs (
                id VARCHAR(255) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                company VARCHAR(255) NOT NULL,
                location VARCHAR(255) NOT NULL,
                package VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                postedDate VARCHAR(255) NOT NULL
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id VARCHAR(255) PRIMARY KEY,
                fullName VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(255) NOT NULL,
                gradYear VARCHAR(255) NOT NULL,
                jobId VARCHAR(255) NOT NULL,
                jobTitle VARCHAR(255) NOT NULL,
                company VARCHAR(255) NOT NULL,
                appliedDate VARCHAR(255) NOT NULL,
                status VARCHAR(255) DEFAULT 'New',
                resumePath VARCHAR(255),
                resumeFilename VARCHAR(255),
                education_university VARCHAR(255),
                education_degree VARCHAR(255),
                education_gpa VARCHAR(50),
                skills TEXT
            )
        `);

        connection.release();
        console.log('Database tables initialized.');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}
initDb();

// Helper function to extract info from PDF text
function analyzeResume(text) {
    if (!text || typeof text !== 'string') {
        return {
            education: { university: 'GradGateway University', degree: 'B.Tech CSE', gpa: '8.5' },
            skills: ['Web Development', 'Problem Solving']
        };
    }

    let education = { university: 'Not Specified', degree: 'B.Tech / Degree', gpa: 'N/A' };
    let skills = [];

    const skillKeywords = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'HTML', 'CSS', 'SQL', 'C++', 'Git', 'Docker', 'AWS', 'MongoDB', 'Express', 'C', 'PHP', 'GitHub', 'Linux', 'Ubuntu'];
    skillKeywords.forEach(skill => {
        if (text.toLowerCase().includes(skill.toLowerCase())) {
            skills.push(skill);
        }
    });

    const lines = text.split('\n');
    for (let line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('university') || lowerLine.includes('institute') || lowerLine.includes('college')) {
            if (education.university === 'Not Specified') {
                education.university = line.trim();
            }
        }
        if (lowerLine.includes('cgpa') || lowerLine.includes('gpa')) {
            const matches = line.match(/(\d+\.\d+)/);
            if (matches) {
                education.gpa = matches[1];
            }
        }
    }

    if (skills.length === 0) skills = ['General Software Development'];

    return { education, skills };
}

// Auth Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, role, fullname, studentId } = req.body;
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        await pool.query(
            'INSERT INTO users (username, email, password, role, fullname, studentId) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, password, role, fullname || null, studentId || null]
        );

        console.log('User registered:', email);
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND password = ? AND role = ?',
            [email, password, role]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        res.status(200).json({
            message: 'Login successful',
            username: user.username,
            fullname: user.fullname,
            studentId: user.studentId
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Job Routes
app.get('/api/jobs', async (req, res) => {
    try {
        const [jobs] = await pool.query('SELECT * FROM jobs');
        res.json(jobs);
    } catch (error) {
        console.error('Fetch jobs error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/jobs', async (req, res) => {
    try {
        const { title, company, location, package, description } = req.body;
        const id = 'job_' + Date.now();
        const postedDate = new Date().toLocaleDateString();

        await pool.query(
            'INSERT INTO jobs (id, title, company, location, package, description, postedDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, title, company, location, package, description, postedDate]
        );

        const newJob = { id, title, company, location, package, description, postedDate };
        console.log('Job posted:', newJob);
        res.status(201).json(newJob);
    } catch (error) {
        console.error('Post job error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Application Routes
app.get('/api/applications', async (req, res) => {
    try {
        const [applications] = await pool.query('SELECT * FROM applications');

        // Parse skills back into array since it's stored as TEXT in DB
        const parsedApps = applications.map(app => ({
            ...app,
            education: {
                university: app.education_university,
                degree: app.education_degree,
                gpa: app.education_gpa
            },
            skills: app.skills ? JSON.parse(app.skills) : []
        }));

        res.json(parsedApps);
    } catch (error) {
        console.error('Fetch applications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/applications', upload.single('resume'), async (req, res) => {
    try {
        let extractedDetails = {
            education: { university: 'Not Specified', degree: 'Not Specified', gpa: 'N/A' },
            skills: ['General']
        };

        if (req.file) {
            try {
                const filePath = path.resolve(req.file.path);
                const parser = new PDFParse({ url: 'file://' + filePath });
                const data = await parser.getText();
                extractedDetails = analyzeResume(data.text);
            } catch (pdfError) {
                console.error('Error parsing PDF:', pdfError);
            }
        }

        const id = 'app_' + Date.now();
        const appliedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const resumePath = req.file ? req.file.path : null;
        const resumeFilename = req.file ? req.file.originalname : 'Resume.pdf';

        const { fullName, email, phone, gradYear, jobId, jobTitle, company } = req.body;

        await pool.query(
            `INSERT INTO applications 
            (id, fullName, email, phone, gradYear, jobId, jobTitle, company, appliedDate, status, resumePath, resumeFilename, education_university, education_degree, education_gpa, skills) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, fullName, email, phone, gradYear, jobId, jobTitle, company, appliedDate, 'New',
                resumePath, resumeFilename,
                extractedDetails.education.university, extractedDetails.education.degree, extractedDetails.education.gpa,
                JSON.stringify(extractedDetails.skills)
            ]
        );

        const application = {
            id, fullName, email, phone, gradYear, jobId, jobTitle, company, appliedDate, status: 'New',
            resumePath, resumeFilename, education: extractedDetails.education, skills: extractedDetails.skills
        };

        console.log('Application submitted successfully:', id);
        res.status(201).json(application);
    } catch (error) {
        console.error('CRITICAL: Error processing application:', error);
        res.status(500).json({ message: 'Error processing application', error: error.message });
    }
});

app.put('/api/applications/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const [result] = await pool.query('UPDATE applications SET status = ? WHERE id = ?', [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Application not found' });
        }

        console.log(`Application ${id} status updated to: ${status}`);

        // Return updated app (we fetch it to return the exact structure if needed, or just send a success message)
        const [updatedApp] = await pool.query('SELECT * FROM applications WHERE id = ?', [id]);

        res.json(updatedApp[0]);
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/download/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [apps] = await pool.query('SELECT resumePath, resumeFilename FROM applications WHERE id = ?', [id]);

        if (apps.length === 0 || !apps[0].resumePath) {
            return res.status(404).send('File not found');
        }

        const absolutePath = path.resolve(apps[0].resumePath);
        res.download(absolutePath, apps[0].resumeFilename);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).send('Internal server error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
