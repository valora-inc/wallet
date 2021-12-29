import { StableToken } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { TokenTransactionType } from 'src/apollo/types'
import { WEI_PER_TOKEN } from 'src/geth/consts'
import { fetchStableBalances, setBalance, transferStableToken } from 'src/stableToken/actions'
import { stableTokenTransfer, watchFetchStableBalances } from 'src/stableToken/saga'
import { addStandbyTransactionLegacy, removeStandbyTransaction } from 'src/transactions/actions'
import { TransactionStatus } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { getContractKitAsync } from 'src/web3/contracts'
import { waitWeb3LastBlock } from 'src/web3/saga'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'

const now = Date.now()
Date.now = jest.fn(() => now)

// The balances must match the mocks in the contractkit mock file.
const CUSD_BALANCE = '1'
const CEUR_BALANCE = '2'
const TX_ID = '1234'
const COMMENT = 'a comment'

jest.mock('src/web3/actions', () => ({
  ...(jest.requireActual('src/web3/actions') as any),
  unlockAccount: jest.fn(async () => true),
}))

const { unlockAccount } = require('src/web3/actions')

const state = createMockStore().getState()

const TRANSFER_ACTION = transferStableToken({
  recipientAddress: mockAccount,
  amount: CUSD_BALANCE,
  currency: Currency.Dollar,
  comment: COMMENT,
  context: { id: TX_ID },
})

const mockStableBalance = async (token: StableToken, value: BigNumber) => {
  const stableToken = await (await getContractKitAsync()).contracts.getStableToken(token)
  // @ts-ignore Jest Mock
  stableToken.balanceOf.mockResolvedValueOnce(value)
}

describe('stableToken saga', () => {
  jest.useRealTimers()

  it('should fetch the balance and put the new balance', async () => {
    await mockStableBalance(
      StableToken.cUSD,
      new BigNumber(CUSD_BALANCE).multipliedBy(WEI_PER_TOKEN)
    )
    await mockStableBalance(
      StableToken.cEUR,
      new BigNumber(CEUR_BALANCE).multipliedBy(WEI_PER_TOKEN)
    )
    await expectSaga(watchFetchStableBalances)
      .provide([[call(waitWeb3LastBlock), true]])
      .withState(state)
      .dispatch(fetchStableBalances())
      .put(setBalance({ [Currency.Dollar]: CUSD_BALANCE, [Currency.Euro]: CEUR_BALANCE }))
      .run()
  })

  it('should not update the balance if it is too large', async () => {
    await mockStableBalance(StableToken.cUSD, new BigNumber(10000001))
    await expectSaga(watchFetchStableBalances)
      .provide([[call(waitWeb3LastBlock), true]])
      .withState(state)
      .dispatch(fetchStableBalances())
      .run()
  })

  it('should add a standby transaction and dispatch a sendAndMonitorTransaction', async () => {
    await expectSaga(stableTokenTransfer)
      .provide([[call(waitWeb3LastBlock), true]])
      .withState(state)
      .dispatch(TRANSFER_ACTION)
      .put(
        addStandbyTransactionLegacy({
          context: { id: TX_ID },
          type: TokenTransactionType.Sent,
          comment: COMMENT,
          status: TransactionStatus.Pending,
          value: CUSD_BALANCE,
          currency: Currency.Dollar,
          timestamp: Math.floor(Date.now() / 1000),
          address: mockAccount,
        })
      )
      .run()
  })

  it('should add a standby transaction', async () => {
    await expectSaga(stableTokenTransfer)
      .provide([[call(waitWeb3LastBlock), true]])
      .withState(state)
      .dispatch(TRANSFER_ACTION)
      .put(
        addStandbyTransactionLegacy({
          context: { id: TX_ID },
          type: TokenTransactionType.Sent,
          comment: COMMENT,
          status: TransactionStatus.Pending,
          value: CUSD_BALANCE,
          currency: Currency.Dollar,
          timestamp: Math.floor(Date.now() / 1000),
          address: mockAccount,
        })
      )
      .run()
  })

  it('should remove standby transaction when pin unlock fails', async () => {
    unlockAccount.mockImplementationOnce(async () => false)

    await expectSaga(stableTokenTransfer)
      .provide([[call(waitWeb3LastBlock), true]])
      .withState(state)
      .dispatch(TRANSFER_ACTION)
      .put(removeStandbyTransaction(TX_ID))
      .run()
  })
})
