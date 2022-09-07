import fetch from 'node-fetch'
import config from 'src/geth/networkConfig'

export const fetchAllVendors = async (): Promise<any> =>
  await fetch(`${config.vendorServiceUrl}/vendors?populate=*`).then((response) => response.json())
