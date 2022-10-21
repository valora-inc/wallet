import { LatLng } from 'react-native-maps'

export type Vendor = {
  title: string
  subtitle?: string
  logoURI: string
  siteURI: string
  description: string
  tags: Array<string>
  currencies: Array<string>
  address?: string
  phoneNumber?: string
  acceptsGuilder?: boolean
  providesGuilder?: boolean
  street: string
  building_number: string
  city: string
  account?: string
}

export type VendorWithLocation = Vendor & {
  location: LatLng
}

export type Vendors = {
  [name: string]: Vendor | VendorWithLocation
}
