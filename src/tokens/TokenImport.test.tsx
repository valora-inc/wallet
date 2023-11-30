import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import { getTokenId } from 'src/tokens/utils'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockCusdAddress, mockPoofAddress } from 'test/values'
import TokenImportScreen from './TokenImport'

const mockScreenProps = getMockStackScreenProps(Screens.TokenImport)

describe('TokenImport', () => {
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

  it('enables the import button when form is filled', () => {
    const store = createMockStore({})
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <Provider store={store}>
        <TokenImportScreen {...mockScreenProps} />
      </Provider>
    )

    const tokenAddressInput = getByPlaceholderText('tokenImport.input.tokenAddressPlaceholder')
    fireEvent.changeText(tokenAddressInput, mockPoofAddress)
    expect(getByTestId('tokenSymbol')).toBeDisabled()
    fireEvent(tokenAddressInput, 'blur')

    expect(getByTestId('tokenSymbol')).toBeEnabled()
    expect(getByText('tokenImport.importButton')).toBeDisabled()
    fireEvent.changeText(getByTestId('tokenSymbol'), 'ABC')

    expect(getByText('tokenImport.importButton')).toBeEnabled()
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
    expect(tokenAddressInput.props.value).toBe('0xABC')
  })

  it('makes token symbol editable when valid token address used', () => {
    const store = createMockStore({})
    const { getByPlaceholderText, getByTestId } = render(
      <Provider store={store}>
        <TokenImportScreen {...mockScreenProps} />
      </Provider>
    )

    expect(getByTestId('tokenSymbol')).toBeDisabled()
    const tokenAddressInput = getByPlaceholderText('tokenImport.input.tokenAddressPlaceholder')
    fireEvent.changeText(tokenAddressInput, mockPoofAddress)
    fireEvent(tokenAddressInput, 'blur')

    expect(getByTestId('tokenSymbol')).toBeEnabled()
  })

  describe('renderErrorMessage when token address', () => {
    it('is already supported', () => {
      const store = createMockStore({})
      const { getByText } = render(
        <Provider store={store}>
          <TokenImportScreen {...mockScreenProps} />
        </Provider>
      )

      fireEvent.changeText(getByText('tokenImport.input.tokenAddress'), mockCusdAddress)
      fireEvent(getByText('tokenImport.input.tokenAddress'), 'blur')

      expect(getByText('tokenImport.error.alreadySupported')).toBeTruthy()
      expect(getByText('tokenImport.importButton')).toBeDisabled()
    })

    it('is already imported', () => {
      const store = createMockStore({
        tokens: {
          importedTokenIds: [getTokenId(networkConfig.defaultNetworkId, mockPoofAddress)],
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <TokenImportScreen {...mockScreenProps} />
        </Provider>
      )

      fireEvent.changeText(getByText('tokenImport.input.tokenAddress'), mockPoofAddress)
      fireEvent(getByText('tokenImport.input.tokenAddress'), 'blur')

      expect(getByText('tokenImport.error.alreadyImported')).toBeTruthy()
      expect(getByText('tokenImport.importButton')).toBeDisabled()
    })

    it('is invalid', () => {
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
  })
})
