import { Countries } from '@celo/utils/lib/countries'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import i18n from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import SelectCountry from 'src/onboarding/registration/SelectCountry'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = getMockStackScreenProps(Screens.SelectCountry, {
  countries: new Countries(i18n.language),
  selectedCountryCodeAlpha2: 'DE',
  hideOnboardingStep: false,
})

describe('SelectCountry', () => {
  it('does not render sanctioned countries', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <SelectCountry {...mockScreenProps} />
      </Provider>
    )
    // Germany shows up
    fireEvent.changeText(tree.getByTestId('SearchInput'), 'Germany')
    expect(tree.queryByText('Germany')).not.toBeNull()
    // Syria does not
    fireEvent.changeText(tree.getByTestId('SearchInput'), 'Syria')
    expect(tree.queryByText('Syria')).toBeNull()
    // Iran does not
    fireEvent.changeText(tree.getByTestId('SearchInput'), 'Iran')
    expect(tree.queryByText('Syria')).toBeNull()
    // North Korea does not
    fireEvent.changeText(tree.getByTestId('SearchInput'), 'North Korea')
    expect(tree.queryByText('North Korea')).toBeNull()
  })
})
