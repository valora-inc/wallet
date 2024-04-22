import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { firstOnboardingScreen } from 'src/onboarding/steps'
import Welcome from 'src/onboarding/welcome/Welcome'
import { getExperimentParams, patchUpdateStatsigUser } from 'src/statsig'
import { createMockStore } from 'test/utils'

jest.mock('src/onboarding/steps')
jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn(),
  patchUpdateStatsigUser: jest.fn(),
}))

describe('Welcome', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => 123)
    jest.mocked(firstOnboardingScreen).mockReturnValue(Screens.PincodeSet)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe.each([{ variant: 'control' }, { variant: 'colloquial_terms' }])(
    '$variant',
    ({ variant }) => {
      beforeAll(() => {
        jest.mocked(getExperimentParams).mockReturnValue({ variant })
      })
      it('renders components', async () => {
        const store = createMockStore()
        const { getByTestId, queryByTestId } = render(
          <Provider store={store}>
            <Welcome />
          </Provider>
        )
        expect(getByTestId('CreateAccountButton')).toBeTruthy()
        expect(getByTestId('RestoreAccountButton')).toBeTruthy()
        expect(queryByTestId('TermsCheckbox/unchecked')).toBeFalsy()
        expect(queryByTestId('TermsCheckbox/checked')).toBeFalsy()
      })
      it('create updates statsig, fires action and navigates to terms screen for first time onboarding', async () => {
        const store = createMockStore()
        const { getByTestId } = render(
          <Provider store={store}>
            <Welcome />
          </Provider>
        )

        fireEvent.press(getByTestId('CreateAccountButton'))
        await waitFor(() =>
          expect(patchUpdateStatsigUser).toHaveBeenCalledWith({
            custom: { startOnboardingTime: 123 },
          })
        )
        expect(store.getActions()).toMatchInlineSnapshot(`
        [
          {
            "now": 123,
            "type": "ACCOUNT/CHOOSE_CREATE",
          },
        ]
      `)
        expect(navigate).toHaveBeenCalledTimes(1)
        expect(navigate).toHaveBeenCalledWith(Screens.RegulatoryTerms)
      })
      it('create skips statsig update if not onboarding the first time', () => {
        const store = createMockStore({
          account: {
            startOnboardingTime: 145,
          },
        })
        const { getByTestId } = render(
          <Provider store={store}>
            <Welcome />
          </Provider>
        )

        fireEvent.press(getByTestId('CreateAccountButton'))
        expect(store.getActions()).toMatchInlineSnapshot(`
        [
          {
            "now": 123,
            "type": "ACCOUNT/CHOOSE_CREATE",
          },
        ]
      `)
        expect(navigate).toHaveBeenCalledTimes(1)
        expect(navigate).toHaveBeenCalledWith(Screens.RegulatoryTerms)
        expect(patchUpdateStatsigUser).not.toHaveBeenCalled()
      })
      it('restore fires action and navigates to terms screen', () => {
        const store = createMockStore()
        const { getByTestId } = render(
          <Provider store={store}>
            <Welcome />
          </Provider>
        )

        fireEvent.press(getByTestId('RestoreAccountButton'))
        expect(navigate).toHaveBeenCalledTimes(1)
        expect(navigate).toHaveBeenCalledWith(Screens.RegulatoryTerms)
        expect(store.getActions()).toMatchInlineSnapshot(`
        [
          {
            "type": "ACCOUNT/CHOOSE_RESTORE",
          },
        ]
      `)
      })
      it.each([{ buttonId: 'CreateAccountButton' }, { buttonId: 'RestoreAccountButton' }])(
        '$buttonId goes to the onboarding screen if terms already accepted',
        ({ buttonId }) => {
          const store = createMockStore({
            account: {
              acceptedTerms: true,
              startOnboardingTime: 145,
            },
          })
          const { getByTestId } = render(
            <Provider store={store}>
              <Welcome />
            </Provider>
          )

          fireEvent.press(getByTestId(buttonId))
          expect(firstOnboardingScreen).toHaveBeenCalled()
          expect(navigate).toHaveBeenCalledTimes(1)
          expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet)
        }
      )
    }
  )

  describe('checkbox', () => {
    beforeAll(() => {
      jest.mocked(getExperimentParams).mockReturnValue({ variant: 'checkbox' })
    })

    it('renders correctly', async () => {
      const store = createMockStore()
      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <Welcome />
        </Provider>
      )
      expect(getByTestId('CreateAccountButton')).toBeTruthy()
      expect(getByTestId('RestoreAccountButton')).toBeTruthy()
      expect(getByTestId('TermsCheckbox/unchecked')).toBeTruthy()
      expect(queryByTestId('TermsCheckbox/checked')).toBeFalsy()
    })

    it('checkbox toggles buttons', async () => {
      const store = createMockStore()
      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <Welcome />
        </Provider>
      )
      expect(getByTestId('TermsCheckbox/unchecked')).toBeTruthy()
      expect(queryByTestId('TermsCheckbox/checked')).toBeFalsy()
      expect(getByTestId('CreateAccountButton')).toBeDisabled()
      expect(getByTestId('RestoreAccountButton')).toBeDisabled()

      fireEvent.press(getByTestId('TermsCheckbox/unchecked'))

      expect(getByTestId('TermsCheckbox/checked')).toBeTruthy()
      expect(queryByTestId('TermsCheckbox/unchecked')).toBeFalsy()
      expect(getByTestId('CreateAccountButton')).toBeEnabled()
      expect(getByTestId('RestoreAccountButton')).toBeEnabled()

      fireEvent.press(getByTestId('TermsCheckbox/checked'))

      expect(getByTestId('TermsCheckbox/unchecked')).toBeTruthy()
      expect(queryByTestId('TermsCheckbox/checked')).toBeFalsy()
      expect(getByTestId('CreateAccountButton')).toBeDisabled()
      expect(getByTestId('RestoreAccountButton')).toBeDisabled()
    })

    it('create updates statsig, fires actions and navigates to onboarding screen for first time onboarding', async () => {
      const store = createMockStore()
      const { getByTestId } = render(
        <Provider store={store}>
          <Welcome />
        </Provider>
      )
      fireEvent.press(getByTestId('TermsCheckbox/unchecked'))
      fireEvent.press(getByTestId('CreateAccountButton'))
      await waitFor(() =>
        expect(patchUpdateStatsigUser).toHaveBeenCalledWith({
          custom: { startOnboardingTime: 123 },
        })
      )
      expect(store.getActions()).toMatchInlineSnapshot(`
        [
          {
            "now": 123,
            "type": "ACCOUNT/CHOOSE_CREATE",
          },
          {
            "type": "ACCOUNT/ACCEPT_TERMS",
          },
        ]
      `)
      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet)
    })

    it('create skips statsig if not first time onboarding', async () => {
      const store = createMockStore({
        account: {
          startOnboardingTime: 145,
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <Welcome />
        </Provider>
      )
      fireEvent.press(getByTestId('TermsCheckbox/unchecked'))
      fireEvent.press(getByTestId('CreateAccountButton'))
      expect(store.getActions()).toMatchInlineSnapshot(`
        [
          {
            "now": 123,
            "type": "ACCOUNT/CHOOSE_CREATE",
          },
          {
            "type": "ACCOUNT/ACCEPT_TERMS",
          },
        ]
      `)
      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet)
      expect(patchUpdateStatsigUser).not.toHaveBeenCalled()
    })

    it('restore fires actions and navigates to onboarding screen', () => {
      const store = createMockStore()
      const { getByTestId } = render(
        <Provider store={store}>
          <Welcome />
        </Provider>
      )
      fireEvent.press(getByTestId('TermsCheckbox/unchecked'))
      fireEvent.press(getByTestId('RestoreAccountButton'))
      expect(store.getActions()).toMatchInlineSnapshot(`
        [
          {
            "type": "ACCOUNT/CHOOSE_RESTORE",
          },
          {
            "type": "ACCOUNT/ACCEPT_TERMS",
          },
        ]
      `)
      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet)
    })
  })
})
