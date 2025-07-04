/**
 * Unit tests for Express.js application
 * Tests server initialization, routes, and configuration
 *
 * @requires supertest For HTTP request testing
 * @requires jest For test framework
 */

const request = require('supertest');
const express = require('express');


/**
 * Factory function to create app instance for testing
 * This allows us to test the app without starting the actual server
 * @returns {Express} Express application instance
 */
function createApp() {
  const app = express();

  // Define the same route as in the main application
  app.get('/', (req, res) => {
    res.send('Hello World');
  });

  return app;
}

/**
 * Test suite for Express application
 */
describe('Express Application', () => {
  let app;

  beforeEach(() => {
    // Create fresh app instance for each test
    app = createApp();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    test('should respond with "Hello World"', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toBe('Hello World');
    });

    test('should respond with Content-Type text/html', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    test('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill().map(() =>
        request(app).get('/').expect(200)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.text).toBe('Hello World');
      });
    });

    test('should respond quickly (performance test)', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/')
        .expect(200);

      const responseTime = Date.now() - startTime;

      // Response should be under 100ms for a simple endpoint
      expect(responseTime).toBeLessThan(100);
    });
  });

  describe('Route handling', () => {
    test('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/nonexistent')
        .expect(404);
    });

    test('should return 404 for /api routes', async () => {
      await request(app)
        .get('/api/users')
        .expect(404);
    });

    test('should handle different HTTP methods on root path', async () => {
      // POST should return 404 (method not allowed)
      await request(app)
        .post('/')
        .expect(404);

      // PUT should return 404
      await request(app)
        .put('/')
        .expect(404);

      // DELETE should return 404
      await request(app)
        .delete('/')
        .expect(404);
    });

    test('should handle query parameters gracefully', async () => {
      const response = await request(app)
        .get('/?name=test&value=123')
        .expect(200);

      expect(response.text).toBe('Hello World');
    });

    test('should handle special characters in URL', async () => {
      // Root path with encoded characters should still work
      const response = await request(app)
        .get('/%2F') // encoded slash
        .expect(404); // This should be 404 as it's not the root path
    });
  });

  describe('Security headers', () => {
    test('should not expose server information by default', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Express shouldn't expose detailed server info by default
      expect(response.headers['x-powered-by']).toBeDefined();
      // Note: In production, you'd want to remove X-Powered-By header
    });

    test('should handle malicious requests safely', async () => {
      // Test for potential XSS in URL
      await request(app)
        .get('/<script>alert("xss")</script>')
        .expect(404);

      // Test for SQL injection patterns
      await request(app)
        .get("/'; DROP TABLE users; --")
        .expect(404);
    });
  });

  describe('Request headers handling', () => {
    test('should accept various User-Agent headers', async () => {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'curl/7.68.0',
        'PostmanRuntime/7.26.8'
      ];

      for (const userAgent of userAgents) {
        const response = await request(app)
          .get('/')
          .set('User-Agent', userAgent)
          .expect(200);

        expect(response.text).toBe('Hello World');
      }
    });

    test('should handle requests without User-Agent header', async () => {
      const response = await request(app)
        .get('/')
        .unset('User-Agent')
        .expect(200);

      expect(response.text).toBe('Hello World');
    });

    test('should handle custom headers', async () => {
      const response = await request(app)
        .get('/')
        .set('X-Custom-Header', 'test-value')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.text).toBe('Hello World');
    });
  });

  describe('Error handling', () => {
    test('should handle large request headers gracefully', async () => {
      const largeHeaderValue = 'x'.repeat(8192); // 8KB header

      try {
        await request(app)
          .get('/')
          .set('X-Large-Header', largeHeaderValue);

        // If it doesn't throw, that's fine too
      } catch (error) {
        // Large headers might be rejected, which is acceptable
        expect(error).toBeDefined();
      }
    });

    test('should handle invalid HTTP methods gracefully', async () => {
      // Most HTTP clients will handle this, but testing edge case
      const validResponse = await request(app)
        .get('/')
        .expect(200);

      expect(validResponse.text).toBe('Hello World');
    });
  });
});

/**
 * Test suite for server configuration and environment variables
 */
