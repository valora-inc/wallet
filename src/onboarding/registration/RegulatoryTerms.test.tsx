import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RegulatoryTerms as RegulatoryTermsClass } from 'src/onboarding/registration/RegulatoryTerms'
import { firstOnboardingScreen } from 'src/onboarding/steps'
import { getExperimentParams } from 'src/statsig'
import { createMockStore, getMockI18nProps } from 'test/utils'

jest.mock('src/onboarding/steps')
jest.mock('src/statsig')

describe('RegulatoryTermsScreen', () => {
  const acceptTerms = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('renders correct components for control', () => {
    jest.mocked(getExperimentParams).mockReturnValue({ variant: 'control' })
    const store = createMockStore({})
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <RegulatoryTermsClass
          {...getMockI18nProps()}
          acceptTerms={acceptTerms}
          recoveringFromStoreWipe={false}
        />
      </Provider>
    )

    expect(getByTestId('scrollView')).toBeTruthy()
    expect(queryByTestId('colloquialTermsSectionList')).toBeFalsy()
  })

  it('renders correct components for colloquial_terms', () => {
    jest.mocked(getExperimentParams).mockReturnValue({ variant: 'colloquial_terms' })
    const store = createMockStore({})
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <RegulatoryTermsClass
          {...getMockI18nProps()}
          acceptTerms={acceptTerms}
          recoveringFromStoreWipe={false}
        />
      </Provider>
    )

    expect(getByTestId('colloquialTermsSectionList')).toBeTruthy()
    expect(queryByTestId('scrollView')).toBeFalsy()
  })

  describe.each([{ variant: 'control' }, { variant: 'colloquial_terms' }])(
    'when accept button is pressed ($variant)',
    ({ variant }) => {
      beforeAll(() => {
        jest.mocked(getExperimentParams).mockReturnValue({ variant })
      })
      it('stores that info', async () => {
        const store = createMockStore({})
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
    }
  )
})
