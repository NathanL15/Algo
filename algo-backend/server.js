require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS for production
const corsOptions = {
    origin: [
        'chrome-extension://*',  // Allow Chrome extensions
        'https://leetcode.com',  // Allow LeetCode
        'http://localhost:3000'  // Allow local development
    ],
    methods: ['GET', 'POST'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'Server is running',
        message: 'Welcome to Algo! Backend API',
        endpoints: {
            hints: '/api/hints (POST)'
        }
    });
});

// Main endpoint for hints
app.post('/api/hints', async (req, res) => {
    try {
        console.log('Received request:', {
            message: req.body.message,
            hasProblemInfo: !!req.body.problemInfo,
            problemTitle: req.body.problemInfo?.title
        });

        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
            You are an AI assistant helping with LeetCode problems.
            Problem: ${req.body.problemInfo?.title || 'Unknown'}
            Description: ${req.body.problemInfo?.description || 'Not provided'}
            User's question: ${req.body.message}
            
            Please provide a helpful hint or explanation that guides the user without giving away the complete solution.
            Focus on understanding the problem and suggesting approaches.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const hint = response.text();

        console.log('Generated hint successfully');
        res.json({ hint });
    } catch (error) {
        console.error('Error generating hint:', error);
        res.status(500).json({ 
            error: 'Failed to generate hint',
            details: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: err.message 
    });
});

// Only start the server if this file is run directly
if (require.main === module) {
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log('Environment:', {
            NODE_ENV: process.env.NODE_ENV,
            hasGeminiKey: !!process.env.GEMINI_API_KEY
        });
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
    });
}

module.exports = app; 