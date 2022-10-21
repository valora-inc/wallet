import fetch from 'node-fetch'
import config from 'src/geth/networkConfig'

export const fetchAllVendors = async (): Promise<any> =>
  await fetch(
    `${config.vendorServiceUrl}/vendors?populate=*&sort[0]=name&pagination[limit]=-1`
  ).then((response) => response.json())
