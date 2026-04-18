require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cache = require('./src/services/cache');
const vectorStore = require('./src/services/vectorStore');

const app = express();
const port = process.env.PORT || 3000;
const TOP_K = Number(process.env.RAG_TOP_K || 3);
const EMBEDDING_MODEL = 'gemini-embedding-001';
const GENERATION_MODEL = 'gemini-2.5-flash';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const pendingHintRequests = new Map();

const corsOptions = {
    origin: [
        'chrome-extension://*',
        'https://leetcode.com',
        'http://localhost:3000'
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

function hashText(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function normalizeProblemId(problemInfo = {}) {
    if (problemInfo.id) {
        return String(problemInfo.id);
    }

    if (problemInfo.url) {
        const urlPart = String(problemInfo.url).split('/problems/')[1];
        if (urlPart) {
            return urlPart.split('/')[0];
        }
    }

    if (problemInfo.title) {
        return String(problemInfo.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    return `problem-${Date.now()}`;
}

function buildProblemDocument(problemInfo = {}) {
    const safeTags = Array.isArray(problemInfo.tags) ? problemInfo.tags.join(', ') : '';
    return [
        `Title: ${problemInfo.title || ''}`,
        `Description: ${problemInfo.description || ''}`,
        `Difficulty: ${problemInfo.difficulty || ''}`,
        `Language: ${problemInfo.language || ''}`,
        `Tags: ${safeTags}`,
        `Code: ${problemInfo.code || ''}`
    ].join('\n');
}

function ensureGeminiConfigured() {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
}

function buildCacheKey(problemInfo, message) {
    return `${normalizeProblemId(problemInfo)}:${hashText(message)}`;
}

async function getEmbedding(text) {
    const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await embeddingModel.embedContent(text);
    const values = result?.embedding?.values || result?.embedding || result?.embeddings?.[0]?.values;

    if (!Array.isArray(values) || values.length === 0) {
        throw new Error('Failed to compute embedding vector');
    }

    return values;
}

function formatSimilarContext(similarProblems) {
    if (!Array.isArray(similarProblems) || similarProblems.length === 0) {
        return 'No similar indexed problems found yet.';
    }

    return similarProblems
        .map((item, index) => {
            const difficulty = item.difficulty || 'Unknown';
            const tags = item.tags || 'None';
            const description = item.description || '';
            const shortDescription = description.length > 300 ? `${description.slice(0, 300)}...` : description;
            return `${index + 1}. ${item.title || item.problemId} | difficulty: ${difficulty} | tags: ${tags}\n${shortDescription}`;
        })
        .join('\n\n');
}

function buildHintPrompt(problemInfo, message, similarContext) {
    return [
        'You are a concise LeetCode tutor.',
        'Reply in 1-3 sentences.',
        'Give one actionable next step or insight.',
        'Do not provide the full solution.',
        'If code is present, point to one part to revisit.',
        'If the student asks about a previous hint, answer that question directly.',
        '',
        `Problem: ${problemInfo.title || 'Unknown'}`,
        `Current code: ${problemInfo.code || 'Not provided'}`,
        `Question: ${message}`,
        `Top-${TOP_K} similar problems:`,
        similarContext
    ].join('\n');
}

function getRetryAfter(error) {
    return error?.errorDetails
        ?.find?.((detail) => detail?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo')
        ?.retryDelay;
}

app.get('/', (req, res) => {
    res.json({ 
        status: 'Server is running',
        message: 'Welcome to Algo! Backend API',
        endpoints: {
            healthz: '/healthz (GET)',
            readyz: '/readyz (GET)',
            hints: '/api/hints (POST)',
            index: '/api/index-problem (POST)',
            search: '/api/rag/search (POST)'
        }
    });
});

app.get('/healthz', async (req, res) => {
    try {
        const pong = await cache.redis.ping();
        res.status(200).json({ status: 'ok', redis: pong, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ status: 'error', details: error.message });
    }
});

app.get('/readyz', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ status: 'not-ready', reason: 'GEMINI_API_KEY is missing' });
    }

    try {
        await cache.redis.ping();
        res.status(200).json({ status: 'ready' });
    } catch (error) {
        res.status(503).json({ status: 'not-ready', reason: error.message });
    }
});

app.post('/api/index-problem', async (req, res) => {
    if (!req.body?.problemInfo) {
        return res.status(400).json({ error: 'problemInfo is required' });
    }

    try {
        ensureGeminiConfigured();

        await vectorStore.ensureIndex();
        const problemInfo = req.body.problemInfo;
        const problemId = normalizeProblemId(problemInfo);
        const document = buildProblemDocument(problemInfo);
        const embedding = await getEmbedding(document);

        await vectorStore.upsertProblem({
            problemId,
            title: problemInfo.title || '',
            description: problemInfo.description || '',
            difficulty: problemInfo.difficulty || '',
            tags: Array.isArray(problemInfo.tags) ? problemInfo.tags.join(', ') : '',
            embedding
        });

        res.status(200).json({ status: 'indexed', problemId });
    } catch (error) {
        console.error('Error indexing problem:', error);
        res.status(500).json({ error: 'Failed to index problem', details: error.message });
    }
});

app.post('/api/rag/search', async (req, res) => {
    if (!req.body?.query) {
        return res.status(400).json({ error: 'query is required' });
    }

    try {
        ensureGeminiConfigured();

        await vectorStore.ensureIndex();
        const embedding = await getEmbedding(req.body.query);
        const topK = Number(req.body.topK || TOP_K);
        const similar = await vectorStore.searchSimilarProblems(embedding, topK);
        res.status(200).json({ similar });
    } catch (error) {
        console.error('Error searching RAG index:', error);
        res.status(500).json({ error: 'Failed to query index', details: error.message });
    }
});

app.post('/api/hints', async (req, res) => {
    if (!req.body?.message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        ensureGeminiConfigured();

        const problemInfo = req.body.problemInfo || {};
        const problemId = normalizeProblemId(problemInfo);
        const cacheKey = buildCacheKey(problemInfo, req.body.message);
        const cachedHint = await cache.getCachedHint(cacheKey);
        
        if (cachedHint) {
            console.log('Returning cached hint');
            return res.json({ hint: cachedHint, source: 'cache', retrievalCount: 0 });
        }

        if (pendingHintRequests.has(cacheKey)) {
            const sharedResult = await pendingHintRequests.get(cacheKey);
            return res.json({ ...sharedResult, source: 'shared' });
        }

        const hintPromise = (async () => {
            const queryText = [
                buildProblemDocument(problemInfo),
                `Question: ${req.body.message}`
            ].join('\n\n');

            let similarProblems = [];
            try {
                await vectorStore.ensureIndex();
                const queryEmbedding = await getEmbedding(queryText);
                await vectorStore.upsertProblem({
                    problemId,
                    title: problemInfo.title || '',
                    description: problemInfo.description || '',
                    difficulty: problemInfo.difficulty || '',
                    tags: Array.isArray(problemInfo.tags) ? problemInfo.tags.join(', ') : '',
                    embedding: queryEmbedding
                });

                similarProblems = await vectorStore.searchSimilarProblems(queryEmbedding, TOP_K + 1, problemId);
            } catch (embeddingError) {
                console.warn('Embedding/RAG lookup unavailable, continuing without semantic context:', embeddingError.message);
            }

            const model = genAI.getGenerativeModel({ model: GENERATION_MODEL });
            const similarContext = formatSimilarContext(similarProblems.slice(0, TOP_K));
            const prompt = buildHintPrompt(problemInfo, req.body.message, similarContext);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const hint = response.text().trim();
            await cache.cacheHint(cacheKey, hint);
            return { hint, retrievalCount: similarProblems.length };
        })();

        pendingHintRequests.set(cacheKey, hintPromise);
        const hintResult = await hintPromise;
        pendingHintRequests.delete(cacheKey);
        
        console.log('Generated and cached response successfully');
        res.json({ ...hintResult, source: 'llm' });
    } catch (error) {
        if (req.body?.message) {
            const cacheKey = buildCacheKey(req.body.problemInfo || {}, req.body.message);
            pendingHintRequests.delete(cacheKey);
        }
        console.error('Error generating hint:', error);
        const retryAfter = getRetryAfter(error);
        const statusCode = error?.status === 429 ? 429 : 500;

        if (retryAfter && statusCode === 429) {
            res.set('Retry-After', retryAfter.replace(/s$/, ''));
        }

        res.status(statusCode).json({ 
            error: statusCode === 429 ? 'Gemini quota exceeded' : 'Failed to generate hint',
            details: error.message,
            retryAfter
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

if (require.main === module) {
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log('Environment:', {
            NODE_ENV: process.env.NODE_ENV,
            hasGeminiKey: !!process.env.GEMINI_API_KEY,
            hasRedis: !!process.env.REDIS_HOST
        });
    });

    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
    });
}

module.exports = app; 