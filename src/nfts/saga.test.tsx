import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { select } from 'redux-saga/effects'
import { Actions, celebratedNftFound, nftRewardReadyToDisplay } from 'src/home/actions'
import { NftCelebrationStatus } from 'src/home/reducers'
import { nftCelebrationSelector } from 'src/home/selectors'
import * as nftSaga from 'src/nfts/saga'
import { handleFetchNfts, watchFirstFetchCompleted } from 'src/nfts/saga'
import { fetchNftsCompleted, fetchNftsFailed } from 'src/nfts/slice'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'
import { createMockStore } from 'test/utils'
import { mockNftAllFields, mockNftMinimumFields } from 'test/values'

jest.mock('src/statsig')

const loggerDebugSpy = jest.spyOn(Logger, 'debug')
const loggerErrorSpy = jest.spyOn(Logger, 'error')

const nftResponse1 = JSON.stringify({
  result: [mockNftAllFields],
})

const nftResponse2 = JSON.stringify({
  result: [mockNftMinimumFields],
})

const mockCelebratedNft = {
  networkId: mockNftAllFields.networkId,
  contractAddress: mockNftAllFields.contractAddress,
}

const mockRemoteConfig = {
  celebratedNft: mockCelebratedNft,
  deepLink: 'celo://test',
  rewardExpirationDate: '3000-12-01T00:00:00.000Z',
  rewardReminderDate: '3000-01-01T00:00:00.000Z',
}

const mockExpiredRemoteConfig = {
  ...mockRemoteConfig,
  rewardExpirationDate: '2000-12-01T00:00:00.000Z',
  rewardReminderDate: '2000-01-01T00:00:00.000Z',
}

const mockNftCelebrationStore = (status: NftCelebrationStatus) => {
  return {
    home: {
      nftCelebration: {
        networkId: mockNftAllFields.networkId,
        contractAddress: mockNftAllFields.contractAddress,
        deepLink: 'celo://test',
        rewardExpirationDate: '3000-12-01T00:00:00.000Z',
        rewardReminderDate: '3000-01-01T00:00:00.000Z',
        status,
      },
    },
  }
}

