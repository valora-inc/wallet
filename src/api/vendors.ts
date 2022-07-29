import fetch from 'node-fetch'
import Config from 'react-native-config'
import Logger from 'src/utils/Logger'

export const getVendors = async (): Promise<any> => {
  try {
    const response = await fetch(`${Config.KOLEKTIVO_CMS_URL}/api/vendors?populate=*`)
    return await response.json()
  } catch (e) {
    Logger.error('Error', `${e}`)
  }
}
