import Ajv, { JSONSchemaType } from 'ajv'
import * as functions from 'firebase-functions'
import { IP_API_KEY } from '../config'
import { fetchWithTimeout } from './utils'

export interface UserLocationData {
  countryCodeAlpha2: string | null
  region: string | null
  ipAddress: string | null
}
interface IpAddressData {
  ip: string
  type: string
  continent_code: string
  continent_name: string
  country_code: string
  country_name: string
  region_code: string
  region_name: string
  city: string
  zip: string | null
  latitude: number
  longitude: number
  location: {
    geoname_id: number
    capital: string
    languages: { code: string; name: string; native: string }[]
    country_flag: string
    country_flag_emoji: string
    country_flag_emoji_unicode: string
    calling_code: string
    is_eu: boolean
  }
  time_zone: {
    id: string
    current_time: string
    gmt_offset: number
    code: string
    is_daylight_saving: boolean
  }
  currency: {
    code: string
    name: string
    plural: string
    symbol: string
    symbol_native: string
  }
  connection: {
    asn: number
    isp: string
  }
}

const schema: JSONSchemaType<IpAddressData> = {
  type: 'object',
  properties: {
    ip: { type: 'string' },
    type: { type: 'string' },
    continent_code: { type: 'string' },
    continent_name: { type: 'string' },
    country_code: { type: 'string' },
    country_name: { type: 'string' },
    region_code: { type: 'string' },
    region_name: { type: 'string' },
    city: { type: 'string' },
    zip: { type: 'string', nullable: true },
    latitude: { type: 'number' },
    longitude: { type: 'number' },
    location: {
      type: 'object',
      properties: {
        geoname_id: { type: 'number' },
        capital: { type: 'string' },
        languages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              name: { type: 'string' },
              native: { type: 'string' },
            },
            required: ['code', 'name', 'native'],
          },
        },
        country_flag: { type: 'string' },
        country_flag_emoji: { type: 'string' },
        country_flag_emoji_unicode: { type: 'string' },
        calling_code: { type: 'string' },
        is_eu: { type: 'boolean' },
      },
      required: [
        'geoname_id',
        'capital',
        'languages',
        'country_flag',
        'country_flag_emoji',
        'country_flag_emoji_unicode',
        'calling_code',
        'is_eu',
      ],
    },
    time_zone: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        current_time: { type: 'string' },
        gmt_offset: { type: 'number' },
        code: { type: 'string' },
        is_daylight_saving: { type: 'boolean' },
      },
      required: ['id', 'current_time', 'gmt_offset', 'code', 'is_daylight_saving'],
    },
    currency: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        name: { type: 'string' },
        plural: { type: 'string' },
        symbol: { type: 'string' },
        symbol_native: { type: 'string' },
      },
      required: ['code', 'name', 'plural', 'symbol', 'symbol_native'],
    },
    connection: {
      type: 'object',
      properties: {
        asn: { type: 'number' },
        isp: { type: 'string' },
      },
      required: ['asn', 'isp'],
    },
  },
  required: ['country_code', 'region_code', 'ip'],
}

const ajv = new Ajv()
const validIpApiResponse = ajv.compile(schema)

export const fetchUserLocationData = functions.https.onRequest(async (req, res) => {
  const ipAddress =
    req.headers['x-appengine-user-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress

  const rawResponse = await fetchWithTimeout(
    `http://api.ipapi.com/api/${ipAddress}?access_key=${IP_API_KEY}`
  )

  const response = await rawResponse.json()

  if (!validIpApiResponse(response)) {
    res.status(503).send()
    return
  }

  res.status(200).send(
    JSON.stringify({
      countryCodeAlpha2: response.country_code,
      region: response.region_code,
      ipAddress: response.ip,
    })
  )
})
