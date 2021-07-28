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

const selectEventParserAndTable = (
  provider: Providers
): undefined | { parser: Function; table: string } => {
  switch (provider) {
    case Providers.Moonpay: {
      return { parser: parseMoonpayEvent, table: MOONPAY_BIG_QUERY_EVENT_TABLE }
    }
    case Providers.Ramp: {
      return { parser: parseRampEvent, table: RAMP_BIG_QUERY_EVENT_TABLE }
    }
    case Providers.Xanpool: {
      return { parser: parseXanpoolEvent, table: XANPOOL_BIG_QUERY_EVENT_TABLE }
    }
    case Providers.Transak: {
      return { parser: parseTransakEvent, table: TRANSAK_BIG_QUERY_EVENT_TABLE }
    }
  }
}

const processLogs = async (provider: Providers) => {
  console.info(`Parsing through ${logs.length} logs`)
  const parserAndTable = selectEventParserAndTable(provider)
  if (!parserAndTable) {
    throw new Error(`No parser and/or table found for provider ${provider}`)
  }

  const { parser, table } = parserAndTable
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
  await deleteDuplicates(table)
  console.info('Done parsing and storing event logs!')
}

processLogs(provider).catch((error) => console.error(error))
