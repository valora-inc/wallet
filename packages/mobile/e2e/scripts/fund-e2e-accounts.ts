const Web3 = require('web3')
const ContractKit = require('@celo/contractkit')
const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

// Constants
const valoraE2ETestWallet = '0x6131a6d616a4be3737b38988847270a64bc10caa'
const valoraTestFaucet = '0xe5F5363e31351C38ac82DBAdeaD91Fd5a7B08846'
const valoraTestFaucetSecret = process.env.TEST_FAUCET_SECRET

// Init a new kit, connected to the alfajores testnet
const web3 = new Web3('https://alfajores-forno.celo-testnet.org')
const kit = ContractKit.newKitFromWeb3(web3)

// Default e2e address to lookup
const getBalance = async (address = valoraE2ETestWallet) => {
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

;(async () => {
  // Get E2E Test Wallet Balance & Valora Faucet Balance
  const receivingBalance = await getBalance()
  const sendingBalance = await getBalance(valoraTestFaucet)

  // Connect Valora E2E Test Faucet - Private Key Stored in GitHub Secrets
  kit.connection.addAccount(
    web3.eth.accounts.privateKeyToAccount(valoraTestFaucetSecret).privateKey
  )

  // Get Token Contract Wrappers
  let goldtoken = await kit.contracts.getGoldToken()
  let cUSDtoken = await kit.contracts.getStableToken()
  let cEURtoken = await kit.contracts.getStableToken('cEUR')

  // Set Amount To Send
  let amount = web3.utils.toWei('25', 'ether')

  // Loop through E2E Test Wallet Balance Object
  for (const coin in receivingBalance) {
    let tx
    // Add funds if balance is less than 100 add 25
    if (receivingBalance[coin] < 100 && sendingBalance[coin] > 25) {
      switch (coin) {
        case 'CELO':
          tx = await goldtoken
            .transfer(valoraE2ETestWallet, amount)
            .send({ from: valoraTestFaucet })
          break
        case 'cUSD':
          tx = await cUSDtoken
            .transfer(valoraE2ETestWallet, amount)
            .send({ from: valoraTestFaucet })
          break
        case 'cEUR':
          tx = await cEURtoken
            .transfer(valoraE2ETestWallet, amount)
            .send({ from: valoraTestFaucet })
          break
      }
      // Wait for the transactions to be processed
      let receipt = await tx.waitReceipt()

      // Print Receipt
      console.log(' Transaction receipt: %o', receipt)
    }
  }

  // Log Balances
  console.log('E2E Test Account')
  console.table(await getBalance())
  console.log('Valora Test Facuet')
  console.table(await getBalance(valoraTestFaucet))
})()
