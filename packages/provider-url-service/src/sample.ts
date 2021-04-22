const fetch = require('node-fetch')

const fetchIpAddress = async () => {
  const ipAddressPromise = await fetch('https://api64.ipify.org?format=json')
  const ipAddress = await ipAddressPromise.json()
  console.log(ipAddress)
  return ipAddress
}

fetchIpAddress()
