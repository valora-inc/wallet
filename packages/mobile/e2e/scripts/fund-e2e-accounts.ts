var utils = require('./utils.ts')
var consts = require('./consts.ts')

utils.dotenv.config({ path: '../.env' })

const valoraTestFaucetSecret = process.env.TEST_FAUCET_SECRET

;(async () => {
  // Get E2E Test Wallet Balance & Valora Faucet Balance
  const receivingBalance = await utils.getBalance()
  const sendingBalance = await utils.getBalance(consts.E2E_TEST_FAUCET)

  // Connect Valora E2E Test Faucet - Private Key Stored in GitHub Secrets
  utils.kit.connection.addAccount(
    utils.web3.eth.accounts.privateKeyToAccount(valoraTestFaucetSecret).privateKey
  )

  // Get Token Contract Wrappers
  let goldtoken = await utils.kit.contracts.getGoldToken()
  let cUSDtoken = await utils.kit.contracts.getStableToken()
  let cEURtoken = await utils.kit.contracts.getStableToken('cEUR')

  // Set Amount To Send
  let amount = utils.web3.utils.toWei('25', 'ether')

  // Loop through E2E Test Wallet Balance Object
  for (const coin in receivingBalance) {
    let tx
    // Add funds if balance is less than 100 add 25
    if (receivingBalance[coin] < 100 && sendingBalance[coin] > 25) {
      switch (coin) {
        case 'CELO':
          tx = await goldtoken
            .transfer(consts.E2E_TEST_WALLET, amount)
            .send({ from: consts.E2E_TEST_FAUCET })
          break
        case 'cUSD':
          tx = await cUSDtoken
            .transfer(consts.E2E_TEST_WALLET, amount)
            .send({ from: consts.E2E_TEST_FAUCET })
          break
        case 'cEUR':
          tx = await cEURtoken
            .transfer(consts.E2E_TEST_WALLET, amount)
            .send({ from: consts.E2E_TEST_FAUCET })
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
  console.table(await utils.getBalance())
  console.log('Valora Test Facuet')
  console.table(await utils.getBalance(consts.E2E_TEST_FAUCET))
  await utils.balanceError()
})()
