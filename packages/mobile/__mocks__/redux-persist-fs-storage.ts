export const DocumentDirectoryPath = jest.fn()

export default () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue(undefined),
})
