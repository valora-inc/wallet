import { E2E_TEST_FAUCET, E2E_TEST_WALLET } from './consts'
import { balanceError, dotenv, getBalance, kit, web3 } from './utils'
dotenv.config({ path: `${__dirname}/../.env` })

const valoraTestFaucetSecret = process.env['TEST_FAUCET_SECRET']!
;(async () => {
  // Get E2E Test Wallet Balance & Valora Faucet Balance
  const receivingBalance = await getBalance()
  const sendingBalance = (await getBalance(E2E_TEST_FAUCET)) ?? {}
  console.table(await getBalance(E2E_TEST_FAUCET))

  // Connect Valora E2E Test Faucet - Private Key Stored in GitHub Secrets
  kit.connection.addAccount(
    web3.eth.accounts.privateKeyToAccount(valoraTestFaucetSecret.toString()).privateKey
  )

  // Get Token Contract Wrappers
  const celoToken = await kit.contracts.getGoldToken()
  const cusdToken = await kit.contracts.getStableToken()
  const ceurToken = await kit.contracts.getStableToken('cEUR')
  const celoExchange = await kit.contracts.getExchange()
  const cusdExchange = await kit.contracts.getExchange('cUSD')
  const ceurExchange = await kit.contracts.getExchange('cEUR')

  // Balance Faucet
  let balances = await getBalance(E2E_TEST_FAUCET)
  let sum = 0
  const numOfTokens = 3 // Object.keys(balances).length
  for (let balance in balances) {
    console.log(balances[balance])
    sum += balances[balance]
  }

  for (let balance in balances) {
    const target = sum / numOfTokens
    if (balances[balance] >= sum / numOfTokens) {
      const toSell = balances[balance] - target
      console.log(toSell)
      const amountToExchange = kit.web3.utils.toWei(`${toSell}`, 'ether')
      console.log(`${balance} balance higher than ${sum / numOfTokens}`)
      switch (balance) {
        case 'CELO':
          try {
            const celoApproveTx = await celoToken
              .approve(celoExchange.address, amountToExchange)
              .send({ from: E2E_TEST_FAUCET })
            await celoApproveTx.waitReceipt()
            const celoSellAmount = await celoExchange.quoteGoldSell(amountToExchange)
            const celoSellTx = await celoExchange
              .sellGold(amountToExchange, celoSellAmount)
              .send({ from: E2E_TEST_FAUCET })
            await celoSellTx.waitReceipt()
          } catch (err) {
            console.log('Failed to sell CELO', err)
          } finally {
            break
          }
        case 'cUSD':
          try {
            const cusdApproveTx = await cusdToken
              .approve(cusdExchange.address, amountToExchange)
              .send({ from: E2E_TEST_FAUCET })
            await cusdApproveTx.waitReceipt()
            const cusdSellAmount = await cusdExchange.quoteStableSell(amountToExchange)
            const cusdSellTx = await cusdExchange
              .sellStable(amountToExchange, cusdSellAmount)
              .send({ from: E2E_TEST_FAUCET })
            await cusdSellTx.waitReceipt()
          } catch (err) {
            console.log('Failed to sell cUSD', err)
          } finally {
            break
          }
        case 'cEUR':
          try {
            const ceurApproveTx = await ceurToken
              .approve(ceurExchange.address, amountToExchange)
              .send({ from: E2E_TEST_FAUCET })
            await ceurApproveTx.waitReceipt()
            const ceurSellAmount = await ceurExchange.quoteStableSell(amountToExchange)
            const ceurSellTx = await ceurExchange
              .sellStable(amountToExchange, ceurSellAmount)
              .send({ from: E2E_TEST_FAUCET })
            await ceurSellTx.waitReceipt()
          } catch (err) {
            console.log('Failed to sell cEUR', err)
          } finally {
            break
          }
      }
    } else {
      const toBuy = target - balances[balance]
      const amountToExchange = kit.web3.utils.toWei(`${toBuy}`, 'ether')
      console.log(`${balance} balance lower than ${sum / numOfTokens}`)
      switch (balance) {
        case 'CELO':
          try {
            const celoApproveTx = await celoToken
              .approve(cusdExchange.address, amountToExchange)
              .send({ from: E2E_TEST_FAUCET })
            await celoApproveTx.waitReceipt()
            const celoBuyAmount = await celoExchange.quoteGoldBuy(amountToExchange)
            const celoBuyTx = await celoExchange
              .buyGold(amountToExchange, celoBuyAmount)
              .send({ from: E2E_TEST_FAUCET })
            await celoBuyTx.waitReceipt()
          } catch (err) {
            console.log('Failed to buy CELO', err)
          } finally {
            break
          }
        case 'cUSD':
          try {
            const cusdApproveTx = await celoToken
              .approve(cusdExchange.address, amountToExchange)
              .send({ from: E2E_TEST_FAUCET })
            await cusdApproveTx.waitReceipt()
            const cusdBuyAmount = await cusdExchange.quoteStableBuy(amountToExchange)
            const cusdBuyTx = await cusdExchange
              .buyStable(amountToExchange, cusdBuyAmount)
              .send({ from: E2E_TEST_FAUCET })
            await cusdBuyTx.waitReceipt()
          } catch (err) {
            console.log('Failed to buy cUSD', err)
          } finally {
            break
          }
        case 'cEUR':
          try {
            const ceurApproveTx = await celoToken
              .approve(ceurExchange.address, amountToExchange)
              .send({ from: E2E_TEST_FAUCET })
            await ceurApproveTx.waitReceipt()
            const ceurBuyAmount = await ceurExchange.quoteStableBuy(amountToExchange)
            const ceurBuyTx = await ceurExchange
              .buyStable(amountToExchange, ceurBuyAmount)
              .send({ from: E2E_TEST_FAUCET })
            await ceurBuyTx.waitReceipt()
          } catch (err) {
            console.log('Failed to buy cEUR', err)
          } finally {
            break
          }
      }
    }
  }

  // Set Amount To Send
  let amountToSend = web3.utils.toWei('100', 'ether')

  // Loop through E2E Test Wallet Balance Object
  for (const coin in receivingBalance) {
    let tx
    // Add funds if balance is less than 100 add 100
    if (receivingBalance[coin] < 100 && sendingBalance[coin] > 100) {
      switch (coin) {
        case 'CELO':
          tx = await celoToken
            .transfer(E2E_TEST_WALLET, amountToSend)
            .send({ from: E2E_TEST_FAUCET })
          break
        case 'cUSD':
          tx = await cusdToken
            .transfer(E2E_TEST_WALLET, amountToSend)
            .send({ from: E2E_TEST_FAUCET })
          break
        case 'cEUR':
          tx = await ceurToken
            .transfer(E2E_TEST_WALLET, amountToSend)
            .send({ from: E2E_TEST_FAUCET })
          break
      }
      // Wait for the transactions to be processed
      let receipt = await tx.waitReceipt()

      // Print Receipt
      console.log(' Transaction receipt: %o', receipt)
    }
  }

  // Log Balances
  console.log('E2E Test Account:', E2E_TEST_WALLET)
  console.table(await getBalance())
  console.log('Valora Test Facuet:', E2E_TEST_FAUCET)
  console.table(await getBalance(E2E_TEST_FAUCET))
  await balanceError()
})()
