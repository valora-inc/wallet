import { useSelector } from 'react-redux'
import { dappsListSelector } from 'src/dapps/selectors'

export const useIsDappListed = (dappUrl?: string) => {
  const dappsList = useSelector(dappsListSelector)

  return (
    !!dappUrl &&
    !!dappsList.find((dapp) => new URL(dapp.dappUrl).origin === new URL(dappUrl).origin)
  )
}
