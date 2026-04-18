const cache = require('./cache');

const INDEX_NAME = process.env.REDIS_VECTOR_INDEX || 'idx:leetcode:problems';
const KEY_PREFIX = process.env.REDIS_VECTOR_PREFIX || 'problem:';
const VECTOR_FIELD = 'embedding';
const VECTOR_DIM = Number(process.env.EMBEDDING_DIM || 3072);

function toFloat32Buffer(vector) {
    return Buffer.from(new Float32Array(vector).buffer);
}

function parseSearchResponse(raw) {
    if (!Array.isArray(raw) || raw.length < 2) {
        return [];
    }

    const parsed = [];
    for (let i = 1; i < raw.length; i += 2) {
        const id = raw[i];
        const fields = raw[i + 1];

        if (!id || !Array.isArray(fields)) {
            continue;
        }

        const item = { key: id };
        for (let j = 0; j < fields.length; j += 2) {
            item[fields[j]] = fields[j + 1];
        }
        parsed.push(item);
    }

    return parsed;
}

class VectorStoreService {
    constructor() {
        this.indexReady = false;
    }

    async ensureIndex() {
        if (this.indexReady) {
            return;
        }

        try {
            await cache.redis.call('FT.INFO', INDEX_NAME);
            this.indexReady = true;
            return;
        } catch (error) {
            if (!String(error.message || '').toLowerCase().includes('unknown index name')) {
                throw error;
            }
        }

        await cache.redis.call(
            'FT.CREATE',
            INDEX_NAME,
            'ON',
            'HASH',
            'PREFIX',
            '1',
            KEY_PREFIX,
            'SCHEMA',
            'problemId',
            'TEXT',
            'title',
            'TEXT',
            'description',
            'TEXT',
            'difficulty',
            'TAG',
            'tags',
            'TAG',
            VECTOR_FIELD,
            'VECTOR',
            'HNSW',
            '6',
            'TYPE',
            'FLOAT32',
            'DIM',
            String(VECTOR_DIM),
            'DISTANCE_METRIC',
            'COSINE'
        );

        this.indexReady = true;
    }

    async upsertProblem(problem) {
        const key = `${KEY_PREFIX}${problem.problemId}`;
        const vectorBuffer = toFloat32Buffer(problem.embedding);

        await cache.redis.hset(
            key,
            'problemId',
            problem.problemId,
            'title',
            problem.title || '',
            'description',
            problem.description || '',
            'difficulty',
            problem.difficulty || 'Unknown',
            'tags',
            problem.tags || '',
            VECTOR_FIELD,
            vectorBuffer
        );
    }

    async searchSimilarProblems(queryEmbedding, topK = 3, excludeProblemId = null) {
        const vectorBuffer = toFloat32Buffer(queryEmbedding);
        const query = `*=>[KNN ${topK} @${VECTOR_FIELD} $vec AS score]`;

        const result = await cache.redis.call(
            'FT.SEARCH',
            INDEX_NAME,
            query,
            'PARAMS',
            '2',
            'vec',
            vectorBuffer,
            'SORTBY',
            'score',
            'ASC',
            'RETURN',
            '6',
            'problemId',
            'title',
            'description',
            'difficulty',
            'tags',
            'score',
            'DIALECT',
            '2'
        );

        const parsed = parseSearchResponse(result);
        if (!excludeProblemId) {
            return parsed;
        }

        return parsed.filter((item) => item.problemId !== excludeProblemId);
    }
}

module.exports = new VectorStoreService();
