import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockCusdAddress } from 'test/values'
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

  describe('error messages for token address', () => {
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
