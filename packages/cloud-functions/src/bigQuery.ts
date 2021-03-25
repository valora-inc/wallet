import { BigQuery } from '@google-cloud/bigquery'
import { ENVIRONMENT } from './config'

const projectId = 'celo-testnet-production'
const dataset = 'mobile_wallet_production'
const bigQuery = new BigQuery({ projectId: `${projectId}` })

export function trackEvent(table: string, row: any) {
  if (ENVIRONMENT?.toLowerCase() !== 'mainnet') {
    return
  }
  bigQuery
    .dataset(dataset)
    .table(table)
    .insert(row)
    .catch((err) => console.error('Error firing BigQuery event', JSON.stringify(err)))
}
