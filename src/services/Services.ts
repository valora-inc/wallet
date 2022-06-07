import Logo from 'src/icons/Logo'
import SwapInput from 'src/icons/SwapInput'
import { Screens } from 'src/navigator/Screens'

export const CoreServices = [
  {
    title: 'servicesList.buy',
    icon: Logo,
    screen: Screens.Swap,
  },
  {
    title: 'servicesList.cico',
    icon: Logo,
    screen: Screens.Swap,
  },
  {
    title: 'servicesList.swap',
    icon: SwapInput,
    screen: Screens.Swap,
  },
  {
    title: 'servicesList.invest',
    icon: Logo,
    screen: Screens.Swap,
  },
  {
    title: 'servicesList.bills',
    icon: Logo,
    screen: Screens.Swap,
  },
  {
    title: 'servicesList.vendors',
    icon: Logo,
    screen: Screens.VendorsScreen,
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
