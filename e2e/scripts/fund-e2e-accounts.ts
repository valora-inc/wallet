import { newKitFromWeb3, StableToken } from '@celo/contractkit'
import dotenv from 'dotenv'
import Web3 from 'web3'
import {
  E2E_TEST_FAUCET,
  E2E_TEST_WALLET,
  E2E_TEST_WALLET_SECURE_SEND,
  REFILL_TOKENS,
} from './consts'
import { checkBalance, getBalance } from './utils'

dotenv.config({ path: `${__dirname}/../.env` })

const web3 = new Web3('https://alfajores-forno.celo-testnet.org')
const kit = newKitFromWeb3(web3)
const valoraTestFaucetSecret = process.env['TEST_FAUCET_SECRET']!

;(async () => {
  const walletsToBeFunded = [E2E_TEST_WALLET, E2E_TEST_WALLET_SECURE_SEND]
  const walletBalances = await Promise.all(walletsToBeFunded.map(getBalance))
  for (let i = 0; i < walletsToBeFunded.length; i++) {
    console.log(`Initial balance for ${walletsToBeFunded[i]}:`)
    console.table(walletBalances[i])
  }

  const faucetTokenBalances = (await getBalance(E2E_TEST_FAUCET)) ?? {}
  console.log('Initial faucet balance:')
  console.table(faucetTokenBalances)

  // Connect Valora E2E Test Faucet - Private Key Stored in GitHub Secrets
  kit.connection.addAccount(
    web3.eth.accounts.privateKeyToAccount(valoraTestFaucetSecret.toString()).privateKey
  )

  // Get Token Contract Wrappers
  const celoToken = await kit.contracts.getGoldToken()
  const cusdToken = await kit.contracts.getStableToken()
  const ceurToken = await kit.contracts.getStableToken(StableToken.cEUR)
  const celoExchange = await kit.contracts.getExchange()
  const cusdExchange = await kit.contracts.getExchange(StableToken.cUSD)
  const ceurExchange = await kit.contracts.getExchange(StableToken.cEUR)

  // Balance Faucet
  let totalTokenHoldings = 0 // the absolute number of faucet tokens the faucet is holding
  Object.entries(faucetTokenBalances).forEach(([tokenSymbol, tokenBalance]) => {
    if (REFILL_TOKENS.includes(tokenSymbol)) {
      totalTokenHoldings += tokenBalance
    }
  })
  const targetFaucetTokenBalance = totalTokenHoldings / REFILL_TOKENS.length

  // Ensure that the faucet has enough balance for each refill tokens
  for (const [tokenSymbol, tokenBalance] of Object.entries(faucetTokenBalances)) {
    if (!REFILL_TOKENS.includes(tokenSymbol)) {
      continue
    }

    if (tokenBalance >= targetFaucetTokenBalance) {
      const sellAmount = tokenBalance - targetFaucetTokenBalance
      const amountToExchange = kit.web3.utils.toWei(`${sellAmount}`, 'ether')
      console.log(
        `${tokenSymbol} balance is ${tokenBalance}, which is higher than target ${targetFaucetTokenBalance}. Selling ${sellAmount}.`
      )
      switch (tokenSymbol) {
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
      const buyAmount = targetFaucetTokenBalance - tokenBalance
      const amountToExchange = kit.web3.utils.toWei(`${buyAmount}`, 'ether')
      console.log(
        `${tokenSymbol} balance is ${tokenBalance}, which is lower than target ${targetFaucetTokenBalance}. Buying ${buyAmount}.`
      )
      switch (tokenSymbol) {
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
  const amountToSend = '100'
  const amountToSendWei = web3.utils.toWei(amountToSend, 'ether')

  for (let i = 0; i < walletsToBeFunded.length; i++) {
    const walletAddress = walletsToBeFunded[i]
    const walletBalance = walletBalances[i]
    for (const tokenSymbol of REFILL_TOKENS) {
      if (walletBalance && walletBalance[tokenSymbol] < 200) {
        console.log(`Sending ${amountToSend} ${tokenSymbol} to ${walletAddress}`)
        let tx: any
        switch (tokenSymbol) {
          case 'CELO':
            tx = await celoToken
              .transfer(walletAddress, amountToSendWei)
              .send({ from: E2E_TEST_FAUCET })
            break
          case 'cUSD':
            tx = await cusdToken
              .transfer(walletAddress, amountToSendWei)
              .send({ from: E2E_TEST_FAUCET })
            break
          case 'cEUR':
            tx = await ceurToken
              .transfer(walletAddress, amountToSendWei)
              .send({ from: E2E_TEST_FAUCET })
            break
        }
        const receipt = await tx.waitReceipt()

        console.log(
          `Received tx hash ${receipt.transactionHash} for ${tokenSymbol} transfer to ${walletAddress}`
        )
      }
    }
  }
  console.log('Finished funding wallets.')

  // Log Balances
  console.log('E2E Test Account:', E2E_TEST_WALLET)
  console.table(await getBalance(E2E_TEST_WALLET))
  console.log('E2E Test Account Secure Send:', E2E_TEST_WALLET_SECURE_SEND)
  console.table(await getBalance(E2E_TEST_WALLET_SECURE_SEND))
  console.log('Valora Test Facuet:', E2E_TEST_FAUCET)
  console.table(await getBalance(E2E_TEST_FAUCET))

  await checkBalance(E2E_TEST_WALLET)
  await checkBalance(E2E_TEST_WALLET_SECURE_SEND)
})()
