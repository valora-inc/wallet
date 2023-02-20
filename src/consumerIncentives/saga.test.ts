import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga-test-plan/matchers'
import { Actions as AlertActions, AlertTypes, showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { claimRewardsSaga, fetchAvailableRewardsSaga } from 'src/consumerIncentives/saga'
import { superchargeRewardContractAddressSelector } from 'src/consumerIncentives/selectors'
import {
  claimRewards,
  claimRewardsFailure,
  claimRewardsSuccess,
  fetchAvailableRewards,
  fetchAvailableRewardsFailure,
  fetchAvailableRewardsSuccess,
  setAvailableRewards,
} from 'src/consumerIncentives/slice'
import {
  ONE_CEUR_REWARD_RESPONSE,
  ONE_CUSD_REWARD_RESPONSE,
} from 'src/consumerIncentives/testValues'
import { SuperchargePendingReward } from 'src/consumerIncentives/types'
import { navigateHome } from 'src/navigator/NavigationService'
import { tokensByAddressSelector } from 'src/tokens/selectors'
import { Actions as TransactionActions } from 'src/transactions/actions'
import { sendTransaction } from 'src/transactions/send'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { getContractKit } from 'src/web3/contracts'
import config from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount, mockCeurAddress, mockCusdAddress } from 'test/values'

const mockBaseNonce = 10

const contractKit = {
  getWallet: jest.fn(),
  getAccounts: jest.fn(),
  web3: {
    eth: {
      getTransactionCount: jest.fn(() => mockBaseNonce),
    },
  },
  connection: {
    chainId: jest.fn(() => '42220'),
    nonce: jest.fn(),
    gasPrice: jest.fn(),
  },
}

const mockTokens = {
  [mockCusdAddress]: {
    symbol: 'cUSD',
  },
  [mockCeurAddress]: {
    symbol: 'cEUR',
  },
}

jest.mock('src/transactions/send', () => ({
  sendTransaction: jest.fn(() => ({ transactionHash: '0x123' })),
}))

describe('fetchAvailableRewardsSaga', () => {
  const userAddress = 'test'
  const expectedRewards: SuperchargePendingReward[] = [
    {
      transaction: {
        from: '0xabc',
        chainId: '0x123',
        to: '0xxyz',
        data: '0x0000000asdfhawejkh',
      },
      details: {
        amount: '0x2386f26fc10000',
        tokenAddress: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
      },
    },
  ]
  const mockResponse = {
    json: () => {
      return { rewards: expectedRewards }
    },
  }
  const error = new Error('Unexpected error')

  const availableRewardsUri = `${config.fetchAvailableSuperchargeRewards}?userAddress=${userAddress}`

  it('stores rewards after fetching them', async () => {
    await expectSaga(fetchAvailableRewardsSaga)
      .provide([
        [select(walletAddressSelector), userAddress],
        [call(fetchWithTimeout, availableRewardsUri, 30_000), mockResponse],
      ])
      .put(setAvailableRewards(expectedRewards))
      .put(fetchAvailableRewardsSuccess())
      .run()
  })

  it('handles failures correctly', async () => {
    await expectSaga(fetchAvailableRewardsSaga)
      .provide([
        [select(walletAddressSelector), userAddress],
        [call(fetchWithTimeout, availableRewardsUri, 30_000), error],
      ])
      .not.put(setAvailableRewards(expectedRewards))
      .not.put(fetchAvailableRewardsSuccess())
      .put(fetchAvailableRewardsFailure())
      .put(showError(ErrorMessages.SUPERCHARGE_FETCH_REWARDS_FAILED))
      .run()
  })
})

