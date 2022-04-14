const Web3 = require('web3')
const ContractKit = require('@celo/contractkit')
const dotenv = require('dotenv')
const web3 = new Web3('https://alfajores-forno.celo-testnet.org')
const kit = ContractKit.newKitFromWeb3(web3)
var consts = require('./consts.ts')
const balanceError = async (address = consts.E2E_TEST_WALLET, minBalance = 10) => {
  let balanceObject = await getBalance(address)
  for (const balance in balanceObject) {
    if (balanceObject[balance] < minBalance) {
      throw new Error(
        `${balance} balance of ${address} is below ${minBalance}. Please refill from the faucet https://celo.org/developers/faucet 🙏`
      )
    }
  }
}
const getBalance = async (address = consts.E2E_TEST_WALLET) => {
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
    console.log(err)
  }
}

module.exports = {
  Web3: Web3,
  ContractKit: ContractKit,
  dotenv: dotenv,
  web3: web3,
  kit: kit,
  balanceError: balanceError,
  getBalance: getBalance,
}
