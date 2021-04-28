import { BigQuery } from '@google-cloud/bigquery'

const gcloudProject = process.env.GCLOUD_PROJECT
const bigQueryProjectId = 'celo-testnet-production'
const bigQueryDataset =
  gcloudProject === 'celo-mobile-alfajores' ? 'mobile_wallet_dev' : 'mobile_wallet_production'
const bigQuery = new BigQuery({ projectId: `${bigQueryProjectId}` })

export function trackEvent(table: string, row: any) {
  if (!gcloudProject) {
    return
  }
  bigQuery
    .dataset(bigQueryDataset)
    .table(table)
    .insert(row)
    .catch((err) => console.error('Error firing BigQuery event', JSON.stringify(err)))
}

export function getBigQueryInstance() {
  return bigQuery
}