describe('claimRewardsSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('claiming no rewards succeeds', async () => {
    await expectSaga(claimRewardsSaga, claimRewards([]))
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(tokensByAddressSelector), {}],
        [matchers.call.fn(sendTransaction), {}],
        [select(superchargeRewardContractAddressSelector), '0x123'],
      ])
      .put(claimRewardsSuccess())
      .put.like({ action: { type: AlertActions.SHOW, message: 'superchargeClaimSuccess' } })
      .run()
    expect(navigateHome).toHaveBeenCalled()
  })

  it('claiming one reward succeeds', async () => {
    await expectSaga(claimRewardsSaga, claimRewards([ONE_CUSD_REWARD_RESPONSE]))
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(tokensByAddressSelector), mockTokens],
        [select(superchargeRewardContractAddressSelector), '0xsuperchargeContract'],
      ])
      .put.like({
        action: {
          type: TransactionActions.ADD_STANDBY_TRANSACTION,
          transaction: { tokenAddress: mockCusdAddress.toLowerCase() },
        },
      })
      .put(fetchAvailableRewards())
      .put(claimRewardsSuccess())
      .put.like({ action: { type: AlertActions.SHOW, message: 'superchargeClaimSuccess' } })
      .run()
    expect(navigateHome).toHaveBeenCalled()
    expect(sendTransaction).toHaveBeenCalledWith(
      expect.anything(),
      mockAccount,
      expect.anything(),
      undefined,
      undefined,
      undefined,
      mockBaseNonce
    )
  })

  it('claiming two rewards succeeds', async () => {
    await expectSaga(
      claimRewardsSaga,
      claimRewards([ONE_CUSD_REWARD_RESPONSE, ONE_CEUR_REWARD_RESPONSE])
    )
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(tokensByAddressSelector), mockTokens],
        [select(superchargeRewardContractAddressSelector), '0xsuperchargeContract'],
      ])
      .put.like({
        action: {
          type: TransactionActions.ADD_STANDBY_TRANSACTION,
          transaction: { tokenAddress: mockCusdAddress.toLowerCase() },
        },
      })
      .put.like({
        action: {
          type: TransactionActions.ADD_STANDBY_TRANSACTION,
          transaction: { tokenAddress: mockCeurAddress.toLowerCase() },
        },
      })
      .put(fetchAvailableRewards())
      .put(claimRewardsSuccess())
      .put.like({ action: { type: AlertActions.SHOW, message: 'superchargeClaimSuccess' } })
      .run()
    expect(navigateHome).toHaveBeenCalled()
    expect(sendTransaction).toHaveBeenCalledTimes(2)
    expect(sendTransaction).toHaveBeenCalledWith(
      expect.anything(),
      mockAccount,
      expect.anything(),
      undefined,
      undefined,
      undefined,
      mockBaseNonce
    )
    expect(sendTransaction).toHaveBeenCalledWith(
      expect.anything(),
      mockAccount,
      expect.anything(),
      undefined,
      undefined,
      undefined,
      mockBaseNonce + 1
    )
  })

  it('fails if claiming a reward fails', async () => {
    ;(sendTransaction as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Error claiming')
    })
    await expectSaga(
      claimRewardsSaga,
      claimRewards([ONE_CUSD_REWARD_RESPONSE, ONE_CEUR_REWARD_RESPONSE])
    )
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(tokensByAddressSelector), mockTokens],
        [select(superchargeRewardContractAddressSelector), '0xsuperchargeContract'],
      ])
      .not.put(claimRewardsSuccess())
      .put(claimRewardsFailure())
      .put.like({
        action: {
          type: AlertActions.SHOW,
          alertType: AlertTypes.ERROR,
          message: 'superchargeClaimFailure',
        },
      })
      .run()
    expect(navigateHome).not.toHaveBeenCalled()
  })

  it('fails if the reward transaction "to" address is incorrect', async () => {
    await expectSaga(claimRewardsSaga, claimRewards([ONE_CUSD_REWARD_RESPONSE]))
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(superchargeRewardContractAddressSelector), '0xnewSuperchargeContract'],
      ])
      .not.put(claimRewardsSuccess())
      .put(claimRewardsFailure())
      .put.like({
        action: {
          type: AlertActions.SHOW,
          alertType: AlertTypes.ERROR,
          message: 'superchargeClaimFailure',
        },
      })
      .run()
    expect(navigateHome).not.toHaveBeenCalled()
  })
})
