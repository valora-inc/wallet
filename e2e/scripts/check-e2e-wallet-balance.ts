import { E2E_TEST_WALLET } from './consts'
import { checkBalance, getCeloTokensBalance } from './utils'
;(async () => {
  console.log(`E2E_TEST_WALLET: ${E2E_TEST_WALLET}`)
  console.table(await getCeloTokensBalance(E2E_TEST_WALLET))
  await checkBalance(E2E_TEST_WALLET)
})()
