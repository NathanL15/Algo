jest.mock('ioredis');
jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
                response: { text: () => 'Mock hint response' },
            }),
            embedContent: jest.fn().mockResolvedValue({
                embedding: { values: new Array(3072).fill(0) },
            }),
        }),
    })),
}));

import request from 'supertest';
import app from '../server';

describe('Server Endpoints', () => {
    it('should return 200 for root health check', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'Server is running');
    });

    it('should return 200 for /healthz', async () => {
        const res = await request(app).get('/healthz');
        expect(res.statusCode).toEqual(200);
    });

    it('should return 400 for /api/hints without message', async () => {
        const res = await request(app).post('/api/hints').send({});
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Message is required');
    });
});