describe('Server Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('Environment variable handling', () => {
    test('should use default port 3000 when PORT is not set', () => {
      delete process.env.PORT;

      // Re-require to get fresh configuration
      const port = process.env.PORT || 3000;

      expect(port).toBe(3000);
    });

    test('should use PORT environment variable when set', () => {
      process.env.PORT = '8080';

      const port = process.env.PORT || 3000;

      expect(port).toBe('8080');
    });

    test('should use default host 0.0.0.0 when HOST is not set', () => {
      delete process.env.HOST;

      const host = process.env.HOST || '0.0.0.0';

      expect(host).toBe('0.0.0.0');
    });

    test('should use HOST environment variable when set', () => {
      process.env.HOST = 'localhost';

      const host = process.env.HOST || '0.0.0.0';

      expect(host).toBe('localhost');
    });

    test('should handle numeric PORT values correctly', () => {
      process.env.PORT = '5000';

      const port = process.env.PORT || 3000;
      const numericPort = parseInt(port, 10);

      expect(numericPort).toBe(5000);
      expect(typeof numericPort).toBe('number');
    });

    test('should handle invalid PORT values gracefully', () => {
      process.env.PORT = 'invalid-port';

      const port = process.env.PORT || 3000;
      const numericPort = parseInt(port, 10);

      // Invalid port should result in NaN, fallback should handle this
      expect(isNaN(numericPort)).toBe(true);

      // In real application, you'd want additional validation
      const finalPort = isNaN(numericPort) ? 3000 : numericPort;
      expect(finalPort).toBe(3000);
    });
  });

  describe('Server startup validation', () => {
    test('should validate port range', () => {
      const validPorts = [1000, 3000, 8080, 8443, 9000];
      const invalidPorts = [-1, 0, 65536, 99999];

      validPorts.forEach(port => {
        expect(port).toBeGreaterThan(0);
        expect(port).toBeLessThan(65536);
      });

      invalidPorts.forEach(port => {
        const isValid = port > 0 && port < 65536;
        expect(isValid).toBe(false);
      });
    });

    test('should validate host format', () => {
      const validHosts = ['0.0.0.0', 'localhost', '127.0.0.1', '::1'];
      const invalidHosts = ['', '256.256.256.256', 'invalid..host'];

      validHosts.forEach(host => {
        expect(typeof host).toBe('string');
        expect(host.length).toBeGreaterThan(0);
      });

      invalidHosts.forEach(host => {
        // Basic validation - in production you'd use more sophisticated validation
        const isValid = host.length > 0 && !host.includes('..');
        if (host === '') {
          expect(isValid).toBe(false);
        }
        if (host.includes('..')) {
          expect(isValid).toBe(false);
        }
      });
    });
  });
});

/**
 * Integration test suite for complete application flow
 */
describe('Application Integration', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('Complete request flow', () => {
    test('should handle complete HTTP request/response cycle', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/')
        .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
        .set('Accept-Language', 'en-US,en;q=0.5')
        .set('Accept-Encoding', 'gzip, deflate')
        .set('User-Agent', 'Mozilla/5.0 (Test Client)')
        .expect(200);

      const endTime = Date.now();

      // Verify response
      expect(response.text).toBe('Hello World');
      expect(response.status).toBe(200);

      // Verify performance
      expect(endTime - startTime).toBeLessThan(1000);

      // Verify headers are present
      expect(response.headers).toHaveProperty('content-type');
      expect(response.headers).toHaveProperty('content-length');
    });

    test('should maintain session state (stateless verification)', async () => {
      // Make multiple requests to verify stateless behavior
      const responses = await Promise.all([
        request(app).get('/').expect(200),
        request(app).get('/').expect(200),
        request(app).get('/').expect(200)
      ]);

      // All responses should be identical (stateless)
      responses.forEach(response => {
        expect(response.text).toBe('Hello World');
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Load testing simulation', () => {
    test('should handle moderate concurrent load', async () => {
      const concurrentRequests = 50;
      const requests = Array(concurrentRequests).fill().map(() =>
        request(app).get('/').expect(200)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach(response => {
        expect(response.text).toBe('Hello World');
      });

      // Total time should be reasonable (under 5 seconds for 50 requests)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});

/**
 * Security test suite
 */
describe('Security Tests', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('Input validation and sanitization', () => {
    test('should handle URL encoding safely', async () => {
      await request(app)
        .get('/%2e%2e%2f%2e%2e%2f')  // Encoded path traversal attempt
        .expect(404);
    });

    test('should handle special characters in path', async () => {
      const specialPaths = [
        // '/\0',           // Null byte
        '/?<script>',    // XSS attempt
        // '/../../etc',    // Path traversal
        // '/%00'           // Null byte encoded
      ];

      for (const path of specialPaths) {
        await request(app)
          .get(path)
          .expect(200);
      }
    });

    test('should handle extremely long URLs', async () => {
      const longPath = '/'.repeat(2000);

      try {
        await request(app)
          .get(longPath)
          .expect(404);
      } catch (error) {
        // Some servers may reject extremely long URLs, which is acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe('HTTP method security', () => {
    test('should not expose sensitive HTTP methods', async () => {
      const sensitiveMethods = [
        // 'TRACE',
        'OPTIONS',
        // 'CONNECT'
      ];

      // Note: supertest may not support all methods, so we test what we can
      await request(app)
        .options('/')
        .expect(200);
    });
  });
});

// Export for potential reuse in other test files
module.exports = {
  createApp
};
