import { LoggingBunyan } from '@google-cloud/logging-bunyan'
import bunyan from 'bunyan'

const loggingBunyan = new LoggingBunyan()
export const logger = bunyan.createLogger({
  name: 'blockchain-api',
  streams: [
    // Log to the console at 'info' and above
    { stream: process.stdout, level: 'info' },
    // And log to Cloud Logging, logging at 'info' and above
    loggingBunyan.stream('info'),
  ],
})
