import { useSelector } from 'react-redux'
import { dappsListSelector } from 'src/dapps/selectors'

export const useIsDappListed = (dappName?: string, dappUrl?: string) => {
  const dappsList = useSelector(dappsListSelector)

  return (
    !!dappName &&
    !!dappUrl &&
    !!dappsList.find(
      (dapp) =>
        dapp.name.toLowerCase() === dappName.toLowerCase() &&
        new URL(dapp.dappUrl).origin === new URL(dappUrl).origin
    )
  )
}
