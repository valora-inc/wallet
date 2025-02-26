import dotenv from 'dotenv'
import { Wallet } from 'ethers'
import {
  E2E_TEST_FAUCET,
  E2E_TEST_WALLET_SINGLE_VERIFIED_ADDRESS,
  provider,
  TOKENS_BY_SYMBOL,
} from './consts'
import { getCeloTokensBalance, transferToken } from './utils'

dotenv.config({ path: `${__dirname}/../.env` })

// This is a sink wallet which only receives funds
const e2eWalletSingleVerifiedPrivateKey = process.env['E2E_WALLET_SINGLE_VERIFIED_PRIVATE_KEY']!

const amountToRetain = 10
const recipientAddress = E2E_TEST_FAUCET

;(async () => {
  const singleVerifiedTokenBalance =
    (await getCeloTokensBalance(E2E_TEST_WALLET_SINGLE_VERIFIED_ADDRESS)) ?? {}
  console.log(`Initial balance for wallet at: ${E2E_TEST_WALLET_SINGLE_VERIFIED_ADDRESS}:`)
  console.table(singleVerifiedTokenBalance)

  const signer = new Wallet(e2eWalletSingleVerifiedPrivateKey, provider)

  for (const [tokenSymbol, tokenBalance] of Object.entries(singleVerifiedTokenBalance)) {
    if (tokenBalance > amountToRetain) {
      const amountToSend = (tokenBalance - amountToRetain).toString()
      console.log(`Transferring ${amountToSend} ${tokenSymbol} to ${recipientAddress}`)
      await transferToken(TOKENS_BY_SYMBOL[tokenSymbol], amountToSend, recipientAddress, signer)
    }
  }
})()
