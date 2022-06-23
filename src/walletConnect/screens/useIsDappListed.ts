import { useSelector } from 'react-redux'
import { dappConnectInfoSelector, dappsListSelector } from 'src/dapps/selectors'
import { DappConnectInfo } from 'src/dapps/types'

export const useIsDappListed = (dappUrl?: string) => {
  const dappsList = useSelector(dappsListSelector)
  const dappConnectInfo = useSelector(dappConnectInfoSelector)

  return (
    dappConnectInfo === DappConnectInfo.None ||
    (!!dappUrl &&
      !!dappsList.find((dapp) => new URL(dapp.dappUrl).origin === new URL(dappUrl).origin))
  )
}
