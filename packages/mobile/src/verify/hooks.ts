import { useAsync } from 'react-async-hook'
import networkConfig from 'src/geth/networkConfig'

export function useAsyncKomenciAvailable() {
  return useAsync<boolean>(async () => {
    const response = await fetch(networkConfig.komenciLoadCheckEndpoint)
    return response.json()
  }, [])
}
