import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Settings from 'src/account/Settings'
import { navigate, ensurePincode } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { KomenciAvailable } from 'src/verify/reducer'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockE164Number, mockE164NumberPepper } from 'test/values'

describe('Account', () => {
  const mockedNavigate = navigate as jest.Mock
  const mockedEnsurePincode = ensurePincode as jest.Mock
  beforeEach(() => {
    jest.clearAllMocks()
    mockedNavigate.mockReset()
  })

  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          account: {
            e164PhoneNumber: mockE164Number,
          },
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
          stableToken: { balance: '0.00' },
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
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
          stableToken: { balance: '0.00' },
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
    let tree = renderer.create(
      <Provider
        store={createMockStore({
          verify: { komenci: { errorTimestamps: [] }, status: {} },
        })}
      >
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
    tree = renderer.create(
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
    mockedEnsurePincode.mockImplementation(() => true)
    fireEvent.press(tree.getByTestId('ChangePIN'))
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
    mockedEnsurePincode.mockImplementation(() => false)
    fireEvent.press(tree.getByTestId('ChangePIN'))
    expect(navigate).not.toHaveBeenCalled()
  })
})
