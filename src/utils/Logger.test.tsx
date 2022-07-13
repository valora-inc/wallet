import 'react-native'
import { Platform } from 'react-native'
import { readDir, stat } from '../../__mocks__/react-native-fs'
import Logger from './Logger'

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
    expect(Logger.getCombinedLogsFilePath()).toBe('__TEMPORARY_DIRECTORY_PATH__/rn_logs.txt')
  })

  it('Returns combined logs file path Android', () => {
    // mock
    Platform.OS = 'android'
    expect(Logger.getCombinedLogsFilePath()).toBe('__EXTERNAL_DIRECTORY_PATH__/rn_logs.txt')
  })

  it('Cleans up old logs', async () => {
    const mockData = [
      {
        // ctime is 29 days ago
        ctime: new Date(new Date().getTime() - 2505600000),
        name: 'toDelete.txt',
        path: '__TEMPORARY_DIRECTORY_PATH__/rn_logs/toDelete.txt',
        size: 5318,
        isFile: true,
        isDirectory: false,
      },
      {
        ctime: new Date(),
        name: 'toSave.txt',
        path: '__TEMPORARY_DIRECTORY_PATH__/rn_logs/toSave.txt',
        size: 5318,
        isFile: true,
        isDirectory: false,
      },
    ]
    console.debug = jest.fn()
    readDir.mockImplementation(() => mockData)
    stat.mockImplementation((filePath) =>
      Promise.resolve(mockData.find((file) => file.path === filePath))
    )
    await Logger.cleanupOldLogs()
    expect(console.debug).toHaveBeenCalledTimes(1)
    expect(console.debug).toHaveBeenCalledWith('Deleting React Native log file older than 28 days')
  })
})
