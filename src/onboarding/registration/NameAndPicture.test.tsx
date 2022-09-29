// @ts-ignore
import { toBeDisabled } from '@testing-library/jest-native'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { CreateAccountCopyTestType } from 'src/app/types'
import { Screens } from 'src/navigator/Screens'
import NameAndPicture from 'src/onboarding/registration/NameAndPicture'
import { Statsig } from 'statsig-react-native'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockNavigation } from 'test/values'

expect.extend({ toBeDisabled })

const mockScreenProps = getMockStackScreenProps(Screens.NameAndPicture)

describe('NameAndPictureScreen', () => {
  Statsig.getLayer = jest.fn().mockReturnValue({ get: () => null })

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
})
