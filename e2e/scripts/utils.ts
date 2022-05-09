export const Web3 = require('web3')
export const ContractKit = require('@celo/contractkit')
export const dotenv = require('dotenv')
export const web3 = new Web3('https://alfajores-forno.celo-testnet.org')
export const kit = ContractKit.newKitFromWeb3(web3)

export async function checkBalance(address: string, minBalance = 10) {
  let balanceObject = await getBalance(address)
  for (const balance in balanceObject) {
    if (balanceObject[balance as keyof typeof balanceObject] < minBalance) {
      throw new Error(
        `${balance} balance of ${address} is below ${minBalance}. Please refill from the faucet https://celo.org/developers/faucet or run ./fund-e2e-accounts.ts if a Valora Dev.`
      )
    }
  }
}

export async function getBalance(address: string) {
  try {
    const balanceObj: Record<string, number> = {}
    // Get Balances
    let balances = await kit.celoTokens.balancesOf(address)
    // Convert and add to balance object
    for (const value in balances) {
      balanceObj[value] = balances[value] / 10 ** 18
    }
    // Return balance object
    return balanceObj
  } catch (err) {
    console.log(err)
  }
}
