/**
 * Tests for AI Adapter system
 */

// Mock logger to avoid chalk ESM issues
jest.mock('../scripts/utils/logger', () => ({
  info: jest.fn(),
  success: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

const { AdapterFactory, AiderAdapter, ContinueAdapter, AIAdapter } = require('../scripts/adapters');

describe('AdapterFactory', () => {
  const baseConfig = {
    model: 'qwen2.5-coder:7b',
    ollamaHost: 'http://localhost:11434',
    timeout: 300000
  };

  test('creates AiderAdapter by default', () => {
    const adapter = AdapterFactory.create(baseConfig);
    expect(adapter).toBeInstanceOf(AiderAdapter);
    expect(adapter.getName()).toBe('AiderAdapter');
  });

  test('creates AiderAdapter when specified', () => {
    const adapter = AdapterFactory.create({ ...baseConfig, adapter: 'aider' });
    expect(adapter).toBeInstanceOf(AiderAdapter);
  });

  test('creates ContinueAdapter when specified', () => {
    const adapter = AdapterFactory.create({ ...baseConfig, adapter: 'continue' });
    expect(adapter).toBeInstanceOf(ContinueAdapter);
  });

  test('is case-insensitive for adapter name', () => {
    const adapter1 = AdapterFactory.create({ ...baseConfig, adapter: 'AIDER' });
    const adapter2 = AdapterFactory.create({ ...baseConfig, adapter: 'Continue' });
    
    expect(adapter1).toBeInstanceOf(AiderAdapter);
    expect(adapter2).toBeInstanceOf(ContinueAdapter);
  });

  test('throws error for unknown adapter', () => {
    expect(() => {
      AdapterFactory.create({ ...baseConfig, adapter: 'unknown' });
    }).toThrow('Unknown adapter: unknown');
  });

  test('lists available adapters', () => {
    const adapters = AdapterFactory.getAvailableAdapters();
    expect(adapters).toContain('aider');
    expect(adapters).toContain('continue');
  });
});

describe('AiderAdapter', () => {
  const config = {
    model: 'qwen2.5-coder:7b',
    ollamaHost: 'http://localhost:11434',
    timeout: 300000
  };

  test('has correct name', () => {
    const adapter = new AiderAdapter(config);
    expect(adapter.getName()).toBe('AiderAdapter');
  });

  test('sets model correctly', () => {
    const adapter = new AiderAdapter(config);
    expect(adapter.model).toBe('qwen2.5-coder:7b');
  });

  test('sets ollama host correctly', () => {
    const adapter = new AiderAdapter(config);
    expect(adapter.ollamaHost).toBe('http://localhost:11434');
  });

  test('healthCheck returns status object when aider not installed', async () => {
    const adapter = new AiderAdapter(config);
    const result = await adapter.healthCheck();
    // healthCheck returns an object with healthy: boolean
    expect(result).toHaveProperty('healthy');
    expect(result).toHaveProperty('adapter', 'aider');
  });
});

describe('ContinueAdapter', () => {
  const config = {
    model: 'qwen2.5-coder:7b',
    ollamaHost: 'http://localhost:11434',
    timeout: 300000
  };

  test('has correct name', () => {
    const adapter = new ContinueAdapter(config);
    expect(adapter.getName()).toBe('ContinueAdapter');
  });

  test('sets model correctly', () => {
    const adapter = new ContinueAdapter(config);
    expect(adapter.model).toBe('qwen2.5-coder:7b');
  });

  test('healthCheck returns status object', async () => {
    const adapter = new ContinueAdapter(config);
    const result = await adapter.healthCheck();
    // healthCheck returns an object with healthy: boolean
    expect(result).toHaveProperty('healthy');
    expect(result).toHaveProperty('adapter', 'continue');
  });
});

describe('AIAdapter base class', () => {
  test('cannot be instantiated directly', () => {
    const config = { model: 'test', ollamaHost: 'http://localhost:11434' };
    const adapter = new AIAdapter(config);
    
    expect(() => adapter.process({})).rejects.toThrow('process() must be implemented');
  });
});
