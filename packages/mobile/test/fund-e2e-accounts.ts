const Web3 = require('web3')
const ContractKit = require('@celo/contractkit')

// Init a new kit, connected to the alfajores testnet
const web3 = new Web3('https://alfajores-forno.celo-testnet.org')
const kit = ContractKit.newKitFromWeb3(web3)

// Default e2e address to lookup
const getBalance = async (address = '0x6131a6d616a4be3737b38988847270a64bc10caa') => {
  try {
    let balanceObj = {}

    // Get Balances
    let balances = await kit.celoTokens.balancesOf(address)

    // Convert and add to balance object
    for (const value in balances) {
      balanceObj[`${value}`] = balances[`${value}`] / 10 ** 18
    }

    // Return balance object
    return balanceObj
  } catch (err) {
    console.warn(err)
  }
}

;(async () => {
  const balance = await getBalance()
  for (const value in balance) {
    // Add funds if balance is less than 200
    if (balance[value] < 200) {
      // TODO use web3 to send funds from alfajores faucet
    }
  }
  // Log Balances
  console.log('Test Account Funds: ', await getBalance())
})()
