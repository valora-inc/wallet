import { E2E_TEST_FAUCET, E2E_TEST_WALLET, E2E_TEST_WALLET_SECURE_SEND } from './consts'
import { checkBalance, getCeloTokensBalance } from './utils'
;(async () => {
  console.log(`E2E_TEST_WALLET: ${E2E_TEST_WALLET}`)
  console.table(await getCeloTokensBalance(E2E_TEST_WALLET))
  await checkBalance(E2E_TEST_WALLET)

  console.log(`E2E_TEST_WALLET_SECURE_SEND: ${E2E_TEST_WALLET_SECURE_SEND}`)
  console.table(await getCeloTokensBalance(E2E_TEST_WALLET_SECURE_SEND))
  await checkBalance(E2E_TEST_WALLET_SECURE_SEND)

  console.log(`E2E_TEST_FACUET: ${E2E_TEST_FAUCET}`)
  console.table(await getCeloTokensBalance(E2E_TEST_FAUCET))
})()
