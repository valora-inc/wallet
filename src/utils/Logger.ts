/* eslint-disable no-console */
import * as Sentry from '@sentry/react-native'
import * as RNFS from 'react-native-fs'
import Toast from 'react-native-simple-toast'
import { DEFAULT_SENTRY_NETWORK_ERRORS, LOGGER_LEVEL } from 'src/config'
import { LoggerLevel } from 'src/utils/LoggerLevels'

class Logger {
  isNetworkConnected: boolean
  networkErrors: string[]
  level: LoggerLevel

  constructor({ level }: { level: LoggerLevel } = { level: LoggerLevel.Debug }) {
    this.level = level
    this.isNetworkConnected = true
    this.networkErrors = DEFAULT_SENTRY_NETWORK_ERRORS || []
  }

  /**
   * Note: A good `tag` will consist of filename followed by the method name.
   * For example, `CeloAnalytics/track`
   * In case the file name is ambigous, add the parent directory name to it.
   * For example, `send/actions/refreshGasPrice` since there are many actions.ts files.
   */
  debug = (tag: string, ...messages: any[]) => {
    if (this.level < LoggerLevel.Debug) {
      return
    }
    console.debug(`${tag}/${messages.join(', ')}`)
  }

  info = (tag: string, ...messages: any[]) => {
    if (this.level < LoggerLevel.Info) {
      return
    }
    console.info(`${tag}/${messages.join(', ')}`)
  }

  warn = (tag: string, ...messages: any[]) => {
    if (this.level < LoggerLevel.Warn) {
      return
    }
    // console.warn would display yellow box, therefore, we will log to console.info instead.
    console.info(`${tag}/${messages.join(', ')}`)
  }

  error = (
    tag: string,
    message: string,
    error?: Error,
    shouldSanitizeError = false,
    valueToPurge?: string
  ) => {
    // console.error would display red box, therefore, we will log to console.info instead.
    const sanitizedError =
      error && shouldSanitizeError ? this.sanitizeError(error, valueToPurge) : error
    const errorMsg = this.getErrorMessage(sanitizedError)
    const isNetworkError = this.networkErrors.some(
      (networkError) =>
        message.toString().toLowerCase().includes(networkError) ||
        errorMsg.toLowerCase().includes(networkError)
    )

    // prevent genuine network errors from being sent to Sentry
    if (!isNetworkError || (this.isNetworkConnected && isNetworkError)) {
      const captureContext = {
        level: Sentry.Severity.Error,
        extra: {
          tag,
          // TODO: the toString() can be removed after upgrading TS to v4. It is
          // needed for now because the try/catch errors are typed as any, and we
          // don't get warnings from calling this function like
          // `Logger.error(TAG, error)`
          message: message?.toString(),
          errorMsg,
          source: 'Logger.error',
          networkConnected: this.isNetworkConnected,
        },
      }

      // If we don't have an error object call Sentry.captureMessage. That will
      // group events without an error by message (accounting for some parameters
      // in the message). Sentry.captureException sentry will group all events
      // without an error object together.
      if (error) {
        Sentry.captureException(error, captureContext)
      } else {
        Sentry.captureMessage(message, captureContext)
      }
    }
    console.info(
      `${tag} :: ${message} :: ${errorMsg} :: network connected ${this.isNetworkConnected}`
    )
    if (__DEV__) {
      console.info(console.trace())
    }
  }

  setIsNetworkConnected = (isConnected: boolean) => {
    this.isNetworkConnected = isConnected
  }

  setNetworkErrors = (errors: string[]) => {
    this.networkErrors = errors
  }

  // TODO: see what to do with this on iOS since there's not native toast
  showMessage = (message: string) => {
    Toast.showWithGravity(message, Toast.SHORT, Toast.BOTTOM)
    this.debug('Toast', message)
  }

  // TODO(Rossy) Remove this. We should be using the error banner instead.
  // Do not add new code that uses this.
  showError = (error: string | Error) => {
    const errorMsg = this.getErrorMessage(error)
    Toast.showWithGravity(errorMsg, Toast.SHORT, Toast.BOTTOM)
    this.error('Toast', errorMsg)
  }

  getErrorMessage = (error?: string | Error) => {
    if (!error) {
      return ''
    }
    if (typeof error === 'string') {
      return error
    }
    let errorMsg = error.message || error.name || 'unknown'
    if (error.stack) {
      errorMsg += ' in ' + error.stack.substring(0, 100)
    }
    return errorMsg
  }

  sanitizeError = (error: Error, valueToPurge?: string) => {
    const message = this.getErrorMessage(error).toLowerCase()

    if (message.includes('password') || message.includes('key') || message.includes('pin')) {
      return new Error('Error message hidden for privacy')
    }

    if (valueToPurge) {
      return new Error(message.replace(new RegExp(valueToPurge, 'g'), '<purged>'))
    }

    return error
  }

  getReactNativeLogsFilePath = () => {
    return RNFS.CachesDirectoryPath + '/rn_logs.txt'
  }

  getLogs = async () => {
    // TODO(Rossy) Does this technique of passing logs back as a string
    // fail when the logs get too big?
    try {
      const rnLogsSrc = this.getReactNativeLogsFilePath()
      let reactNativeLogs = null
      if (await RNFS.exists(rnLogsSrc)) {
        reactNativeLogs = await RNFS.readFile(rnLogsSrc)
      }
      return reactNativeLogs
    } catch (e) {
      this.showError('Failed to read logs: ' + e)
      return null
    }
  }

  // Anything being sent to console.log, console.warn, or console.error is piped into
  // the logfile specified by getReactNativeLogsFilePath()
  overrideConsoleLogs = () => {
    const logFilePath = this.getReactNativeLogsFilePath()
    console.debug('React Native logs will be piped to ' + logFilePath)

    const consoleFns: { [key: string]: (message?: any, ...optionalParams: any[]) => void } = {
      debug: console.debug,
      log: console.log,
      info: console.info,
      // console.error displays a red box, therefore, we console.info instead
      error: console.info,
      // console.warn displays a yellow box, therefore, we console.info instead
      warn: console.info,
    }

    const writeLog = (level: string, message: string) => {
      const timestamp = new Date().toISOString()
      RNFS.appendFile(logFilePath, `${level} [${timestamp}] ${message}\n`, 'utf8').catch(
        (error) => {
          consoleFns.debug(`Failed to write to ${logFilePath}`, error)
        }
      )
    }

    const log = (level: string, message?: any, ...optionalParams: any[]) => {
      if (typeof message === 'string') {
        const timestamp = Date.now()
        const consoleMessage = `[${timestamp}] ${message}`

        consoleFns[level](consoleMessage, ...optionalParams)
        writeLog(level, message)
      } else {
        consoleFns[level](message, ...optionalParams)
      }
    }

    console.log = (message?: any, ...optionalParams: any[]) => {
      log('log', message, ...optionalParams)
    }

    console.debug = (message?: any, ...optionalParams: any[]) => {
      log('debug', message, ...optionalParams)
    }

    console.info = (message?: any, ...optionalParams: any[]) => {
      log('info', message, ...optionalParams)
    }

    console.warn = (message?: any, ...optionalParams: any[]) => {
      log('warn', message, ...optionalParams)
    }

    console.error = (message?: any, ...optionalParams: any[]) => {
      log('error', message, ...optionalParams)
    }
  }
}

export default new Logger({ level: LOGGER_LEVEL })
