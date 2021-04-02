module.exports = {
  ...jest.requireActual('src/verify/hooks'),
  useAsyncKomenciAvailable: jest.fn().mockReturnValue({
    // status: AsyncStateStatus;
    loading: false,
    error: undefined,
    result: true,
  }),
}
