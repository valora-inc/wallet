jest.mock('./src/config', () => ({
  ...(jest.requireActual('./src/config') as any),
  NOTIFICATIONS_DISABLED: true,
}))
