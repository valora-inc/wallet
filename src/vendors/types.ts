export type Coordinates = {
  latitude: string
  longitude: string
}

export type Vendor = {
  title: string
  subtitle?: string
  logoURI: string
  siteURI: string
  description: string
  tags: Array<string>
  currencies: Array<string>
  location: Coordinates
}

export type Vendors = {
  [name: string]: Vendor
}
