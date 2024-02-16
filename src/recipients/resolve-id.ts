import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'recipient/resolve-id'

export async function resolveId(id: string) {
  if (id === '') {
    return null
  }
  const resolveIdUrl = networkConfig.resolveId
  try {
    const response = await fetch(`${resolveIdUrl}?id=${encodeURIComponent(id)}`)
    if (response.ok) {
      return await response.json()
    }
    Logger.warn(TAG, `Unexpected result from resolving '${id}'`)
  } catch (error) {
    Logger.warn(TAG, `Error resolving '${id}'`, error)
  }
  return null
}
