import { E2E_TEST_WALLET, E2E_TEST_WALLET_SECURE_SEND } from './consts'
import { checkBalance, getBalance } from './utils'
;(async () => {
  console.log(E2E_TEST_WALLET)
  console.table(await getBalance(E2E_TEST_WALLET))
  await checkBalance(E2E_TEST_WALLET)

  console.log(E2E_TEST_WALLET_SECURE_SEND)
  console.table(await getBalance(E2E_TEST_WALLET_SECURE_SEND))
  await checkBalance(E2E_TEST_WALLET_SECURE_SEND)
})()
