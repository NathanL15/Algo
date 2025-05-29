require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/hints', async (req, res) => {
    try {
        const { message, problemInfo } = req.body;
        
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

        res.json({ hint });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate hint' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 