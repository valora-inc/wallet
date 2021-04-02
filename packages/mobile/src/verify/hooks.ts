import { useAsync } from 'react-async-hook'
import networkConfig from 'src/geth/networkConfig'
import Logger from 'src/utils/Logger'

const TAG = 'verify/hooks'

export function useAsyncKomenciAvailable() {
  return useAsync<boolean>(async () => {
    Logger.info(TAG, 'Determining komenci readiness...')
    const response = await fetch(networkConfig.komenciLoadCheckEndpoint)
    const isReady = response.ok // status in the range 200-299
    Logger.info(TAG, `Komenci isReady=${isReady} (statusCode=${response.status})`)
    return isReady
  }, [])
}
