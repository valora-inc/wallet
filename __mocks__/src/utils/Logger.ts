module.exports = {
  __esModule: true,
  ...jest.requireActual('src/utils/Logger'),
  default: {
    ...jest.requireActual('src/utils/Logger').default,
    createCombinedLogs: jest.fn(),
  },
}
