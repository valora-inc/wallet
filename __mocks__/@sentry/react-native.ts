const Sentry = {
  config: () => ({ install: jest.fn() }),
  setTagsContext: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  ReactNavigationInstrumentation: jest.fn().mockImplementation(() => ({})),
  Severity: {
    Error: 'error',
  },
}

module.exports = Sentry
