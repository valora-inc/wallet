import { LatLng } from 'react-native-maps'
import { Vendor } from 'src/vendors/types'

export type FoodForest = Vendor & {
  data?: any
  ingress?: LatLng
  start?: number
  area?: string
}

export type FoodForests = {
  [name: string]: FoodForest
}
