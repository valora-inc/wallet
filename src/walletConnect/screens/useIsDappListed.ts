import { useSelector } from 'react-redux'
import { dappsListSelector } from 'src/dapps/selectors'

export const useIsDappListed = (dappName?: string) => {
  const dappsList = useSelector(dappsListSelector)

  return (
    !!dappName && !!dappsList.find((dapp) => dapp.name.toLowerCase() === dappName.toLowerCase())
  )
}
