require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cache = require('./src/services/cache');

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
    origin: [
        'chrome-extension://*',  // allow chrome extensions
        'https://leetcode.com',  // allow leetcode
        'http://localhost:3000'  // allow local development
    ],
    methods: ['GET', 'POST'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.json({ 
        status: 'Server is running',
        message: 'Welcome to Algo! Backend API',
        endpoints: {
            hints: '/api/hints (POST)'
        }
    });
});

app.post('/api/hints', async (req, res) => {
    if (!req.body?.message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        console.log('Received request:', {
            message: req.body.message,
            hasProblemInfo: !!req.body.problemInfo,
            problemTitle: req.body.problemInfo?.title
        });

        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }

        const problemId = req.body.problemInfo?.id || 'default';
        const cachedHint = await cache.getCachedHint(problemId);
        
        if (cachedHint) {
            console.log('Returning cached hint');
            return res.json({ hint: cachedHint });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            You are a friendly and insightful LeetCode tutor chatting with a student. Respond conversationally and helpfully, with a clear but subtle nudge toward the next step.

            Context:
            - Problem: ${req.body.problemInfo?.title || 'Unknown'}
            - Current Code: ${req.body.problemInfo?.code || 'Not provided'}
            - Question: ${req.body.message}

            Guidelines:
            1. Respond like you're tutoring a peer — casual but clear.
            2. Limit your reply to 1–3 concise sentences.
            3. Focus on ONE actionable next step or core insight.
            4. If code is provided, highlight ONE specific line or logic choice to revisit.
            5. If no code is provided, suggest ONE natural starting point.
            6. Avoid giving full solutions or final answers.
            7. When prompted for hints, dont provide the specific code fixes, ask a question that will help the user think about the problem.
            8. Use tone and intent that fits the question:
               - For any question: Be helpful but concise
               - For code reviews: Point out ONE specific improvement
               - For concept questions: Give ONE key insight
               - For debugging: Identify ONE likely issue
               - For optimization: Suggest ONE efficiency improvement
               - For general questions: Provide ONE clear direction
               - For user asking how or I dont know to the question provided by the hint: Provide the answer to the respective hint
            9. Don't re-explain the problem; assume they already understand it.

            Example responses:
            - "You're close — try sorting the list first to make the logic easier."
            - "That \`if\` condition might be skipping edge cases. Try printing it for a failing input."
            - "Think about how you'd count unique characters without scanning the whole string again."
            - "The time complexity can be improved by using a hash map instead of nested loops."
            - "Try breaking down the problem into smaller subproblems first."
            - "Consider using a two-pointer approach for this array problem."
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const hint = response.text().trim();
        
        await cache.cacheHint(problemId, hint);
        
        console.log('Generated and cached response successfully');
        res.json({ hint });
    } catch (error) {
        console.error('Error generating hint:', error);
        res.status(500).json({ 
            error: 'Failed to generate hint',
            details: error.message 
        });
    }
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: err.message 
    });
});

// only start if run directly
if (require.main === module) {
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log('Environment:', {
            NODE_ENV: process.env.NODE_ENV,
            hasGeminiKey: !!process.env.GEMINI_API_KEY,
            hasRedis: !!process.env.REDIS_HOST
        });
    });

    // graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
    });
}

module.exports = app; 