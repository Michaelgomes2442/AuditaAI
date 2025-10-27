import { expect } from 'chai';
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

let currentTestPrompt = null;

describe('AuditaAI Core API Tests', () => {
  let testConversationId = null;

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('status', 'healthy');
      expect(response.data).to.have.property('service', 'AuditaAI Core');
      expect(response.data).to.have.property('version');
      expect(response.data).to.have.property('timestamp');
    });
  });

  describe('Analyze Endpoint', () => {
    it('should analyze a prompt and return governance metrics', async () => {
      const payload = {
        prompt: "Explain the concept of machine learning",
        model: "gpt-4",
        context: {
          userId: "test-user",
          sessionId: "test-session"
        }
      };

      currentTestPrompt = payload.prompt;

      const response = await axios.post(`${BASE_URL}/analyze`, payload);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('analysis');
      expect(response.data).to.have.property('receipt');
      expect(response.data).to.have.property('actions');

      // Validate analysis structure
      const { analysis } = response.data;
      expect(analysis).to.have.property('prompt', payload.prompt);
      expect(analysis).to.have.property('model', payload.model);
      expect(analysis).to.have.property('cries');
      expect(analysis.cries).to.have.all.keys('C', 'R', 'I', 'E', 'S', 'Omega');

      // Validate CRIES scores are between 0 and 1
      Object.values(analysis.cries).forEach(score => {
        expect(score).to.be.at.least(0).and.at.most(1);
      });

      // Store conversation ID for later tests
      testConversationId = response.data.receipt.conversationId;
    });

    it('should handle policy violations', async () => {
      const payload = {
        prompt: "How to hack a website?",
        model: "gpt-4",
        context: {}
      };

      currentTestPrompt = payload.prompt;

      const response = await axios.post(`${BASE_URL}/analyze`, payload);
      expect(response.status).to.equal(200);

      // Should have analysis (even if blocked)
      expect(response.data).to.have.property('analysis');
    });

    it('should handle empty prompt', async () => {
      const payload = {
        prompt: "",
        model: "gpt-4",
        context: {}
      };

      try {
        await axios.post(`${BASE_URL}/analyze`, payload);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });
  });

  describe('Compare Endpoint', () => {
    it('should compare multiple models', async () => {
      const payload = {
        prompt: "What is artificial intelligence?",
        models: ["gpt-4", "claude-3"]
      };

      const response = await axios.post(`${BASE_URL}/compare`, payload);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('comparison');
      expect(response.data).to.have.property('receipt');
      expect(response.data.comparison).to.have.property('models');
      expect(response.data.comparison.models).to.be.an('array');
      expect(response.data.comparison.models.length).to.equal(2);

      // Each model in comparison should have analysis
      response.data.comparison.models.forEach(model => {
        expect(model).to.have.property('model');
        expect(model).to.have.property('response');
        expect(model).to.have.property('cries');
        expect(model.cries).to.have.all.keys('C', 'R', 'I', 'E', 'S', 'Omega');
      });
    });

    it('should handle single model comparison', async () => {
      const payload = {
        prompt: "Explain neural networks",
        models: ["gpt-4"]
      };

      try {
        await axios.post(`${BASE_URL}/compare`, payload);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });

    it('should handle empty models array', async () => {
      const payload = {
        prompt: "Test prompt",
        models: []
      };

      try {
        await axios.post(`${BASE_URL}/compare`, payload);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });
  });

  describe('Receipts Endpoint', () => {
    it('should retrieve receipts with pagination', async () => {
      const response = await axios.get(`${BASE_URL}/receipts`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('receipts');
      expect(response.data).to.have.property('pagination');
      expect(response.data.receipts).to.be.an('array');
    });

    it('should retrieve receipts for specific conversation', async () => {
      if (!testConversationId) {
        console.warn('Skipping test - no conversation ID from previous test');
        return;
      }

      const response = await axios.get(`${BASE_URL}/receipts/conversation/${testConversationId}`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('receipts');
      expect(response.data.receipts).to.be.an('array');
      expect(response.data.receipts.length).to.be.greaterThan(0);

      // Validate receipt structure
      const receipt = response.data.receipts[0];
      expect(receipt).to.have.property('id');
      expect(receipt).to.have.property('type');
      expect(receipt).to.have.property('conversationId', testConversationId);
      expect(receipt).to.have.property('lamportClock');
      expect(receipt).to.have.property('prevDigest');
      expect(receipt).to.have.property('selfHash');
      expect(receipt).to.have.property('timestamp');
    });

    it('should export receipts as JSON', async () => {
      if (!testConversationId) {
        console.warn('Skipping test - no conversation ID from previous test');
        return;
      }

      const response = await axios.get(`${BASE_URL}/receipts/export/${testConversationId}`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('conversationId', testConversationId);
      expect(response.data).to.have.property('receipts');
      expect(response.data).to.have.property('exportTimestamp');
      expect(response.data.receipts).to.be.an('array');
    });

    it('should export receipts as NDJSON stream', async () => {
      if (!testConversationId) {
        console.warn('Skipping test - no conversation ID from previous test');
        return;
      }

      const response = await axios.get(`${BASE_URL}/receipts/export-ndjson/${testConversationId}`, {
        headers: { 'Accept': 'application/x-ndjson' }
      });
      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('application/x-ndjson');

      // Parse NDJSON response
      const lines = response.data.trim().split('\n');
      expect(lines.length).to.be.greaterThan(0);

      lines.forEach(line => {
        const receipt = JSON.parse(line);
        expect(receipt).to.have.property('id');
        expect(receipt).to.have.property('conversationId', testConversationId);
      });
    });

    it('should list all conversations', async () => {
      const response = await axios.get(`${BASE_URL}/receipts/conversations`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('conversations');
      expect(response.data.conversations).to.be.an('array');

      if (testConversationId) {
        const conversationIds = response.data.conversations.map(c => c.id);
        expect(conversationIds).to.include(testConversationId);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON', async () => {
      try {
        await axios.post(`${BASE_URL}/analyze`, 'invalid json', {
          headers: { 'Content-Type': 'application/json' }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Either 400 (bad request) or 500 (server error) is acceptable
        expect([400, 500]).to.include(error.response.status);
      }
    });

    it('should handle missing required fields', async () => {
      try {
        await axios.post(`${BASE_URL}/analyze`, {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });

    it('should handle non-existent endpoints', async () => {
      try {
        await axios.get(`${BASE_URL}/nonexistent`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe('Load Testing', () => {
    it('should handle multiple concurrent requests', async () => {
      const payload = {
        prompt: "What is the capital of France?",
        model: "gpt-4",
        context: {}
      };

      currentTestPrompt = payload.prompt;

      const promises = Array(10).fill().map(() =>
        axios.post(`${BASE_URL}/analyze`, payload)
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('analysis');
      });
    });
  });

  afterEach(async function() {
    if (this.currentTest.state === 'failed' && currentTestPrompt) {
      console.log(`Test failed: ${this.currentTest.title}, sending to dual analysis`);
      try {
        const dualPayload = {
          prompt: currentTestPrompt,
          models: ["gpt-4", "claude-3"]
        };
        await axios.post(`${BASE_URL}/compare`, dualPayload);
        console.log('Dual analysis completed');
      } catch (error) {
        console.error('Dual analysis failed:', error.message);
      }
    }
  });
});