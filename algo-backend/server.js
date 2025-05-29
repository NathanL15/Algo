require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Add a GET route for the root path
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
    try {
        const { message, problemInfo } = req.body;
        
        // Log incoming request data
        console.log('Received request:', {
            message,
            problemTitle: problemInfo?.title,
            hasDescription: !!problemInfo?.description,
            hasCode: !!problemInfo?.code
        });

        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }

        // Get the Gemini model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Create the prompt
        const prompt = `
            You are an AI tutor helping with a LeetCode problem.
            Problem Title: ${problemInfo.title}
            Problem Description: ${problemInfo.description}
            User's Current Code: ${problemInfo.code}
            User's Question: ${message}

            Provide ONE helpful hint that guides the user without giving away the solution.
            Focus on the next logical step they should consider.
            Never provide complete code solutions.
            Keep your response concise and educational.
        `;

        // Generate response
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const hint = response.text();

        console.log('Generated hint successfully');
        res.json({ hint });
    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ 
            error: 'Failed to generate hint',
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Gemini API Key present:', !!process.env.GEMINI_API_KEY);
}); 