import { Mento } from '@mento-protocol/mento-sdk'
import dotenv from 'dotenv'
// Would be nice to use viem, but mento is using ethers
import { utils, Wallet } from 'ethers'
import { Address } from 'viem'
import {
  CELO,
  CUSD,
  E2E_TEST_FAUCET,
  E2E_TEST_WALLET,
  E2E_TEST_WALLET_SECURE_SEND,
  provider,
  REFILL_TOKENS,
  TOKENS_BY_SYMBOL,
} from './consts'
import { Token } from './types'
import { checkBalance, getCeloTokensBalance, transferToken } from './utils'

dotenv.config({ path: `${__dirname}/../.env` })

const valoraTestFaucetSecret = process.env['E2E_TEST_FAUCET_SECRET']!

;(async () => {
  const walletsToBeFunded: Address[] = [E2E_TEST_WALLET, E2E_TEST_WALLET_SECURE_SEND]
  const walletBalances = await Promise.all(walletsToBeFunded.map(getCeloTokensBalance))
  for (let i = 0; i < walletsToBeFunded.length; i++) {
    console.log(`Initial balance for ${walletsToBeFunded[i]}:`)
    console.table(walletBalances[i])
  }

  const faucetTokenBalances = (await getCeloTokensBalance(E2E_TEST_FAUCET)) ?? {}
  console.log(`Initial balance for faucet at: ${E2E_TEST_FAUCET}:`)
  console.table(faucetTokenBalances)

  // Connect Valora E2E Test Faucet - Private Key Stored in GitHub Secrets
  const signer = new Wallet(valoraTestFaucetSecret, provider)
  const mento = await Mento.create(signer)

  // Balance Faucet
  let totalTokenHoldings = 0 // the absolute number of faucet tokens the faucet is holding
  Object.entries(faucetTokenBalances).forEach(([tokenSymbol, tokenBalance]) => {
    if (REFILL_TOKENS.includes(tokenSymbol)) {
      totalTokenHoldings += tokenBalance
    }
  })
  const targetFaucetTokenBalance = totalTokenHoldings / REFILL_TOKENS.length

  async function swapSell(
    sellToken: Token,
    buyToken: Token,
    sellAmount: number, // in decimal
    maxSlippagePercent: number
  ) {
    try {
      const sellAmountInSmallestUnit = utils.parseUnits(sellAmount.toString(), sellToken.decimals)
      const quoteAmountOut = await mento.getAmountOut(
        sellToken.address,
        buyToken.address,
        sellAmountInSmallestUnit
      )
      console.log(
        `Selling ${sellAmount} ${sellToken.symbol} for ~${utils.formatUnits(
          quoteAmountOut,
          buyToken.decimals
        )} ${buyToken.symbol} with max slippage of ${maxSlippagePercent}%.`
      )
      const allowanceTxObj = await mento.increaseTradingAllowance(
        sellToken.address,
        sellAmountInSmallestUnit
      )
      const allowanceTx = await signer.sendTransaction(allowanceTxObj)
      const allowanceReceipt = await allowanceTx.wait()
      console.log(
        `Received allowance tx hash ${allowanceReceipt.transactionHash} with status ${allowanceReceipt.status}`
      )
      // allow maxSlippagePercent from quote
      const amountOutMin = quoteAmountOut.mul(100 - maxSlippagePercent).div(100)
      const swapTxObj = await mento.swapIn(
        sellToken.address,
        buyToken.address,
        sellAmountInSmallestUnit,
        amountOutMin
      )
      const swapTx = await signer.sendTransaction(swapTxObj)
      const swapTxReceipt = await swapTx.wait()
      console.log(
        `Received swap tx hash ${swapTxReceipt.transactionHash} with status ${swapTxReceipt.status}`
      )
      if (swapTxReceipt.status !== 1) {
        throw new Error(`Swap reverted. Tx hash: ${swapTxReceipt.transactionHash}`)
      }
    } catch (err) {
      console.log(`Failed to sell ${sellToken.symbol} for ${buyToken.symbol}`, err)
    }
  }

  async function swapBuy(
    sellToken: Token,
    buyToken: Token,
    buyAmount: number, // in decimal
    maxSlippagePercent: number
  ) {
    try {
      const buyAmountInSmallestUnit = utils.parseUnits(buyAmount.toString(), buyToken.decimals)
      const quoteAmountIn = await mento.getAmountIn(
        sellToken.address,
        buyToken.address,
        buyAmountInSmallestUnit
      )
      console.log(
        `Buying ${buyAmount} ${buyToken.symbol} with ~${utils.formatUnits(quoteAmountIn, sellToken.decimals)} ${sellToken.symbol} with max slippage of ${maxSlippagePercent}%.`
      )
      // allow maxSlippagePercent from quote
      const amountInMax = quoteAmountIn.mul(100 + maxSlippagePercent).div(100)
      const allowanceTxObj = await mento.increaseTradingAllowance(sellToken.address, amountInMax)
      const allowanceTx = await signer.sendTransaction(allowanceTxObj)
      const allowanceReceipt = await allowanceTx.wait()
      console.log(
        `Received allowance tx hash ${allowanceReceipt.transactionHash} with status ${allowanceReceipt.status}`
      )
      const swapTxObj = await mento.swapOut(
        sellToken.address,
        buyToken.address,
        buyAmountInSmallestUnit,
        amountInMax
      )
      const swapTx = await signer.sendTransaction(swapTxObj)
      const swapTxReceipt = await swapTx.wait()
      console.log(
        `Received swap tx hash ${swapTxReceipt.transactionHash} with status ${swapTxReceipt.status}`
      )
      if (swapTxReceipt.status !== 1) {
        throw new Error(`Swap reverted. Tx hash: ${swapTxReceipt.transactionHash}`)
      }
    } catch (err) {
      console.log(`Failed to buy ${buyToken.symbol} with ${sellToken.symbol}`, err)
    }
  }

  // Ensure that the faucet has enough balance for each refill tokens
  for (const [tokenSymbol, tokenBalance] of Object.entries(faucetTokenBalances)) {
    if (!REFILL_TOKENS.includes(tokenSymbol)) {
      continue
    }

    if (tokenBalance >= targetFaucetTokenBalance) {
      console.log(
        `${tokenSymbol} balance is ${tokenBalance}, which is higher than target ${targetFaucetTokenBalance}.`
      )
      const sellAmount = tokenBalance - targetFaucetTokenBalance
      await swapSell(
        TOKENS_BY_SYMBOL[tokenSymbol],
        tokenSymbol === 'CELO' ? CUSD : CELO,
        sellAmount,
        1
      )
    } else {
      console.log(
        `${tokenSymbol} balance is ${tokenBalance}, which is lower than target ${targetFaucetTokenBalance}.`
      )
      const buyAmount = targetFaucetTokenBalance - tokenBalance
      await swapBuy(
        tokenSymbol === 'CELO' ? CUSD : CELO,
        TOKENS_BY_SYMBOL[tokenSymbol],
        buyAmount,
        1
      )
    }
  }

  // Set Amount To Send
  const amountToSend = '6'
  const minBalance = 12

  for (let i = 0; i < walletsToBeFunded.length; i++) {
    const walletAddress = walletsToBeFunded[i]
    const walletBalance = walletBalances[i]
    for (const tokenSymbol of REFILL_TOKENS) {
      console.log('Tom - tokenSymbol: ', tokenSymbol)
      // @ts-ignore
      if (walletBalance && walletBalance[tokenSymbol] < minBalance) {
        console.log(`Sending ${amountToSend} ${tokenSymbol} to ${walletAddress}`)
        await transferToken(TOKENS_BY_SYMBOL[tokenSymbol], amountToSend, walletAddress, signer)
      }
    }
  }
  console.log('Finished funding wallets.')

  // Log Balances
  console.log('E2E Test Account:', E2E_TEST_WALLET)
  console.table(await getCeloTokensBalance(E2E_TEST_WALLET))
  console.log('E2E Test Account Secure Send:', E2E_TEST_WALLET_SECURE_SEND)
  console.table(await getCeloTokensBalance(E2E_TEST_WALLET_SECURE_SEND))
  console.log('Valora Test Faucet:', E2E_TEST_FAUCET)
  console.table(await getCeloTokensBalance(E2E_TEST_FAUCET))

  await checkBalance(E2E_TEST_WALLET)
  await checkBalance(E2E_TEST_WALLET_SECURE_SEND)
})()
