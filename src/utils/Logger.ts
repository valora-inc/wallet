/* eslint-disable no-console */
import * as Sentry from '@sentry/react-native'
import { format } from 'date-fns'
import { Platform } from 'react-native'
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

  getReactNativeLogFilePath = () => {
    return `${this.getReactNativeLogsDir()}/${format(new Date(), 'yyyyMMdd')}.txt`
  }

  getReactNativeLogsDir = () => {
    return `${RNFS.CachesDirectoryPath}/rn_logs`
  }

  getCombinedLogsFilePath = () => {
    // For now we need to export to a world-readable directory on Android
    // TODO: use the FileProvider approach so we don't need to do this.
    // See https://developer.android.com/reference/androidx/core/content/FileProvider
    // and https://github.com/chirag04/react-native-mail/blame/340618e4ef7f21a29d739d4180c2a267a14093d3/android/src/main/java/com/chirag/RNMail/RNMailModule.java#L106
    const path = Platform.OS === 'ios' ? RNFS.TemporaryDirectoryPath : RNFS.ExternalDirectoryPath
    return `${path}/rn_logs.txt`
  }

  cleanupOldLogs = async () => {
    try {
      const logFileCombinedPath = this.getCombinedLogsFilePath()
      const logDir = this.getReactNativeLogsDir()

      // If legacy log file or combined logs exist, delete it
      if (await RNFS.exists(logFileCombinedPath)) {
        await RNFS.unlink(logFileCombinedPath)
      }

      // Get the list of log files
      const logFiles = await RNFS.readDir(logDir)

      // Delete log files older than 28 days
      if (logFiles.length > 0) {
        logFiles.forEach((file) => {
          RNFS.stat(file.path)
            .then((stat) => {
              if (+stat.ctime < +new Date() - 4 * 7 * 24 * 60 * 60 * 1000) {
                console.debug('Deleting React Native logs file older than 28 days')
                RNFS.unlink(file.path).catch((err) => {
                  console.warn('Failed to delete React Native logs file: ' + err)
                })
              }
            })
            .catch((err) => {
              console.warn('Failed get log file stat: ' + err)
            })
        })
      }
    } catch (e) {
      console.warn('Failed to cleanup old React Native logs: ' + e)
    }
  }

  // Gets the logs for the current day
  getDailyLogs = async () => {
    try {
      const rnLogsSrc = this.getReactNativeLogFilePath()
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

  // Combines logs from the last n days into a single file
  createCombinedLogs = async () => {
    try {
      this.showMessage('Creating combined log...')
      const combinedLogsPath = this.getCombinedLogsFilePath()
      const logDir = this.getReactNativeLogsDir()

      // Delete previous combined Logs if present
      if (await RNFS.exists(combinedLogsPath)) {
        await RNFS.unlink(combinedLogsPath)
      }

      // Create empty file to combine log files into
      await RNFS.writeFile(combinedLogsPath, '', 'utf8')

      // Get all daily log files and combine into one file
      const logFiles = await RNFS.readDir(logDir)
      if (logFiles.length > 0) {
        logFiles.forEach(async (file) => {
          if (await RNFS.exists(file.path)) {
            await RNFS.appendFile(combinedLogsPath, await RNFS.readFile(file.path), 'utf8')
          }
        })
      }
      return combinedLogsPath
    } catch (e) {
      this.showError('Failed to combine logs: ' + e)
      return false
    }
  }

  // Anything being sent to console.log, console.warn, or console.error is piped into
  // the logfile specified by getReactNativeLogsFilePath()
  overrideConsoleLogs = () => {
    const logFilePath = this.getReactNativeLogFilePath()
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

    const writeLog = async (level: string, message: string) => {
      // If log folder not present create it
      if (!(await RNFS.exists(this.getReactNativeLogsDir()))) {
        await RNFS.mkdir(this.getReactNativeLogsDir())
      }

      // If daily log file is not present create it
      if (!(await RNFS.exists(logFilePath))) {
        await RNFS.writeFile(logFilePath, '', 'utf8')
      }

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
