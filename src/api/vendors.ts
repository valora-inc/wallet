import fetch from 'node-fetch'
import Config from 'react-native-config'

export const fetchAllVendors = async (): Promise<any> =>
  await fetch(`${Config.KOLEKTIVO_CMS_URL}/api/vendors?populate=*`).then((response) =>
    response.json()
  )
