import { dappsListSelector } from 'src/dapps/selectors'
import { useSelector } from 'src/redux/hooks'

export const useIsDappListed = (dappUrl?: string) => {
  const dappsList = useSelector(dappsListSelector)

  if (!dappUrl) {
    return false
  }

  let dappOrigin = ''
  try {
    dappOrigin = new URL(dappUrl).origin
  } catch {
    // do nothing and return if the dappUrl is invalid
    return false
  }

  return !!dappsList.find((dapp) => new URL(dapp.dappUrl).origin === dappOrigin)
}