describe('Given Nfts saga', () => {
  describe('When fetching users Nfts', () => {
    const mockFetch = fetch as FetchMock
    beforeEach(() => {
      mockFetch.resetMocks()
      jest.clearAllMocks()
      jest.mocked(getDynamicConfigParams).mockReturnValue({
        showNfts: [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
      })
    })

    it("should fetch user's NFTs", async () => {
      mockFetch.mockResponseOnce(nftResponse1)
      mockFetch.mockResponseOnce(nftResponse2)

      await expectSaga(handleFetchNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .put(
          fetchNftsCompleted({
            nfts: [
              { ...mockNftAllFields, networkId: NetworkId['celo-alfajores'] },
              { ...mockNftMinimumFields, networkId: NetworkId['ethereum-sepolia'] },
            ],
          })
        )
        .run()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.alfajores.valora.xyz/getNfts?address=0xabc&networkId=celo-alfajores',
        {
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          method: 'GET',
          signal: expect.any(AbortSignal),
        }
      )
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.alfajores.valora.xyz/getNfts?address=0xabc&networkId=ethereum-sepolia',
        {
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          method: 'GET',
          signal: expect.any(AbortSignal),
        }
      )
    })

    it('should save error on parse fail', async () => {
      mockFetch.mockResponseOnce('invalid json')

      await expectSaga(handleFetchNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .put(
          fetchNftsFailed({
            error: `invalid json response body at  reason: Unexpected token 'i', "invalid json" is not valid JSON`,
          })
        )
        .run()

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should save error on fetch fail', async () => {
      mockFetch.mockResponse(JSON.stringify({ message: 'something went wrong' }), { status: 500 })

      await expectSaga(handleFetchNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .put(
          fetchNftsFailed({
            error:
              'Unable to fetch NFTs for celo-alfajores: 500 {"message":"something went wrong"}',
          })
        )
        .run()
    })

    it('should not fetch when no wallet address found', async () => {
      await expectSaga(handleFetchNfts)
        .provide([[select(walletAddressSelector), null]])
        .not.put.actionType(fetchNftsCompleted.type)
        .run()

      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'NftsSaga',
        'Wallet address not found, skipping NFTs list fetch'
      )
    })
  })

  describe('findCelebratedNft saga', () => {
    it('should put celebrated NFT once found', () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

      jest.mocked(getFeatureGate).mockReturnValue(true)
      jest.mocked(getDynamicConfigParams).mockReturnValue(mockRemoteConfig)

      return expectSaga(nftSaga.findCelebratedNft, mockAction)
        .provide([[select(nftCelebrationSelector), null]])
        .put(
          celebratedNftFound({
            networkId: mockRemoteConfig.celebratedNft.networkId,
            contractAddress: mockRemoteConfig.celebratedNft.contractAddress,
            deepLink: mockRemoteConfig.deepLink,
            rewardExpirationDate: mockRemoteConfig.rewardExpirationDate,
            rewardReminderDate: mockRemoteConfig.rewardReminderDate,
          })
        )
        .run()
    })

    it('should not put celebrated NFT if feature gate is closed', () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

      jest
        .mocked(getFeatureGate)
        .mockImplementation(
          (featureGate) => featureGate !== StatsigFeatureGates.SHOW_NFT_CELEBRATION
        )
      jest.mocked(getDynamicConfigParams).mockReturnValue(mockExpiredRemoteConfig)

      return expectSaga(nftSaga.findCelebratedNft, mockAction)
        .provide([[select(nftCelebrationSelector), undefined]])
        .not.put.actionType(Actions.CELEBRATED_NFT_FOUND)
        .run()
    })

    it('should not put celebrated NFT if dynamic config is empty', () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

      jest.mocked(getFeatureGate).mockReturnValue(true)
      jest.mocked(getDynamicConfigParams).mockReturnValue({})

      return expectSaga(nftSaga.findCelebratedNft, mockAction)
        .provide([[select(nftCelebrationSelector), undefined]])
        .not.put.actionType(Actions.CELEBRATED_NFT_FOUND)
        .run()
    })

    it('should not put celebrated NFT if celebrated NFT already exists', () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

      jest.mocked(getFeatureGate).mockReturnValue(true)
      jest.mocked(getDynamicConfigParams).mockReturnValue(mockRemoteConfig)

      return expectSaga(nftSaga.findCelebratedNft, mockAction)
        .withState(
          createMockStore(
            mockNftCelebrationStore(NftCelebrationStatus.celebrationReadyToDisplay)
          ).getState()
        )
        .provide([[select(nftCelebrationSelector), mockCelebratedNft]])
        .not.put.actionType(Actions.CELEBRATED_NFT_FOUND)
        .run()
    })
  })

  describe('findNftReward saga', () => {
    it('should not set status "reward ready" if feature gate is closed', () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

      jest
        .mocked(getFeatureGate)
        .mockImplementation((featureGate) => featureGate !== StatsigFeatureGates.SHOW_NFT_REWARD)
      jest.mocked(getDynamicConfigParams).mockReturnValue(mockExpiredRemoteConfig)

      return expectSaga(nftSaga.findCelebratedNft, mockAction)
        .provide([[select(nftCelebrationSelector), undefined]])
        .not.put.actionType(Actions.NFT_REWARD_READY_TO_DISPLAY)
        .run()
    })

    it('should not set status "reward ready" if dynamic config is empty', () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

      jest.mocked(getFeatureGate).mockReturnValue(true)
      jest.mocked(getDynamicConfigParams).mockReturnValue({})

      return expectSaga(nftSaga.findCelebratedNft, mockAction)
        .provide([[select(nftCelebrationSelector), undefined]])
        .not.put.actionType(Actions.NFT_REWARD_READY_TO_DISPLAY)
        .run()
    })

    it('should log an error if expiration date is invalid', async () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

      jest.mocked(getFeatureGate).mockReturnValue(true)
      jest
        .mocked(getDynamicConfigParams)
        .mockReturnValue({ ...mockRemoteConfig, rewardExpirationDate: 'INVALID VALUE' })

      await expectSaga(nftSaga.findNftReward, mockAction)
        .provide([[select(nftCelebrationSelector), undefined]])
        .not.put.actionType(Actions.NFT_REWARD_READY_TO_DISPLAY)
        .run()

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'NftsSaga',
        'Invalid expiration date in remote config'
      )
    })

    it('should log an error if reward reminder date is invalid', async () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

      jest.mocked(getFeatureGate).mockReturnValue(true)
      jest
        .mocked(getDynamicConfigParams)
        .mockReturnValue({ ...mockRemoteConfig, rewardReminderDate: 'INVALID VALUE' })

      await expectSaga(nftSaga.findNftReward, mockAction)
        .provide([[select(nftCelebrationSelector), undefined]])
        .not.put.actionType(Actions.NFT_REWARD_READY_TO_DISPLAY)
        .run()

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'NftsSaga',
        'Invalid reminder date in remote config'
      )
    })

    it('should set status "reward ready" if celebration was displayed', () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

      jest.mocked(getFeatureGate).mockReturnValue(true)
      jest.mocked(getDynamicConfigParams).mockReturnValue(mockRemoteConfig)

      return expectSaga(nftSaga.findNftReward, mockAction)
        .withState(
          createMockStore(
            mockNftCelebrationStore(NftCelebrationStatus.celebrationDisplayed)
          ).getState()
        )
        .put(
          nftRewardReadyToDisplay({
            showReminder: false,
            valuesToSync: {
              rewardExpirationDate: mockRemoteConfig.rewardExpirationDate,
              rewardReminderDate: mockRemoteConfig.rewardReminderDate,
              deepLink: mockRemoteConfig.deepLink,
            },
          })
        )
        .run()
    })

    it('should not set status "reward ready" if celebration was not displayed', async () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

      jest.mocked(getFeatureGate).mockReturnValue(true)
      jest.mocked(getDynamicConfigParams).mockReturnValue(mockRemoteConfig)

      await expectSaga(nftSaga.findNftReward, mockAction)
        .withState(
          createMockStore(
            mockNftCelebrationStore(NftCelebrationStatus.celebrationReadyToDisplay)
          ).getState()
        )
        .not.put(
          nftRewardReadyToDisplay({
            showReminder: false,
            valuesToSync: {
              rewardExpirationDate: mockRemoteConfig.rewardExpirationDate,
              rewardReminderDate: mockRemoteConfig.rewardReminderDate,
              deepLink: mockRemoteConfig.deepLink,
            },
          })
        )
        .run()
    })

    describe('when reward is about to expire', () => {
      beforeAll(() => {
        jest.useFakeTimers({ now: new Date('3000-01-01T00:00:00.000Z') })
      })
      afterAll(() => {
        jest.useFakeTimers({ doNotFake: ['Date'] })
      })

      it('should set status "reminder ready" if reward was displayed', async () => {
        const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

        jest.mocked(getFeatureGate).mockReturnValue(true)
        jest.mocked(getDynamicConfigParams).mockReturnValue(mockRemoteConfig)

        return expectSaga(nftSaga.findNftReward, mockAction)
          .withState(
            createMockStore(
              mockNftCelebrationStore(NftCelebrationStatus.rewardDisplayed)
            ).getState()
          )
          .put(
            nftRewardReadyToDisplay({
              showReminder: true,
              valuesToSync: {
                rewardExpirationDate: mockRemoteConfig.rewardExpirationDate,
                rewardReminderDate: mockRemoteConfig.rewardReminderDate,
                deepLink: mockRemoteConfig.deepLink,
              },
            })
          )
          .run()
      })

      it('should set status "reminder ready" if celebration was displayed', async () => {
        const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

        jest.mocked(getFeatureGate).mockReturnValue(true)
        jest.mocked(getDynamicConfigParams).mockReturnValue(mockRemoteConfig)

        return expectSaga(nftSaga.findNftReward, mockAction)
          .withState(
            createMockStore(
              mockNftCelebrationStore(NftCelebrationStatus.rewardDisplayed)
            ).getState()
          )
          .put(
            nftRewardReadyToDisplay({
              showReminder: true,
              valuesToSync: {
                rewardExpirationDate: mockRemoteConfig.rewardExpirationDate,
                rewardReminderDate: mockRemoteConfig.rewardReminderDate,
                deepLink: mockRemoteConfig.deepLink,
              },
            })
          )
          .run()
      })

      it('should not set status "reminder ready" if celebration was not displayed', async () => {
        const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

        jest.mocked(getFeatureGate).mockReturnValue(true)
        jest.mocked(getDynamicConfigParams).mockReturnValue(mockRemoteConfig)

        return expectSaga(nftSaga.findNftReward, mockAction)
          .withState(
            createMockStore(
              mockNftCelebrationStore(NftCelebrationStatus.celebrationReadyToDisplay)
            ).getState()
          )
          .not.put.actionType(Actions.NFT_REWARD_READY_TO_DISPLAY)
          .run()
      })

      it('should not set status "reminder ready" again if reminder was displayed', async () => {
        const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

        jest.mocked(getFeatureGate).mockReturnValue(true)
        jest.mocked(getDynamicConfigParams).mockReturnValue(mockRemoteConfig)

        return expectSaga(nftSaga.findNftReward, mockAction)
          .withState(
            createMockStore(
              mockNftCelebrationStore(NftCelebrationStatus.reminderDisplayed)
            ).getState()
          )
          .not.put.actionType(Actions.NFT_REWARD_READY_TO_DISPLAY)
          .run()
      })

      it('should not set status "reward ready" if reminder is ready', async () => {
        const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

        jest.mocked(getFeatureGate).mockReturnValue(true)
        jest.mocked(getDynamicConfigParams).mockReturnValue(mockRemoteConfig)

        return expectSaga(nftSaga.findNftReward, mockAction)
          .withState(
            createMockStore(
              mockNftCelebrationStore(NftCelebrationStatus.reminderReadyToDisplay)
            ).getState()
          )
          .not.put(
            nftRewardReadyToDisplay({
              showReminder: false,
              valuesToSync: {
                rewardExpirationDate: mockRemoteConfig.rewardExpirationDate,
                rewardReminderDate: mockRemoteConfig.rewardReminderDate,
                deepLink: mockRemoteConfig.deepLink,
              },
            })
          )
          .run()
      })

      it('should not set status "reward ready" if reminder is displayed', async () => {
        const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

        jest.mocked(getFeatureGate).mockReturnValue(true)
        jest.mocked(getDynamicConfigParams).mockReturnValue(mockRemoteConfig)

        return expectSaga(nftSaga.findNftReward, mockAction)
          .withState(
            createMockStore(
              mockNftCelebrationStore(NftCelebrationStatus.reminderDisplayed)
            ).getState()
          )
          .not.put.actionType(Actions.NFT_REWARD_READY_TO_DISPLAY)
          .run()
      })
    })
  })

  describe('watchFirstFetchCompleted saga', () => {
    it('should call findCelebratedNft only once even if multiple fetchNftsCompleted actions are dispatched', async () => {
      const mockFindCelebratedNft = jest.fn()
      const mockFindNftReward = jest.fn()
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

      await expectSaga(watchFirstFetchCompleted)
        .withState(createMockStore().getState())
        .provide([[matchers.call.fn(nftSaga.findCelebratedNft), mockFindCelebratedNft()]])
        .provide([[matchers.call.fn(nftSaga.findNftReward), mockFindNftReward()]])
        .dispatch(mockAction)
        .dispatch(mockAction)
        .run()

      expect(mockFindCelebratedNft).toHaveBeenCalledTimes(1)
      expect(mockFindNftReward).toHaveBeenCalledTimes(1)
    })
  })
})
