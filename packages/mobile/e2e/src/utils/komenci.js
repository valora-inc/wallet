import { KOMENCI_CHECK_URI } from './consts'

const axios = require('axios').default

export async function checkKomenci() {
  try {
    const response = await axios.get(KOMENCI_CHECK_URI)
    if (response && response.data.status === 'Ready') {
      return true
    } else {
      return false
    }
  } catch (error) {
    console.error(error)
  }
}
