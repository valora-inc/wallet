var consts = require('./consts.ts')
var utils = require('./utils.ts')

;(async () => {
  console.log(consts.E2E_TEST_WALLET)
  console.table(await utils.getBalance())
  await utils.balanceError()
})()
