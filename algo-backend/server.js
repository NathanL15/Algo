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
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            You are a stepwise LeetCode tutor. Provide a single, focused hint in 1-3 sentences.

            Context:
            Problem: ${req.body.problemInfo?.title || 'Unknown'}
            Current Code: ${req.body.problemInfo?.code || 'Not provided'}
            Question: ${req.body.message}

            Rules:
            1. Output exactly 1-3 sentences, no more
            2. Focus on ONE immediate next step
            3. If code exists, point out ONE specific issue or improvement
            4. If no code, suggest ONE first step
            5. Never reveal the complete solution
            6. Format response as a single paragraph
            7. Start with "Hint:" followed by your response
            8. Be direct and actionable
            9. Don't explain the problem, only guide the next step

            Example format:
            Hint: Consider using a hash map to store the frequency of each element. This will help you find duplicates in O(n) time.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const hint = response.text().trim();

        // Ensure proper formatting
        const formattedHint = hint.startsWith('Hint:') ? hint : `Hint: ${hint}`;
        
        console.log('Generated hint successfully');
        res.json({ hint: formattedHint });
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