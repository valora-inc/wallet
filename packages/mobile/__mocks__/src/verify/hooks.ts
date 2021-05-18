module.exports = {
  ...jest.requireActual('src/verify/hooks'),
  useAsyncKomenciReadiness: jest.fn().mockReturnValue({
    loading: false,
    error: undefined,
    result: true,
  }),
}
