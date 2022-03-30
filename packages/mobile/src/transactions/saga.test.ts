import { EventLog } from '@celo/connect'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { updateInviteTransactions, updateTransactions } from 'src/transactions/actions'
import { getInviteTransactionsDetails } from 'src/transactions/saga'
import { TokenTransaction, TokenTransactionTypeV2 } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { createMockStore } from 'test/utils'
import { mockCusdAddress } from 'test/values'

const loggerErrorSpy = jest.spyOn(Logger, 'error')

const transactionHash = '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b'
const mockInviteTransaction: TokenTransaction = {
  __typename: 'TokenTransferV2',
  address: '0xd68360cce1f1ff696d898f58f03e0f1252f2ea33',
  amount: {
    tokenAddress: mockCusdAddress,
    value: '0.1',
  },
  block: '8648978',
  fees: [],
  metadata: {},
  timestamp: 1542306118,
  transactionHash,
  type: TokenTransactionTypeV2.InviteSent,
}
const mockEscrowPastEvent: EventLog = {
  event: 'PastEvent',
  address: '0xd68360cce1f1ff696d898f58f03e0f1252f2ea33',
  returnValues: {
    identifier: 'someIdentifier',
    paymentId: 'somePaymentId',
  },
  logIndex: 0,
  transactionIndex: 0,
  transactionHash,
  blockHash: '0xabc',
  blockNumber: 8648978,
}

describe('getInviteTransactionsDetails', () => {
  it('logs an error if no matching transaction is found in escrow', async () => {
    const kit = await getContractKitAsync()
    const updateTransactionsAction = updateTransactions([mockInviteTransaction])
    const mockEscrowWrapper = {
      getPastEvents: jest.fn(() => [
        {
          ...mockEscrowPastEvent,
          transactionHash: '0x123',
        },
      ]),
    }

    await expectSaga(getInviteTransactionsDetails, updateTransactionsAction)
      .withState(createMockStore().getState())
      .provide([
        [call(getContractKit), kit],
        [call([kit.contracts, kit.contracts.getEscrow]), mockEscrowWrapper],
      ])
      .run()

    expect(loggerErrorSpy).toHaveBeenCalled()
  })

  it('updates the invite transaction details', async () => {
    const kit = await getContractKitAsync()
    const updateTransactionsAction = updateTransactions([mockInviteTransaction])
    const mockEscrowWrapper = {
      getPastEvents: jest.fn(() => [mockEscrowPastEvent]),
    }

    await expectSaga(getInviteTransactionsDetails, updateTransactionsAction)
      .withState(createMockStore().getState())
      .provide([
        [call(getContractKit), kit],
        [call([kit.contracts, kit.contracts.getEscrow]), mockEscrowWrapper],
      ])
      .put(
        updateInviteTransactions({
          [transactionHash]: {
            recipientIdentifier: 'someIdentifier',
            paymentId: 'somePaymentId',
          },
        })
      )
      .run()
  })
})
