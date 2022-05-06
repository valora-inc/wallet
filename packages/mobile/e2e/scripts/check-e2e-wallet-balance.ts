import { E2E_TEST_WALLET } from './consts'
import { checkBalance, getBalance } from './utils'
;(async () => {
  console.log(E2E_TEST_WALLET)
  console.table(await getBalance(E2E_TEST_WALLET))
  await checkBalance(E2E_TEST_WALLET)
})()
