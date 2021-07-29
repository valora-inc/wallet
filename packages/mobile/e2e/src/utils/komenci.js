const axios = require('axios').default

export async function checkKomenci() {
  try {
    const response = await axios.get('https://staging-komenci.azurefd.net/v1/ready')
    if (response && response.data.status === 'Ready') {
      return true
    } else {
      return false
    }
  } catch (error) {
    console.error(error)
  }
}
