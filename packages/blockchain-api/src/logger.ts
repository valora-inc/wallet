import * as Logger from 'bunyan'
import PrettyStream from 'bunyan-prettystream'
import { LoggingBunyan } from '@google-cloud/logging-bunyan'

const consoleStream = new PrettyStream()
consoleStream.pipe(process.stdout)

const streams: Logger.Stream[] = [{ stream: consoleStream, level: 'info' }]
if (process.env['GAE_APPLICATION']) {
  const loggingBunyan = new LoggingBunyan()
  streams.push(loggingBunyan.stream('info'))
}

export const logger = Logger.createLogger({
  name: 'blockchain-api',
  streams,
})
