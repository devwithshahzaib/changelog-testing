const request = require('supertest');
const app = require('../server');

describe('Server Tests', () => {
  describe('GET /', () => {
    it('should return Hello World', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toBe('Hello World');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.text).toBe('Not Found');
    });
  });
});
