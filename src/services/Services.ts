import RewardIcon from 'src/icons/RewardIcon'
import SwapInput from 'src/icons/SwapInput'
import { Screens } from 'src/navigator/Screens'

export const CoreServices = [
  {
    title: 'servicesList.buy',
    icon: RewardIcon,
    screen: Screens.Swap,
  },
  {
    title: 'servicesList.cico',
    icon: RewardIcon,
    screen: Screens.Swap,
  },
  {
    title: 'servicesList.swap',
    icon: SwapInput,
    screen: Screens.Swap,
  },
  {
    title: 'servicesList.invest',
    icon: RewardIcon,
    screen: Screens.Swap,
  },
  {
    title: 'servicesList.bills',
    icon: RewardIcon,
    screen: Screens.Swap,
  },
  // {
  //   title: 'serviceCICO',
  //   icon: null,
  //   component: null,
  // },
  // {
  //   title: 'serviceSwap',
  //   icon: null,
  //   component: null,
  // },
  // {
  //   title: 'serviceInvest',
  //   icon: null,
  //   component: null,
  // },
]

// @note This solution is not scalable to countries
// since it does not determine which phone provicers
// and supporting vendors exist in your locale.
export const BusinessServices = [
  {
    title: 'serviceBills',
    icon: null,
    component: null,
  },
  {
    title: 'serviceChippie',
    icon: null,
    component: null,
  },
  {
    title: 'serviceDigicel',
    icon: null,
    component: null,
  },
  {
    title: 'serviceEsperamos',
    icon: null,
    component: null,
  },
]
