/* eslint no-console: 0 */
// no-console disabled as we are testing console logs are overwritten by the logger
import 'react-native'
import { Platform } from 'react-native'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import Logger from './Logger'

const mockData = [
  {
    // ctime is 61 days ago
    ctime: new Date(new Date().getTime() - ONE_DAY_IN_MILLIS * 61),
    name: 'toDelete.txt',
    path: '__CACHES_DIRECTORY_PATH__/rn_logs/toDelete.txt',
    size: 5318,
    isFile: true,
    isDirectory: false,
  },
  {
    ctime: new Date(),
    name: 'toSave.txt',
    path: '__CACHES_DIRECTORY_PATH__/rn_logs/toSave.txt',
    size: 5318,
    isFile: true,
    isDirectory: false,
  },
]

jest.mock('react-native-fs', () => {
  return {
    exists: jest.fn(),
    mkdir: jest.fn(),
    readDir: jest.fn(() => Promise.resolve(mockData)),
    stat: jest
      .fn()
      .mockImplementation((filePath) =>
        Promise.resolve(mockData.find((file) => file.path === filePath))
      ),
    unlink: jest.fn(() => Promise.resolve()),
    writeFile: jest.fn(() => Promise.resolve()),
    ExternalDirectoryPath: '__EXTERNAL_DIRECTORY_PATH__',
    TemporaryDirectoryPath: '__CACHES_DIRECTORY_PATH__',
  }
})

describe('utils/Logger', () => {
  it('Logger overrides console.debug', () => {
    console.debug = jest.fn()
    Logger.debug('Test/Debug', 'Test message #1', 'Test message #2')
    expect(console.debug).toBeCalledTimes(1)
    expect(console.debug).toHaveBeenCalledWith('Test/Debug/Test message #1, Test message #2')
  })

  it('Logger overrides console.info', () => {
    console.info = jest.fn()
    Logger.info('Test/Info', 'Test message #1', 'Test message #2')
    expect(console.info).toBeCalledTimes(1)
    expect(console.info).toHaveBeenCalledWith('Test/Info/Test message #1, Test message #2')
  })

  it('Logger.warn pipes to console.info', () => {
    console.info = jest.fn()
    Logger.warn('Test/Warn', 'Test message #1', 'Test message #2')
    expect(console.info).toBeCalledTimes(1)
    expect(console.info).toHaveBeenCalledWith('Test/Warn/Test message #1, Test message #2')
  })

  it('Returns combined logs file path iOS', () => {
    // mock
    Platform.OS = 'ios'
    expect(Logger.getCombinedLogsFilePath()).toBe('__CACHES_DIRECTORY_PATH__/rn_logs.txt')
  })

  it('Returns combined logs file path Android', () => {
    // mock
    Platform.OS = 'android'
    expect(Logger.getCombinedLogsFilePath()).toBe('__EXTERNAL_DIRECTORY_PATH__/rn_logs.txt')
  })

  it('Cleans up old logs', async () => {
    console.debug = jest.fn()
    await Logger.cleanupOldLogs()
    expect(console.debug).toHaveBeenCalledTimes(1)
    expect(console.debug).toHaveBeenCalledWith(
      'Logger/cleanupOldLogs/Deleting React Native log file older than 60 days, __CACHES_DIRECTORY_PATH__/rn_logs/toDelete.txt'
    )
  })
})
