import { useSelector } from 'react-redux'
import { dappConnectInfoSelector, dappsListSelector } from 'src/dapps/selectors'
import { DappConnectInfo } from 'src/dapps/slice'

export const useIsDappListed = (dappName?: string, dappUrl?: string) => {
  const dappsList = useSelector(dappsListSelector)
  const dappConnectInfo = useSelector(dappConnectInfoSelector)

  return (
    dappConnectInfo === DappConnectInfo.None ||
    (!!dappName &&
      !!dappUrl &&
      !!dappsList.find(
        (dapp) =>
          dapp.name.toLowerCase() === dappName.toLowerCase() &&
          new URL(dapp.dappUrl).origin === new URL(dappUrl).origin
      ))
  )
}
