import { readFileSync } from 'fs'
import { Providers } from '../Providers'

// Inputs:
const logFilePath = '/Users/tarik/Downloads/moonpay_logs.json' // Your local log file here
const provider = Providers.Moonpay // The provider which is getting logs parsed

const logs = JSON.parse(readFileSync(logFilePath, 'utf8'))

const project = logs[0].logName.split('/')[1]
process.env.GCLOUD_PROJECT = project
// Using an in-line require because process variables need to be defined
// before calling these functions
const { parseMoonpayEvent, MOONPAY_BIG_QUERY_EVENT_TABLE } = require('../moonpayWebhook')
const { parseRampEvent, RAMP_BIG_QUERY_EVENT_TABLE } = require('../rampWebhook')
const { parseXanpoolEvent, XANPOOL_BIG_QUERY_EVENT_TABLE } = require('../xanpoolwebhook')
const { parseTransakEvent, TRANSAK_BIG_QUERY_EVENT_TABLE } = require('../transakWebhook')

const selectEventParser = (provider: Providers): Function => {
  if (provider === Providers.Moonpay) {
    return parseMoonpayEvent
  }

  if (provider === Providers.Ramp) {
    return parseRampEvent
  }

  if (provider === Providers.Xanpool) {
    return parseXanpoolEvent
  }
  if (provider === Providers.Transak) {
    return parseTransakEvent
  }

  return () => ({})
}

const selectEventTable = (provider: Providers): string => {
  if (provider === Providers.Moonpay) {
    return MOONPAY_BIG_QUERY_EVENT_TABLE
  }

  if (provider === Providers.Ramp) {
    return RAMP_BIG_QUERY_EVENT_TABLE
  }

  if (provider === Providers.Xanpool) {
    return XANPOOL_BIG_QUERY_EVENT_TABLE
  }

  if (provider === Providers.Transak) {
    return TRANSAK_BIG_QUERY_EVENT_TABLE
  }

  return ''
}

const processLogs = async (provider: Providers) => {
  console.info(`Logs contain ${logs.length} events`)
  const eventTable = selectEventTable(provider)
  const parser = selectEventParser(provider)

  const eventBodies = []
  console.info('Parsing logs...')
  for (let i = 0; i < logs.length; i += 1) {
    const payload: string = logs[i].textPayload
    if (payload.startsWith('Request body:')) {
      const startIndex = payload.indexOf('{')
      eventBodies.push(JSON.parse(payload.slice(startIndex)))
    }
  }

  console.info('Storing events...')
  await Promise.all(eventBodies.map((body) => parser(body)))

  const { deleteDuplicates } = require('../../bigQuery')
  console.info('Deleting duplicate events...')
  await deleteDuplicates(eventTable)
  console.info('Finished!')
}

processLogs(provider).catch((error) => console.error(error))
