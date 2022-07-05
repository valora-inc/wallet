import Logo from 'src/icons/Logo'
import SwapInput from 'src/icons/SwapInput'
import { Screens } from 'src/navigator/Screens'

export const CoreServices = [
  {
    title: 'servicesList.swap',
    icon: SwapInput,
    screen: Screens.Swap,
  },
  {
    title: 'servicesList.vendors',
    icon: Logo,
    screen: Screens.VendorsScreen,
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
