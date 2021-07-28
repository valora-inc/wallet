import { readFileSync } from 'fs'
import { Providers } from '../Providers'

// Inputs:
const logFilePath = '/Users/tarik/Downloads/transak_logs.json' // Your local log file here
const provider = Providers.Transak // The provider which is getting logs parsed

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
  console.info(`Parsing through ${logs.length} logs`)
  const parser = selectEventParser(provider)
  for (let i = 0; i < logs.length; i += 1) {
    const payload: string = logs[i].textPayload
    if (payload.startsWith('Request body:')) {
      const startIndex = payload.indexOf('{')
      const body = JSON.parse(payload.slice(startIndex))
      await parser(body)
      console.info(`Stored event #${i + 1}`)
    }
  }

  const { deleteDuplicates } = require('../../bigQuery')
  const eventTable = selectEventTable(provider)
  await deleteDuplicates(eventTable)
  console.info('Done parsing and storing event logs!')
}

processLogs(provider).catch((error) => console.error(error))
