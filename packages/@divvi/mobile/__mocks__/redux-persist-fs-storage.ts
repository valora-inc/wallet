export const DocumentDirectoryPath = jest.fn()

export default () => ({
  setItem: async () => jest.fn(),
  getItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue(undefined),
})
