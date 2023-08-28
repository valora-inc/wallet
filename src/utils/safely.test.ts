import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'

const loggerErrorSpy = jest.fn()
const consoleErrorSpy = jest.spyOn(console, 'error')

const mockedLogger = jest.mocked(Logger)
mockedLogger.error = loggerErrorSpy

beforeEach(() => {
  jest.resetAllMocks()
})

describe(safely, () => {
  it('calls the wrapped function', () => {
    const wrapped = jest.fn((...args) => 'some value')
    const safe = safely(wrapped)

    expect(safe('some arg').next().value).toBe('some value')
    expect(wrapped).toHaveBeenCalledTimes(1)
    expect(wrapped).toHaveBeenCalledWith('some arg')

    expect(loggerErrorSpy).toHaveBeenCalledTimes(0)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(0)
  })

  it('logs thrown errors', () => {
    const oops = new Error('oops')
    const wrapped = jest.fn((...args) => {
      throw oops
    })
    const safe = safely(wrapped)

    expect(safe('some arg').next().value).toBe(undefined)
    expect(wrapped).toHaveBeenCalledTimes(1)
    expect(wrapped).toHaveBeenCalledWith('some arg')

    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'utils/safely',
      'Unhandled error in wrapped saga',
      oops
    )
    expect(consoleErrorSpy).toHaveBeenCalledTimes(0)
  })

  it('writes to console.error, in the (unlikely) case Logger throws', () => {
    const loggerFailed = new Error('logger failed')
    loggerErrorSpy.mockImplementation(() => {
      throw loggerFailed
    })

    const oops = new Error('oops')
    const wrapped = jest.fn((...args) => {
      throw oops
    })
    const safe = safely(wrapped)

    expect(safe('some arg').next().value).toBe(undefined)
    expect(wrapped).toHaveBeenCalledTimes(1)
    expect(wrapped).toHaveBeenCalledWith('some arg')

    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Something is broken, this should never happen',
      oops,
      loggerFailed
    )
  })

  it('still ignores the error, in the (even more unlikely) case console throws', () => {
    const loggerFailed = new Error('logger failed')
    loggerErrorSpy.mockImplementation(() => {
      throw loggerFailed
    })

    const consoleFailed = new Error('console failed')
    consoleErrorSpy.mockImplementation(() => {
      throw consoleFailed
    })

    const oops = new Error('oops')
    const wrapped = jest.fn((...args) => {
      throw oops
    })
    const safe = safely(wrapped)

    expect(safe('some arg').next().value).toBe(undefined)
    expect(wrapped).toHaveBeenCalledTimes(1)
    expect(wrapped).toHaveBeenCalledWith('some arg')

    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Something is broken, this should never happen',
      oops,
      loggerFailed
    )
  })
})
