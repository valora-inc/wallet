import { NetworkId } from 'src/transactions/types'
import { mockEarnPositions } from 'test/values'
import reducer, {
  claimCancel,
  claimError,
  claimStart,
  claimSuccess,
  depositCancel,
  depositError,
  depositStart,
  depositSuccess,
  withdrawCancel,
  withdrawError,
  withdrawStart,
  withdrawSuccess,
} from './slice'

describe('Earn Slice', () => {
  it('should handle deposit start', () => {
    const updatedState = reducer(
      undefined,
      depositStart({
        amount: '100',
        pool: mockEarnPositions[0],
        preparedTransactions: [],
        mode: 'deposit',
        fromTokenAmount: '100',
        fromTokenId: 'some-token-id',
      })
    )

    expect(updatedState).toHaveProperty('depositStatus', 'loading')
  })

  it('should handle deposit success', () => {
    const updatedState = reducer(
      undefined,
      depositSuccess({
        tokenId: 'tokenId',
        networkId: NetworkId['celo-alfajores'],
        transactionHash: '0x3',
      })
    )

    expect(updatedState).toHaveProperty('depositStatus', 'success')
  })

  it('should handle deposit error', () => {
    const updatedState = reducer(undefined, depositError())

    expect(updatedState).toHaveProperty('depositStatus', 'error')
  })

  it('should handle deposit cancel', () => {
    const updatedState = reducer(undefined, depositCancel())

    expect(updatedState).toHaveProperty('depositStatus', 'idle')
  })

  it('should handle withdraw start', () => {
    const updatedState = reducer(
      undefined,
      withdrawStart({ preparedTransactions: [], rewardsTokens: [], pool: mockEarnPositions[0] })
    )

    expect(updatedState).toHaveProperty('withdrawStatus', 'loading')
  })

  it('should handle withdraw success', () => {
    const updatedState = reducer(undefined, withdrawSuccess())

    expect(updatedState).toHaveProperty('withdrawStatus', 'success')
  })

  it('should handle withdraw error', () => {
    const updatedState = reducer(undefined, withdrawError())

    expect(updatedState).toHaveProperty('withdrawStatus', 'error')
  })

  it('should handle withdraw cancel', () => {
    const updatedState = reducer(undefined, withdrawCancel())

    expect(updatedState).toHaveProperty('withdrawStatus', 'idle')
  })

  it('should handle claim start', () => {
    const updatedState = reducer(
      undefined,
      claimStart({
        preparedTransactions: [],
        rewardsTokens: [],
        pool: mockEarnPositions[0],
      })
    )

    expect(updatedState).toHaveProperty('claimStatus', 'loading')
  })

  it('should handle claim success', () => {
    const updatedState = reducer(undefined, claimSuccess())

    expect(updatedState).toHaveProperty('claimStatus', 'success')
  })

  it('should handle claim error', () => {
    const updatedState = reducer(undefined, claimError())

    expect(updatedState).toHaveProperty('claimStatus', 'error')
  })

  it('should handle claim cancel', () => {
    const updatedState = reducer(undefined, claimCancel())

    expect(updatedState).toHaveProperty('claimStatus', 'idle')
  })
})
