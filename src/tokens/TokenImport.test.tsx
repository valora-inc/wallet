import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
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
    const { getByText } = render(
      <Provider store={store}>
        <TokenImportScreen {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(getByText('tokenImport.input.tokenAddress'), '0x123')
    fireEvent.changeText(getByText('tokenImport.input.tokenSymbol'), 'ABC')

    const importButton = getByText('tokenImport.importButton')
    expect(importButton.props.disabled).toBeFalsy()
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
    fireEvent.changeText(tokenAddressInput, '0xABC')
    expect(tokenAddressInput.props.value).toBe('0xABC')
  })

  it('makes token symbol editable when valid token address used', () => {
    const store = createMockStore({})
    const { getByPlaceholderText, getByTestId } = render(
      <Provider store={store}>
        <TokenImportScreen {...mockScreenProps} />
      </Provider>
    )
    const symbolInput = getByTestId('tokenSymbol')
    expect(symbolInput.props.editable).toBeFalsy()
    fireEvent.changeText(
      getByPlaceholderText('tokenImport.input.tokenAddressPlaceholder'),
      '0xef4229c8c3250C675F21BCefa42f58EfbfF6002a'
    )

    expect(symbolInput.props.editable).toBeTruthy()
  })
})
