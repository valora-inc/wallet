import { LatLng, Region } from 'react-native-maps'
import Skerpene from 'src/map/forests/skerpene.json'
import Organic from 'src/map/forests/organic.json'
import Hofinan from 'src/map/forests/hofinan.json'

export const BASE_TAG = 'MapScreen'

export enum MapCategory {
  All = 'All',
  Vendor = 'Vendor',
  FoodForest = 'FoodForest',
}

export const LOCALE_LATLNG: LatLng = {
  latitude: 12.1696,
  longitude: -68.99,
}

export const LOCALE_OFFSET: Omit<Region, 'longitude' | 'latitude'> = {
  latitudeDelta: 0.1922,
  longitudeDelta: 0.1421,
}

export const LOCALE_REGION: Region = { ...LOCALE_LATLNG, ...LOCALE_OFFSET }

export const GMAP_STYLE = [
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    featureType: 'poi',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    featureType: 'transit',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
]

export const FoodForest = {
  Skerpene: Skerpene,
  Hofinan: Hofinan,
  Organic: Organic,
}
