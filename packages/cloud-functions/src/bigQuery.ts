import { BigQuery } from '@google-cloud/bigquery'

const gcloudProject = process.env.GCLOUD_PROJECT
export const bigQueryProjectId = 'celo-testnet-production'
export const bigQueryDataset =
  gcloudProject === 'celo-mobile-alfajores' ? 'mobile_wallet_dev' : 'mobile_wallet_production'
const bigQuery = new BigQuery({ projectId: `${bigQueryProjectId}` })

export const trackEvent = async (table: string, row: any) => {
  try {
    if (!gcloudProject) {
      throw new Error('No GCloud Project specified')
    }

    await bigQuery
      .dataset(bigQueryDataset)
      .table(table)
      .insert(row)
      .catch((err) => console.error('Error firing BigQuery event', JSON.stringify(err)))

    return true
  } catch (error) {
    console.error(`Unable to track event in ${table}`, error)
    return false
  }
}

export function getBigQueryInstance() {
  return bigQuery
}
