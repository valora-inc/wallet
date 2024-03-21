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
    const selectedNetworkIds = {
      [NetworkId['celo-alfajores']]: true,
      [NetworkId['ethereum-sepolia']]: false,
    } as Record<NetworkId, boolean>
    const expectedTextAndIconMap = {
      [NetworkId['celo-alfajores']]: { text: 'Celo Alfajores', iconUrl: 'url-for-cusd-icon' },
      [NetworkId['ethereum-sepolia']]: { text: 'Ethereum Sepolia', iconUrl: 'url-for-eth-icon' },
    }

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
        selectedItems: selectedNetworkIds,
        setSelectedItems: setSelectedNetworkIds,
        textAndIconMap: expectedTextAndIconMap,
        selectAllText: 'multiSelect.allNetworks',
        title: 'multiSelect.switchNetwork',
      },
      {}
    )
  })
})
