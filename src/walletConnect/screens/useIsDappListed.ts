import { useSelector } from 'react-redux'
import { dappsListSelector } from 'src/dapps/selectors'
import { WalletConnectDisplayedInfo } from 'src/walletConnect/v1/reducer'
import { walletConnectDisplayedInfoSelector } from 'src/walletConnect/v1/selectors'

export const useIsDappListed = (dappName?: string) => {
  const dappsList = useSelector(dappsListSelector)
  const walletConnectDisplayedInfo = useSelector(walletConnectDisplayedInfoSelector)

  return (
    walletConnectDisplayedInfo === WalletConnectDisplayedInfo.None ||
    (!!dappName && !!dappsList.find((dapp) => dapp.name.toLowerCase() === dappName.toLowerCase()))
  )
}
