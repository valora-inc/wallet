export const setAppConfig = jest.fn()

export const getAppConfig = jest.fn().mockReturnValue({
  displayName: 'Test App',
  deepLinkUrlScheme: 'testapp',
  registryName: 'test',
})
