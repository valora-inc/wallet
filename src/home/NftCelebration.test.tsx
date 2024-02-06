import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig/index'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import { mockContractAddress, mockNftAllFields } from 'test/values'
import NftCelebration from './NftCelebration'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig')

const mockNft = {
  ...mockNftAllFields,
  networkId: NetworkId['celo-alfajores'],
}

const mockStoreWithNft = {
  nfts: {
    nfts: [mockNft],
    nftsLoading: false,
    nftsError: null,
  },
}

const mockStoreWithoutNft = {
  nfts: {
    nfts: [],
    nftsLoading: false,
    nftsError: null,
  },
}

describe('NftCelebration', () => {
  beforeEach(() => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      celo: { nftContractAddress: mockContractAddress },
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly when it should', () => {
    const { getByText } = render(
      <Provider store={createMockStore(mockStoreWithNft)}>
        <NftCelebration />
      </Provider>
    )

    expect(getByText('nftCelebration.bottomSheet.title')).toBeTruthy()
    expect(getByText('nftCelebration.bottomSheet.description')).toBeTruthy()
    expect(getByText('nftCelebration.bottomSheet.cta')).toBeTruthy()
  })

  it('does not render when user has no nfts', () => {
    const { queryByText } = render(
      <Provider store={createMockStore(mockStoreWithoutNft)}>
        <NftCelebration />
      </Provider>
    )

    expect(queryByText('nftCelebration.bottomSheet.title')).toBeNull()
    expect(queryByText('nftCelebration.bottomSheet.description')).toBeNull()
    expect(queryByText('nftCelebration.bottomSheet.cta')).toBeNull()
  })

  it('does not render when celebrated contract does not match with user nft', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      celo: { nftContractAddress: '0xOTHER' },
    })

    const { queryByText } = render(
      <Provider store={createMockStore(mockStoreWithNft)}>
        <NftCelebration />
      </Provider>
    )

    expect(queryByText('nftCelebration.bottomSheet.title')).toBeNull()
    expect(queryByText('nftCelebration.bottomSheet.description')).toBeNull()
    expect(queryByText('nftCelebration.bottomSheet.cta')).toBeNull()
  })

  it('does not render feature gate is closed', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)

    const { queryByText } = render(
      <Provider store={createMockStore(mockStoreWithNft)}>
        <NftCelebration />
      </Provider>
    )

    expect(queryByText('nftCelebration.bottomSheet.title')).toBeNull()
    expect(queryByText('nftCelebration.bottomSheet.description')).toBeNull()
    expect(queryByText('nftCelebration.bottomSheet.cta')).toBeNull()
  })

  it('does not render when user has alredy seen celebration for this contract', () => {
    const { queryByText } = render(
      <Provider
        store={createMockStore({
          ...mockStoreWithNft,
          home: {
            lastDisplayedNftCelebration: mockContractAddress,
          },
        })}
      >
        <NftCelebration />
      </Provider>
    )

    expect(queryByText('nftCelebration.bottomSheet.title')).toBeNull()
    expect(queryByText('nftCelebration.bottomSheet.description')).toBeNull()
    expect(queryByText('nftCelebration.bottomSheet.cta')).toBeNull()
  })
})
