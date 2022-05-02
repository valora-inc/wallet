import { E2E_TEST_WALLET } from './consts'
import { balanceError, getBalance } from './utils'
;(async () => {
  console.log(E2E_TEST_WALLET)
  console.table(await getBalance())
  await balanceError()
})()
