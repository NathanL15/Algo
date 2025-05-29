const request = require('supertest');
const express = require('express');
const app = require('../server');

describe('Server Endpoints', () => {
  it('should return 200 for health check endpoint', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('Server is running');
  });

  it('should return 400 for hints endpoint without message', async () => {
    const res = await request(app).post('/api/hints');
    expect(res.statusCode).toEqual(400);
  });
}); 