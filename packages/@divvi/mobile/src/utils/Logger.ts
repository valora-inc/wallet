/* eslint-disable no-console */
import * as RNFS from '@divvi/react-native-fs'
import * as Sentry from '@sentry/react-native'
import { SeverityLevel } from '@sentry/types'
import { format } from 'date-fns'
import { Platform } from 'react-native'
import Toast from 'react-native-simple-toast'
import { DEFAULT_SENTRY_NETWORK_ERRORS, LOGGER_LEVEL } from 'src/config'
import { LoggerLevel } from 'src/utils/LoggerLevels'
import { ensureError } from 'src/utils/ensureError'
import { stylize } from 'src/utils/stylize'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'

type Attachments = Array<{
  path: string
  type: string
  name: string
}>

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
    console.debug(tag, ...messages)
  }

  info = (tag: string, ...messages: any[]) => {
    if (this.level < LoggerLevel.Info) {
      return
    }
    console.info(tag, ...messages)
  }

  warn = (tag: string, ...messages: any[]) => {
    if (this.level < LoggerLevel.Warn) {
      return
    }
    console.warn(tag, ...messages)
  }

  error = (
    tag: string,
    message: string,
    unknownError?: unknown,
    shouldSanitizeError = false,
    valueToPurge?: string
  ) => {
    const error = unknownError ? ensureError(unknownError) : undefined
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
        level: 'error' as SeverityLevel,
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
    console.error(
      `${tag} :: ${message} :: ${errorMsg} :: network connected ${this.isNetworkConnected}`
    )
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

  getCurrentLogFileName = () => {
    return `${format(new Date(), 'yyyy-MMM')}.txt`
  }

  getReactNativeLogFilePath = () => {
    return `${this.getReactNativeLogsDir()}/${this.getCurrentLogFileName()}`
  }

  getReactNativeLogsDir = () => {
    return `${RNFS.CachesDirectoryPath}/rn_logs`
  }

  getLogsToAttach = async () => {
    const toAttach: Attachments = []
    try {
      const logDir = this.getReactNativeLogsDir()
      const logFiles = await RNFS.readDir(logDir)
      for (const file of logFiles) {
        toAttach.push({
          path: `${logDir}/${file.name}`,
          name: file.name,
          type: 'text',
        })
      }
    } catch (error) {
      this.error('Logger', 'Failed to move logs to share', error)
    }
    return toAttach
  }

  getCombinedLogsFilePath = () => {
    const path = Platform.OS === 'ios' ? RNFS.TemporaryDirectoryPath : RNFS.ExternalDirectoryPath
    return `${path}/rn_logs.txt`
  }

  cleanupOldLogs = async () => {
    try {
      const logFileCombinedPath = this.getCombinedLogsFilePath()
      const logDir = this.getReactNativeLogsDir()

      // If legacy log file exist, delete it
      if (await RNFS.exists(logFileCombinedPath)) {
        await RNFS.unlink(logFileCombinedPath)
      }

      // If log folder not present create it
      await RNFS.mkdir(logDir)

      // Get the list of log files
      const logFiles = await RNFS.readDir(logDir)

      // Delete log files older than 60 days
      for (const logFile of logFiles) {
        const stat = await RNFS.stat(logFile.path)
        if (+stat.ctime < +new Date() - 60 * ONE_DAY_IN_MILLIS) {
          this.debug(
            'Logger/cleanupOldLogs',
            'Deleting React Native log file older than 60 days',
            logFile.path
          )
          await RNFS.unlink(logFile.path)
        }
      }
    } catch (error) {
      this.error('Logger@cleanupOldLogs', 'Failed to cleanupOldLogs', error)
    }
  }

  // Anything being sent to console.log, console.warn, console.error, etc is piped into
  // the log file specified by getReactNativeLogsFilePath()
  overrideConsoleLogs = () => {
    const logFilePath = this.getReactNativeLogFilePath()
    console.debug('React Native logs will be piped to ' + logFilePath)

    // These are the levels used by the nativeLoggingHook
    // See https://github.com/facebook/react-native/blob/419025df226dfad6a2be57c8d5515f103b96917b/packages/polyfills/console.js#L382-L387
    // Here we pad the end of the string so logs are visually aligned in the file
    // and is easier to parse for us humans :)
    const NATIVE_LOG_LEVELS: Record<number, string | undefined> = {
      0: 'DEBUG',
      1: 'INFO ',
      2: 'WARN ',
      3: 'ERROR',
    }

    const writeLog = async (logLevel: number, message: string) => {
      try {
        // If log folder not present create it
        await RNFS.mkdir(this.getReactNativeLogsDir())

        // If monthly log file is not present create it
        if (!(await RNFS.exists(logFilePath))) {
          await RNFS.writeFile(logFilePath, '', 'utf8')
        }

        const timestamp = new Date().toISOString()
        // Ensure messages are converted to utf8 as some remote CTA's can have Non-ASCII characters
        await RNFS.appendFile(
          logFilePath,
          `${NATIVE_LOG_LEVELS[logLevel] || NATIVE_LOG_LEVELS[0]} [${timestamp}] ${Buffer.from(
            message,
            'utf-8'
          ).toString()}\n`,
          'utf8'
        )
      } catch (error) {
        console.error(`Failed to write to ${logFilePath}`, error)
      }
    }

    // Override the method used by React Native through which all logs go through
    // See https://github.com/facebook/react-native/blob/419025df226dfad6a2be57c8d5515f103b96917b/packages/polyfills/console.js
    // This way we don't need to override all console methods
    const originalNativeLoggingHook = global.nativeLoggingHook

    global.nativeLoggingHook = (message: string, logLevel: number) => {
      // TODO: as an improvement, we could hook into the nativeLoggingHook from the native side
      // to avoid the extra calls via the bridge to write to the file
      // but for now it's simpler
      writeLog(logLevel, message).catch((error) => console.error(error))
      originalNativeLoggingHook(message, logLevel)
    }

    if (__DEV__) {
      // Add more info to the packager logs
      const HMRClient = require('react-native/Libraries/Utilities/HMRClient')
      const RNDeviceInfo = require('react-native-device-info')
      const originalHmrLog = HMRClient.log
      HMRClient.log = (level: string, data: any[]) => {
        // Padding so messages are aligned in the packager logs
        // See levels in https://github.com/facebook/react-native/blob/7858a2147fde9f754034577932cb5b22983f658f/Libraries/Utilities/HMRClient.js#L30-L39
        const leftPadding = Math.max(5 - level.length, 0)
        originalHmrLog(level, [
          [
            ''.padStart(leftPadding),
            `[${new Date().toISOString().substring(11)}]`,
            // Add the model to help differentiate logs when running multiple devices
            ` ${stylize(RNDeviceInfo.getModel(), 'grey')}`,
          ].join(''),
          ...data,
        ])
      }
    }
  }
}

export type LoggerType = Logger
export default new Logger({ level: LOGGER_LEVEL })
