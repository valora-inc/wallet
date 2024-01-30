import { fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import erc20 from 'src/abis/IERC20'
import { Screens } from 'src/navigator/Screens'
import { importToken } from 'src/tokens/slice'
import { Network, NetworkId } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockCusdAddress, mockPoofAddress } from 'test/values'
import {
  CallExecutionError,
  ContractFunctionExecutionError,
  GetContractReturnType,
  PublicClient,
  TimeoutError,
  getContract,
} from 'viem'
import TokenImportScreen from './TokenImport'
import mocked = jest.mocked

jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  getContract: jest.fn(),
}))

const mockScreenProps = getMockStackScreenProps(Screens.TokenImport)

describe('TokenImport', () => {
  const mockBytecode = jest.fn()
  const mockSymbol = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    const client = publicClient[Network.Celo]

    client.getBytecode = mockBytecode.mockResolvedValue('0xabc')
    mocked(getContract).mockReturnValue({
      read: {
        symbol: mockSymbol.mockResolvedValue('ABC'),
        decimals: jest.fn().mockResolvedValue(18),
        name: jest.fn().mockResolvedValue('ABC Coin'),
        balanceOf: jest.fn().mockResolvedValue(BigInt('500000000000000000')),
      },
    } as unknown as GetContractReturnType<typeof erc20.abi, PublicClient>)
  })

  it('renders correctly', () => {
    const store = createMockStore({})
    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <TokenImportScreen {...mockScreenProps} />
      </Provider>
    )

    expect(getByText('tokenImport.input.tokenAddress')).toBeTruthy()
    expect(getByPlaceholderText('tokenImport.input.tokenAddressPlaceholder')).toBeTruthy()
    expect(getByText('tokenImport.input.tokenSymbol')).toBeTruthy()
    expect(getByText('tokenImport.input.network')).toBeTruthy()
    expect(getByText('tokenImport.importButton')).toBeTruthy()
  })

  it('enables the import button when form is filled', async () => {
    const store = createMockStore({})
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <Provider store={store}>
        <TokenImportScreen {...mockScreenProps} />
      </Provider>
    )
    const tokenAddressInput = getByPlaceholderText('tokenImport.input.tokenAddressPlaceholder')
    const tokenSymbolInput = getByTestId('tokenSymbol')
    const importButton = getByText('tokenImport.importButton')

    fireEvent.changeText(tokenAddressInput, mockPoofAddress)
    expect(tokenSymbolInput).toBeDisabled()
    expect(importButton).toBeDisabled()
    fireEvent(tokenAddressInput, 'blur')

    await waitFor(() => expect(tokenSymbolInput.props.value).toBe('ABC'))
    expect(importButton).toBeEnabled()
  })

  it('updates the token address input when changed', () => {
    const store = createMockStore({})
    const { getByPlaceholderText } = render(
      <Provider store={store}>
        <TokenImportScreen {...mockScreenProps} />
      </Provider>
    )
    const tokenAddressInput = getByPlaceholderText('tokenImport.input.tokenAddressPlaceholder')
    expect(tokenAddressInput.props.value).toBe('')

    fireEvent.changeText(tokenAddressInput, 'ABC')
    fireEvent(tokenAddressInput, 'blur')
    expect(tokenAddressInput.props.value).toBe('0xABC')
  })

  it('should dispatch the correct action on import', async () => {
    const store = createMockStore({})
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <Provider store={store}>
        <TokenImportScreen {...mockScreenProps} />
      </Provider>
    )
    const tokenAddressInput = getByPlaceholderText('tokenImport.input.tokenAddressPlaceholder')
    const tokenSymbolInput = getByTestId('tokenSymbol')
    const importButton = getByText('tokenImport.importButton')

    fireEvent.changeText(tokenAddressInput, mockPoofAddress)
    expect(tokenSymbolInput).toBeDisabled()
    expect(importButton).toBeDisabled()
    fireEvent(tokenAddressInput, 'blur')

    await waitFor(() => expect(tokenSymbolInput.props.value).toBe('ABC'))
    expect(importButton).toBeEnabled()
    fireEvent.press(importButton)
    expect(store.getActions()[0]).toEqual(
      importToken({
        address: mockPoofAddress,
        balance: '0.5',
        symbol: 'ABC',
        name: 'ABC Coin',
        decimals: 18,
        networkId: NetworkId['celo-alfajores'],
        tokenId: `celo-alfajores:${mockPoofAddress}`,
      })
    )
  })

  describe('error messages for token address', () => {
    it('should display the correct error when the token is already supported', () => {
      const store = createMockStore({})
      const { getByText } = render(
        <Provider store={store}>
          <TokenImportScreen {...mockScreenProps} />
        </Provider>
      )

      fireEvent.changeText(getByText('tokenImport.input.tokenAddress'), mockCusdAddress)
      fireEvent(getByText('tokenImport.input.tokenAddress'), 'blur')

      expect(getByText('tokenImport.error.invalidToken')).toBeTruthy()
      expect(getByText('tokenImport.importButton')).toBeDisabled()
    })

    it('should display the correct error when the token address is invalid', () => {
      const store = createMockStore({})
      const { getByText } = render(
        <Provider store={store}>
          <TokenImportScreen {...mockScreenProps} />
        </Provider>
      )

      fireEvent.changeText(getByText('tokenImport.input.tokenAddress'), 'invalid')
      fireEvent(getByText('tokenImport.input.tokenAddress'), 'blur')

      expect(getByText('tokenImport.error.invalidToken')).toBeTruthy()
      expect(getByText('tokenImport.importButton')).toBeDisabled()
    })

    it('should display the correct error when the token does not implement ERC-20', async () => {
      mockSymbol.mockRejectedValue(new Error('e.g. ContractFunctionZeroDataError'))
      const store = createMockStore({})
      const { getByText, getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <TokenImportScreen {...mockScreenProps} />
        </Provider>
      )
      const tokenAddressInput = getByPlaceholderText('tokenImport.input.tokenAddressPlaceholder')
      const tokenSymbolInput = getByTestId('tokenSymbol')
      const importButton = getByText('tokenImport.importButton')

      fireEvent.changeText(tokenAddressInput, mockPoofAddress)
      expect(tokenSymbolInput).toBeDisabled()
      expect(importButton).toBeDisabled()
      fireEvent(tokenAddressInput, 'blur')

      expect(tokenSymbolInput).toBeDisabled()
      await waitFor(() => expect(getByText('tokenImport.error.invalidToken')).toBeTruthy())
      expect(importButton).toBeDisabled()
    })

    it('should display the correct error message due to network timeout', async () => {
      jest.useFakeTimers()
      mockBytecode.mockResolvedValue('0xb0babeef')
      mockSymbol.mockImplementation(
        () =>
          new Promise((_, reject) => {
            const timeoutError = new TimeoutError({ body: {}, url: '' })
            const callExecution = new CallExecutionError(timeoutError, {})
            const contractFunctionExecutionError = new ContractFunctionExecutionError(
              callExecution,
              {
                abi: erc20.abi,
                args: [],
                contractAddress: '0x7d91E51C8F218f7140188A155f5C75388630B6a8',
                functionName: 'symbol',
              }
            )
            setTimeout(() => reject(contractFunctionExecutionError), 5_000)
          })
      )

      const store = createMockStore({})
      const { getByText, getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <TokenImportScreen {...mockScreenProps} />
        </Provider>
      )
      const tokenAddressInput = getByPlaceholderText('tokenImport.input.tokenAddressPlaceholder')
      const tokenSymbolInput = getByTestId('tokenSymbol')
      const importButton = getByText('tokenImport.importButton')

      fireEvent.changeText(tokenAddressInput, mockPoofAddress)
      expect(tokenSymbolInput).toBeDisabled()
      expect(importButton).toBeDisabled()
      fireEvent(tokenAddressInput, 'blur')

      await waitFor(() => {
        jest.advanceTimersToNextTimer()
        expect(getByText('tokenImport.error.invalidToken')).toBeTruthy()
      })
      expect(tokenSymbolInput).toBeDisabled()
      expect(importButton).toBeDisabled()
    })
  })
})
