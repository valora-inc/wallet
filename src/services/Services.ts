import WalletHome from 'src/home/WalletHome'
import Gift from 'src/icons/Gift'

export const CoreServices = [
  {
    title: 'servicesList.buy',
    icon: Gift,
    component: WalletHome,
  },
  {
    title: 'servicesList.cico',
    icon: Gift,
    component: WalletHome,
  },
  {
    title: 'servicesList.swap',
    icon: Gift,
    component: WalletHome,
  },
  {
    title: 'servicesList.invest',
    icon: Gift,
    component: WalletHome,
  },
  {
    title: 'servicesList.bills',
    icon: Gift,
    component: WalletHome,
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
