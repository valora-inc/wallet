import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as AccountActions from 'src/account/actions'
import { CreateAccountCopyTestType } from 'src/app/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NameAndPicture from 'src/onboarding/registration/NameAndPicture'
import * as NameGenerator from 'src/onboarding/registration/NameGenerator'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockNavigation } from 'test/values'

jest.mock('src/onboarding/registration/NameGenerator')
const mockStatsigGet = jest.fn()
jest.mock('statsig-react-native', () => ({
  Statsig: {
    getLayer: jest.fn().mockImplementation(() => ({ get: mockStatsigGet })),
    logEvent: jest.fn(),
  },
}))

jest.spyOn(AccountActions, 'setName')
const mockScreenProps = getMockStackScreenProps(Screens.NameAndPicture)

describe('NameAndPictureScreen', () => {
  afterEach(() => {
    mockStatsigGet.mockClear()
  })

  it('disable button when no name', () => {
    const store = createMockStore()
    const { getByTestId } = render(
      <Provider store={store}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )

    expect(getByTestId('NameAndPictureContinueButton')).toBeDisabled()
    // Just spaces counts as empty
    fireEvent.changeText(getByTestId('NameEntry'), '    ')
    expect(getByTestId('NameAndPictureContinueButton')).toBeDisabled()
    fireEvent.changeText(getByTestId('NameEntry'), 'Some Name')
    expect(getByTestId('NameAndPictureContinueButton')).not.toBeDisabled()
  })

  it('is disabled with no text', () => {
    const wrapper = render(
      <Provider store={createMockStore()}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )
    expect(wrapper.UNSAFE_queryAllByProps({ disabled: true }).length).toBeGreaterThan(0)
  })

  it('shows profile picture input if skipProfilePicture remote config is not enabled', () => {
    const store = createMockStore({
      app: {
        skipProfilePicture: false,
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )
    expect(queryByTestId('PictureInput')).toBeTruthy()
  })

  it('hides profile picture input if skipProfilePicture remote config is enabled', () => {
    const store = createMockStore({
      app: {
        skipProfilePicture: true,
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )
    expect(queryByTestId('PictureInput')).toBeNull()
  })

  it('render header title correctly when createAccountCopyTestType is "Account"', () => {
    const store = createMockStore({
      account: {
        choseToRestoreAccount: false,
      },
      app: {
        createAccountCopyTestType: CreateAccountCopyTestType.Account,
      },
    })

    let headerTitle: React.ReactNode
    ;(mockNavigation.setOptions as jest.Mock).mockImplementation((options) => {
      headerTitle = options.headerTitle()
    })

    render(
      <Provider store={store}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )

    const { getByText } = render(<Provider store={store}>{headerTitle}</Provider>)

    expect(getByText('createAccount')).toBeTruthy()
  })

  it('render header title correctly when createAccountCopyTestType is "Wallet"', () => {
    const store = createMockStore({
      account: {
        choseToRestoreAccount: false,
      },
      app: {
        createAccountCopyTestType: CreateAccountCopyTestType.Wallet,
      },
    })

    let headerTitle: React.ReactNode
    ;(mockNavigation.setOptions as jest.Mock).mockImplementation((options) => {
      headerTitle = options.headerTitle()
    })

    render(
      <Provider store={store}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )

    const { getByText } = render(<Provider store={store}>{headerTitle}</Provider>)

    expect(getByText('createProfile')).toBeTruthy()
  })

  it('render header title correctly when createAccountCopyTestType is "AlreadyHaveWallet"', () => {
    const store = createMockStore({
      account: {
        choseToRestoreAccount: false,
      },
      app: {
        createAccountCopyTestType: CreateAccountCopyTestType.AlreadyHaveWallet,
      },
    })

    let headerTitle: React.ReactNode
    ;(mockNavigation.setOptions as jest.Mock).mockImplementation((options) => {
      headerTitle = options.headerTitle()
    })

    render(
      <Provider store={store}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )

    const { getByText } = render(<Provider store={store}>{headerTitle}</Provider>)

    expect(getByText('createProfile')).toBeTruthy()
  })

  it('render header title correctly when showGuidedOnboarding is true', () => {
    const store = createMockStore({
      app: {
        showGuidedOnboardingCopy: true,
      },
    })
    let headerTitle: React.ReactNode
    ;(mockNavigation.setOptions as jest.Mock).mockImplementation((options) => {
      headerTitle = options.headerTitle()
    }),
      render(
        <Provider store={store}>
          <NameAndPicture {...mockScreenProps} />
        </Provider>
      )
    const { getByText } = render(<Provider store={store}>{headerTitle}</Provider>)
    expect(getByText('name')).toBeTruthy()
  })

  it('render onboarding guide copy correctly when showGuidedOnboarding is true', () => {
    const store = createMockStore({
      app: {
        showGuidedOnboardingCopy: true,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NameAndPicture {...mockScreenProps} />{' '}
      </Provider>
    )
    expect(getByText('nameAndPicGuideCopyTitle')).toBeTruthy()
    expect(getByText('nameAndPicGuideCopyContent')).toBeTruthy()
  })

  it('does not render skip button when configured so', () => {
    mockStatsigGet.mockReturnValue(false)
    const { queryByText } = render(
      <Provider store={createMockStore()}>
        <MockedNavigator component={NameAndPicture} />
      </Provider>
    )
    expect(queryByText('skip')).toBeNull()
  })

  it('renders skip button when mocked and skipping works', () => {
    mockStatsigGet.mockReturnValue(true)
    const { queryByText } = render(
      <Provider store={createMockStore()}>
        <MockedNavigator component={NameAndPicture} />
      </Provider>
    )
    expect(queryByText('skip')).toBeTruthy()
    fireEvent.press(queryByText('skip')!)
    expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet, expect.anything())
  })

  it('saves empty name regardless of what is in the inputbox when skip is used', () => {
    mockStatsigGet.mockReturnValue(true)
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <MockedNavigator component={NameAndPicture} />
      </Provider>
    )
    fireEvent.changeText(getByTestId('NameEntry'), 'Some Name')
    fireEvent.press(getByText('skip'))
    expect(AccountActions.setName).not.toHaveBeenCalled()
  })

  it('shows generator button and generator button puts random username in', () => {
    mockStatsigGet.mockImplementation((key: string, _) => {
      if (key === 'showSkipButton') {
        return true
      }
      if (key === 'nameType') {
        return 'autogenerator'
      }
      return undefined
    })
    const nameGen = jest.spyOn(NameGenerator, 'generateRandomUsername')
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )
    expect(getByText('generateUsername')).toBeTruthy()
    const nameField = getByTestId('NameEntry')
    nameGen.mockReturnValueOnce('Generated Name')
    fireEvent.press(getByText('generateUsername'))
    expect(nameField.props.value).toEqual('Generated Name')
    nameGen.mockRestore()
  })

  it('shows alternate placeholder username for experimental group', () => {
    mockStatsigGet.mockImplementation((key: string, _) => {
      if (key === 'showSkipButton') {
        return false
      }
      if (key === 'nameType') {
        return 'autogenerator'
      }
      return undefined
    })
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )
    expect(getByTestId('NameEntry').props.placeholder).toEqual('MyCryptoAlterEgo')
  })

  it('does not show alternate placeholder username for control group', () => {
    mockStatsigGet.mockImplementation((key: string, _) => {
      if (key === 'showSkipButton') {
        return true
      }
      if (key === 'nameType') {
        return 'first_and_last'
      }
      return undefined
    })
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )
    expect(getByTestId('NameEntry').props.placeholder).toEqual('fullNamePlaceholder')
  })
})
