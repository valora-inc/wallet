import { MOONPAY_API_KEY } from 'src/config'

interface IpAddressData {
  alpha2: string
  alpha3: string
  state: string
  ipAddress: string
}

const MoonPay = {
  fetchLocationFromIpAddress: async () => {
    const ipAddressFetchResponse = await fetch(
      `https://api.moonpay.com/v4/ip_address?apiKey=${MOONPAY_API_KEY}`
    )
    const ipAddressObj: IpAddressData = await ipAddressFetchResponse.json()
    return ipAddressObj
  },
}

export default MoonPay
