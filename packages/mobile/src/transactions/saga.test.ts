import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { updateTransactions } from 'src/transactions/actions'
import { getInviteTransactionsDetails } from 'src/transactions/saga'
import { TokenTransaction, TokenTransactionTypeV2 } from 'src/transactions/types'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { createMockStore } from 'test/utils'
import { mockCusdAddress } from 'test/values'

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
  transactionHash: '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b',
  type: TokenTransactionTypeV2.InviteSent,
}

const mockEscrowWrapper = {}

describe('getInviteTransactionsDetails', () => {
  it('updates the transaction store with the correct details', async () => {
    const kit = await getContractKitAsync()
    const updateTransactionsAction = updateTransactions([mockInviteTransaction])

    await expectSaga(getInviteTransactionsDetails, updateTransactionsAction)
      .withState(createMockStore().getState())
      .provide([
        [call(getContractKit), kit],
        [call([kit.contracts, kit.contracts.getEscrow]), mockEscrowWrapper],
      ])
      .run()
  })
})
