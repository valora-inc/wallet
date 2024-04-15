import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RegulatoryTerms as RegulatoryTermsClass } from 'src/onboarding/registration/RegulatoryTerms'
import { firstOnboardingScreen } from 'src/onboarding/steps'
import { createMockStore, getMockI18nProps } from 'test/utils'

jest.mock('src/navigator/NavigationService', () => {
  return { navigate: jest.fn() }
})
jest.mock('src/onboarding/steps')

describe('RegulatoryTermsScreen', () => {
  describe('when accept button is pressed', () => {
    it('stores that info', async () => {
      const store = createMockStore({})
      const acceptTerms = jest.fn()
      const wrapper = render(
        <Provider store={store}>
          <RegulatoryTermsClass
            {...getMockI18nProps()}
            acceptTerms={acceptTerms}
            recoveringFromStoreWipe={false}
          />
        </Provider>
      )
      fireEvent.press(wrapper.getByTestId('AcceptTermsButton'))
      expect(acceptTerms).toHaveBeenCalled()
    })
    it('navigates to PincodeSet', () => {
      const store = createMockStore({})
      const acceptTerms = jest.fn()
      jest.mocked(firstOnboardingScreen).mockReturnValue(Screens.PincodeSet)

      const wrapper = render(
        <Provider store={store}>
          <RegulatoryTermsClass
            {...getMockI18nProps()}
            acceptTerms={acceptTerms}
            recoveringFromStoreWipe={false}
          />
        </Provider>
      )
      fireEvent.press(wrapper.getByTestId('AcceptTermsButton'))
      expect(firstOnboardingScreen).toHaveBeenCalled()
      expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet)
    })
  })
})
