import * as functions from 'firebase-functions'
import { FETCH_TIMEOUT_DURATION, IP_API_KEY } from '../config'
import { fetchWithTimeout } from './utils'

// REMINDER: Check if property name changes are backwards compatible...probably will be fine given
// we are moving location check to server-side
export interface UserLocationData {
  countryCodeAlpha2: string | null
  region: string | null
  ipAddress: string | null
}

interface IpAddressData {
  ip: string
  version: string
  city: string
  region: string
  region_code: string
  country: string
  country_name: string
  country_code: string
  country_code_iso3: string
  country_capital: string
  country_tld: string
  continent_code: string
  in_eu: boolean
  postal: number
  latitude: number
  longitude: number
  timezone: string
  utc_offset: number
  country_calling_code: string
  currency: string
  currency_name: string
  languages: string
  country_area: number
  country_population: number
  asn: string
  org: string
}

export const fetchUserLocationData = functions.https.onRequest(async (req, res) => {
  const ipAddress =
    req.headers['x-appengine-user-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress

  const response = await fetchWithTimeout(
    `http://api.ipapi.com/api/${ipAddress}?access_key=${IP_API_KEY}`,
    null,
    FETCH_TIMEOUT_DURATION
  )

  const ipAddressData: IpAddressData = await response?.json()
  const { country_code, region_code, ip } = ipAddressData
  const userLocationData: UserLocationData = {
    countryCodeAlpha2: country_code,
    region: region_code,
    ipAddress: ip,
  }
  res.send(JSON.stringify(userLocationData))
})
