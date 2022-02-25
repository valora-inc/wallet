const Sentry = {
  config: () => ({ install: jest.fn() }),
  setTagsContext: jest.fn(),
  captureException: jest.fn(),
  ReactNavigationInstrumentation: jest.fn().mockImplementation(() => ({})),
  Severity: {
    Error: 'error',
  },
}

module.exports = Sentry
