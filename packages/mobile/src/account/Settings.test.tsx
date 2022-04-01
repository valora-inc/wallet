import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { BIOMETRY_TYPE } from 'react-native-keychain'
import { Provider } from 'react-redux'
import { setPincodeSuccess } from 'src/account/actions'
import { KycStatus, PincodeType } from 'src/account/reducer'
import Settings from 'src/account/Settings'
import { SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { removeStoredPin, setPincodeWithBiometry } from 'src/pincode/authentication'
import { Currency } from 'src/utils/currencies'
import { KomenciAvailable } from 'src/verify/reducer'
import { createMockStore, flushMicrotasksQueue, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockE164Number, mockE164NumberPepper } from 'test/values'

const mockedEnsurePincode = ensurePincode as jest.Mock

jest.mock('src/analytics/ValoraAnalytics')

describe('Account', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('renders correctly', () => {
    const tree = render(
      <Provider
        store={createMockStore({
          account: {
            e164PhoneNumber: mockE164Number,
          },
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
          stableToken: { balances: { [Currency.Dollar]: '0.00' } },
          goldToken: { balance: '0.00' },
          verify: {
            komenciAvailable: KomenciAvailable.Yes,
            komenci: { errorTimestamps: [] },
            status: {},
          },
        })}
      >
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when dev mode active', () => {
    const tree = render(
      <Provider
        store={createMockStore({
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
          stableToken: { balances: { [Currency.Dollar]: '0.00' } },
          goldToken: { balance: '0.00' },
          account: {
            devModeActive: true,
            e164PhoneNumber: mockE164Number,
          },
          verify: {
            komenci: { errorTimestamps: [] },
            komenciAvailable: KomenciAvailable.Yes,
            status: {},
          },
        })}
      >
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly when verification is not possible', () => {
    const now = Date.now()
    let tree = render(
      <Provider
        store={createMockStore({
          verify: { komenci: { errorTimestamps: [] }, status: {} },
        })}
      >
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
    tree = render(
      <Provider
        store={createMockStore({
          verify: {
            komenciAvailable: KomenciAvailable.Yes,
            komenci: { errorTimestamps: [now, now, now] },
            status: {},
          },
        })}
      >
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('navigates to PincodeSet screen if entered PIN is correct', async () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(true))
    fireEvent.press(tree.getByTestId('ChangePIN'))
    await flushMicrotasksQueue()
    expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet, {
      isVerifying: false,
      changePin: true,
    })
  })

  it('does not navigate to PincodeSet screen if entered PIN is incorrect', async () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(false))
    fireEvent.press(tree.getByTestId('ChangePIN'))
    await flushMicrotasksQueue()
    expect(navigate).not.toHaveBeenCalled()
  })

  describe('LinkedBankAccountSettings', () => {
    const baseStore = {
      account: {
        e164PhoneNumber: mockE164Number,
        kycStatus: undefined,
        hasLinkedBankAccount: false,
      },
      identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
      stableToken: { balances: { [Currency.Dollar]: '0.00' } },
      goldToken: { balance: '0.00' },
      verify: {
        komenciAvailable: KomenciAvailable.Yes,
        komenci: { errorTimestamps: [] },
        status: {},
      },
      app: {
        linkBankAccountEnabled: true,
        linkBankAccountStepTwoEnabled: true,
      },
      web3: {
        mtwAddress: mockAccount,
      },
    }
    it('does not render if not enabled', () => {
      const store = {
        ...baseStore,
        app: {
          ...baseStore.app,
          linkBankAccountEnabled: false,
        },
      }
      const { queryByTestId } = render(
        <Provider store={createMockStore(store)}>
          <Settings {...getMockStackScreenProps(Screens.Settings)} />
        </Provider>
      )
      expect(queryByTestId('linkBankAccountSettings')).toBeNull()
    })
    it('renders correctly if the user has not connected their phone', () => {
      const store = {
        ...baseStore,
        web3: {
          mtwAddress: null,
        },
      }
      const { getByTestId, queryByText } = render(
        <Provider store={createMockStore(store)}>
          <Settings {...getMockStackScreenProps(Screens.Settings)} />
        </Provider>
      )
      expect(queryByText('linkBankAccountSettingsTitle')).toBeTruthy()
      expect(queryByText('linkBankAccountSettingsValue')).toBeTruthy()

      fireEvent.press(getByTestId('linkBankAccountSettings'))
      expect(navigate).toHaveBeenCalledWith(Screens.LinkBankAccountScreen, {
        kycStatus: undefined,
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(SettingsEvents.settings_link_bank_account)
    })
    it('renders correctly if the user has not fully submitted their KYC info', () => {
      const store = {
        ...baseStore,
        account: {
          ...baseStore.account,
          kycStatus: KycStatus.Created,
        },
      }
      const { getByTestId, queryByText } = render(
        <Provider store={createMockStore(store)}>
          <Settings {...getMockStackScreenProps(Screens.Settings)} />
        </Provider>
      )
      expect(queryByText('linkBankAccountSettingsTitle')).toBeTruthy()
      expect(queryByText('linkBankAccountSettingsValue')).toBeTruthy()

      fireEvent.press(getByTestId('linkBankAccountSettings'))
      expect(navigate).toHaveBeenCalledWith(Screens.LinkBankAccountScreen, {
        kycStatus: KycStatus.Created,
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(SettingsEvents.settings_link_bank_account)
    })
    it('renders correctly if the user has gone through KYC but not yet approved', () => {
      const store = {
        ...baseStore,
        account: {
          ...baseStore.account,
          kycStatus: KycStatus.Declined,
        },
      }
      const { getByTestId, queryByText } = render(
        <Provider store={createMockStore(store)}>
          <Settings {...getMockStackScreenProps(Screens.Settings)} />
        </Provider>
      )
      expect(queryByText('linkBankAccountSettingsTitle')).toBeTruthy()
      expect(queryByText('linkBankAccountSettingsValue')).toBeNull()

      fireEvent.press(getByTestId('linkBankAccountSettings'))
      expect(navigate).toHaveBeenCalledWith(Screens.LinkBankAccountScreen, {
        kycStatus: KycStatus.Declined,
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(SettingsEvents.settings_link_bank_account)
    })
    it('renders correctly if the user has been approved by KYC but step two is not enabled', () => {
      const store = {
        ...baseStore,
        account: {
          ...baseStore.account,
          kycStatus: KycStatus.Approved,
          finclusiveRegionSupported: true,
        },
        app: {
          ...baseStore.app,
          linkBankAccountStepTwoEnabled: false,
        },
      }
      const { getByTestId, queryByText } = render(
        <Provider store={createMockStore(store)}>
          <Settings {...getMockStackScreenProps(Screens.Settings)} />
        </Provider>
      )
      expect(queryByText('linkBankAccountSettingsTitle')).toBeTruthy()
      expect(queryByText('linkBankAccountSettingsValue')).toBeNull()

      fireEvent.press(getByTestId('linkBankAccountSettings'))
      expect(navigate).toHaveBeenCalledWith(Screens.LinkBankAccountScreen, {
        kycStatus: KycStatus.Approved,
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(SettingsEvents.settings_link_bank_account)
    })
    it('renders correctly if the user has been approved by KYC, step two is enabled but user region not supported yet', () => {
      const store = {
        ...baseStore,
        account: {
          ...baseStore.account,
          kycStatus: KycStatus.Approved,
          finclusiveRegionSupported: false,
        },
        app: {
          ...baseStore.app,
          linkBankAccountStepTwoEnabled: false,
        },
      }
      const { getByTestId, queryByText } = render(
        <Provider store={createMockStore(store)}>
          <Settings {...getMockStackScreenProps(Screens.Settings)} />
        </Provider>
      )
      expect(queryByText('linkBankAccountSettingsTitle')).toBeTruthy()
      expect(queryByText('linkBankAccountSettingsValue')).toBeNull()

      fireEvent.press(getByTestId('linkBankAccountSettings'))
      expect(navigate).toHaveBeenCalledWith(Screens.LinkBankAccountScreen, {
        kycStatus: KycStatus.Approved,
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(SettingsEvents.settings_link_bank_account)
    })
    it('renders correctly if the user has been approved by KYC and step two is enabled', () => {
      const store = {
        ...baseStore,
        account: {
          ...baseStore.account,
          kycStatus: KycStatus.Approved,
          finclusiveRegionSupported: true,
        },
        app: {
          ...baseStore.app,
          linkBankAccountStepTwoEnabled: true,
        },
      }
      const { getByTestId, queryByText } = render(
        <Provider store={createMockStore(store)}>
          <Settings {...getMockStackScreenProps(Screens.Settings)} />
        </Provider>
      )
      expect(queryByText('linkBankAccountSettingsTitle')).toBeTruthy()
      expect(queryByText('linkBankAccountSettingsValue2')).toBeTruthy()

      fireEvent.press(getByTestId('linkBankAccountSettings'))
      expect(navigate).toHaveBeenCalledWith(Screens.LinkBankAccountScreen, {
        kycStatus: KycStatus.Approved,
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(SettingsEvents.settings_link_bank_account)
    })
    it('renders correctly if the user has gone through the plaid flow and added a bank account', () => {
      const store = {
        ...baseStore,
        account: {
          ...baseStore.account,
          kycStatus: KycStatus.Approved,
          hasLinkedBankAccount: true,
          finclusiveRegionSupported: true,
        },
        app: {
          ...baseStore.app,
          linkBankAccountStepTwoEnabled: true,
        },
      }
      const { getByTestId, queryByText } = render(
        <Provider store={createMockStore(store)}>
          <Settings {...getMockStackScreenProps(Screens.Settings)} />
        </Provider>
      )
      expect(queryByText('linkBankAccountSettingsTitle')).toBeTruthy()
      expect(queryByText('linkBankAccountSettingsValue')).toBeNull()
      expect(queryByText('linkBankAccountSettingsValue2')).toBeNull()

      fireEvent.press(getByTestId('linkBankAccountSettings'))
      expect(navigate).toHaveBeenCalledWith(Screens.BankAccounts, {})
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(SettingsEvents.settings_link_bank_account)
    })
  })

  it('toggle the biometry option correctly', async () => {
    const store = createMockStore({
      app: {
        supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
        biometryEnabled: true,
      },
      account: {
        pincodeType: PincodeType.CustomPin,
      },
    })
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )

    fireEvent(getByTestId('useBiometryToggle'), 'valueChange', true)
    await flushMicrotasksQueue()

    expect(getByText('useBiometryType, {"biometryType":"biometryType.FaceID"}')).toBeTruthy()
    expect(setPincodeWithBiometry).toHaveBeenCalledTimes(1)
    expect(store.getActions()).toEqual(
      expect.arrayContaining([setPincodeSuccess(PincodeType.PhoneAuth)])
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SettingsEvents.settings_biometry_opt_in_enable
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SettingsEvents.settings_biometry_opt_in_complete
    )

    fireEvent(getByTestId('useBiometryToggle'), 'valueChange', false)
    await flushMicrotasksQueue()

    expect(removeStoredPin).toHaveBeenCalledTimes(1)
    expect(store.getActions()).toEqual(
      expect.arrayContaining([setPincodeSuccess(PincodeType.CustomPin)])
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SettingsEvents.settings_biometry_opt_in_disable
    )
  })
})
