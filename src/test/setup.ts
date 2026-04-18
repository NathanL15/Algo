globalThis.chrome = {
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

globalThis.fetch = jest.fn();

Object.defineProperty(window, '__algoChatInjected', {
  value: false,
  writable: true
}); 