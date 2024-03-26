import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import MultiSelectBottomSheet from 'src/components/multiSelect/MultiSelectBottomSheet'
import NetworkMultiSelectBottomSheet from 'src/components/multiSelect/NetworkMultiSelectBottomSheet'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import { mockCusdTokenId, mockEthTokenId, mockTokenBalances } from 'test/values'

jest.mock('src/components/multiSelect/MultiSelectBottomSheet')

describe('NetworkMultiSelectBottomSheet', () => {
  it('calls MultiSelectBottomSheet with the correct props', () => {
    const setSelectedNetworkIds = jest.fn()
    const forwardedRef = { current: null }
    const onClose = jest.fn()
    const onOpen = jest.fn()
    const allNetworkIds = [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']]
    const selectedNetworkIds = [NetworkId['celo-alfajores']]
    const expectedOptions = [
      {
        text: 'Celo Alfajores',
        iconUrl: 'url-for-cusd-icon',
        id: NetworkId['celo-alfajores'],
      },
      {
        text: 'Ethereum Sepolia',
        iconUrl: 'url-for-eth-icon',
        id: NetworkId['ethereum-sepolia'],
      },
    ]

    render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              ...mockTokenBalances,
              [mockCusdTokenId]: {
                ...mockTokenBalances[mockCusdTokenId],
                networkIconUrl: 'url-for-cusd-icon',
              },
              [mockEthTokenId]: {
                ...mockTokenBalances[mockEthTokenId],
                networkIconUrl: 'url-for-eth-icon',
              },
            },
          },
        })}
      >
        <NetworkMultiSelectBottomSheet
          forwardedRef={forwardedRef}
          onClose={onClose}
          onOpen={onOpen}
          allNetworkIds={allNetworkIds}
          selectedNetworkIds={selectedNetworkIds}
          setSelectedNetworkIds={setSelectedNetworkIds}
        />
      </Provider>
    )

    expect(MultiSelectBottomSheet).toHaveBeenCalledWith(
      {
        forwardedRef,
        onClose,
        onOpen,
        selectedOptions: [NetworkId['celo-alfajores']],
        setSelectedOptions: expect.any(Function),
        options: expectedOptions,
        selectAllText: 'multiSelect.allNetworks',
        title: 'multiSelect.switchNetwork',
      },
      {}
    )
  })
})
