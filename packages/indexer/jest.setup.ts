jest.mock('./src/config', () => ({
  ...(jest.requireActual('./src/config') as any),
}))
