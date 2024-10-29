import { renderHook } from '@testing-library/react-native'
import { usePrepareTransactions } from 'src/earn/hooks'
import { mockRewardsPositions } from 'test/values'

describe('usePrepareTransactions', () => {
  it.each([
    {
      mode: 'withdraw',
      title: 'calls correct transaction preparation for withdraw',
      expectedPrepareTransactionsResult: undefined,
    },
    {
      mode: 'claim-rewards',
      title: 'calls correct transaction preparation for claim-rewards',
      expectedPrepareTransactionsResult: undefined,
    },
    {
      mode: 'claim-rewards',
      extraArgs: { rewardsPositions: mockRewardsPositions },
      title: 'calls correct transaction preparation for claim-rewards with rewardsPositions',
      expectedPrepareTransactionsResult: undefined,
    },
    {
      mode: 'deposit',
      title: 'calls correct transaction preparation for deposit',
      expectedPrepareTransactionsResult: undefined,
    },
    {
      mode: 'swap-deposit',
      title: 'calls correct transaction preparation for swap-deposit',
      expectedPrepareTransactionsResult: undefined,
    },
    {
      mode: 'exit',
      title: 'calls correct transaction preparation for exit',
      expectedPrepareTransactionsResult: undefined,
    },
    {
      mode: 'exit',
      extraArgs: { rewardsPositions: mockRewardsPositions },
      title: 'calls correct transaction preparation for exit with rewardsPositions',
      expectedPrepareTransactionsResult: undefined,
    },
  ] as const)('$title', async ({ mode, extraArgs, expectedPrepareTransactionsResult }) => {
    // const pool = mockEarnPositions[0] as EarnPosition
    const { result } = renderHook(() => usePrepareTransactions(mode, extraArgs))

    // TODO(tomm): setup mocks and call refreshPreparedTransactions to simulate preparing a transaction
    // const args = {
    //   pool,
    //   hooksApiUrl: networkConfig.hooksApiUrl,
    //   tokenId: pool.dataProps.depositTokenId,
    // }

    // await act(async () => {
    //   await result.current.refreshPreparedTransactions(args)
    // })

    // Validate the initial state and functions returned by the hook
    expect(result.current).toEqual({
      prepareTransactionsResult: expectedPrepareTransactionsResult,
      isPreparingTransactions: false,
      prepareTransactionError: undefined,
      refreshPreparedTransactions: expect.any(Function),
      clearPreparedTransactions: expect.any(Function),
    })
  })
})
