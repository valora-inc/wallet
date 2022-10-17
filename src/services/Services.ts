import { Dapp } from 'src/app/types'
import MobileTopUp from 'src/icons/MobileTopUp'
import Swap from 'src/icons/Swap'
import { Screens } from 'src/navigator/Screens'

export const ServiceDapps: Dapp[] = [
  {
    id: 'symmetric-dex',
    categoryId: 'swap',
    iconUrl: '',
    name: 'Symmetric DEX',
    description: 'Swap assets for other assets on the CELO network.',
    dappUrl: 'https://celo.symm.fi/',
    isFeatured: false,
  },
  {
    id: 'mobile-bidali',
    categoryId: 'spend',
    iconUrl: '',
    name: 'Bidali',
    description: 'Buy mobile top-ups using the CELO network.',
    dappUrl: 'https://giftcards.bidali.com/buy/curacao/',
    isFeatured: false,
  },
]

export const CoreServices = [
  {
    title: 'servicesList.swap',
    icon: Swap,
    dapp: ServiceDapps[0],
  },
  {
    title: 'servicesList.mobileTopUp',
    icon: MobileTopUp,
    screen: Screens.BidaliScreen,
  },
]

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
