import { MOONPAY_API_KEY } from 'src/config'

export interface MoonPayIpAddressData {
  alpha2: string
  alpha3: string
  state: string
  ipAddress: string
}

const MoonPay = {
  fetchUserLocationData: async () => {
    const ipAddressFetchResponse = await fetch(
      `https://api.moonpay.com/v4/ip_address?apiKey=${MOONPAY_API_KEY}`
    )
    const ipAddressObj: MoonPayIpAddressData = await ipAddressFetchResponse.json()
    return ipAddressObj
  },
}

export default MoonPay
