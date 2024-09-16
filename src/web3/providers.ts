import Logger from 'src/utils/Logger'
import Web3 from 'web3'

const TAG = 'web3/providers'

export function getHttpProvider(url: string) {
  Logger.debug(TAG, 'creating HttpProvider...')
  const httpProvider = new Web3.providers.HttpProvider(url)
  Logger.debug(TAG, 'created HttpProvider')
  // In the future, we might decide to over-ride the error handler via the following code.
  // provider.on('error', () => {
  //   Logger.showError('Error occurred')
  // })
  return httpProvider
}
