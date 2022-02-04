import { render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import Navigator from 'src/navigator/Navigator'
import { createMockStore } from 'test/utils'

// jest.mock('src/navigator/NavigationService', () => {
//   return {
//     navigatorIsReadyRef: jest.fn(),
//     navigationRef: jest.fn(),
//     navigate: jest.fn(),
//   }
// })

// jest.mock('src/sentry/Sentry', () => {
//   return {
//     sentryRoutingInstrumentation: {
//       registerNavigationContainer: jest.fn(),
//     },
//   }
// })

describe('Navigator', () => {
  it('it naviagtes to onboarding education screens', async () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <Navigator />)
      </Provider>
    )
    // expect(tree).toMatchSnapshot()
    await waitFor(() => expect(getByTestId('Education/top')).toBeTruthy())
    // expect(navigate).toBeCalledWith(Screens.OnboardingEducationScreen)
  })

  // it('it navigates to ', () => {
  //   const tree = render(
  //     <Provider store={createMockStore()}>
  //       <NavigatorWrapper />)
  //     </Provider>
  //   )
  //   expect(tree).toMatchSnapshot()
  // })
})
