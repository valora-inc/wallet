import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

export const useServices = () => {
  const openBidali = () => {
    navigate(Screens.BidaliScreen, {
      currency: undefined,
    })
  }
  return {
    openBidali,
  }
}
