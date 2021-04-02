module.exports = {
  ...jest.requireActual('src/verify/hooks'),
  useAsyncKomenciAvailable: jest.fn().mockReturnValue({
    loading: false,
    error: undefined,
    result: true,
  }),
}
