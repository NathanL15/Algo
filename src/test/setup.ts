// Mock Chrome API
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  storage: {
    get: jest.fn(),
    set: jest.fn()
  }
} as unknown as typeof chrome;

// Mock fetch
global.fetch = jest.fn();

// Mock window.__algoChatInjected
Object.defineProperty(window, '__algoChatInjected', {
  value: false,
  writable: true
}); 