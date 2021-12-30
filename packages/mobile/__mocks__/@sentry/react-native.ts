const Sentry = {
  config: () => ({ install: jest.fn() }),
  setTagsContext: jest.fn(),
  captureException: jest.fn(),
  ReactNavigationInstrumentation: jest.fn().mockImplementation(() => ({})),
}

module.exports = Sentry
