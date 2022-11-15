import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigateBack } from 'src/navigator/NavigationService'
import { createMockStore } from 'test/utils'
import Education, { EducationTopic, EmbeddedNavBar } from '../../src/account/Education'

jest.mock('src/analytics/ValoraAnalytics')

const BUTTON_TEXT = 'Done'

const educationProps = {
  stepInfo: [
    {
      image: null,
      topic: EducationTopic.celo,
      title: 'Step 1',
      text: 'The Journey Begins',
      valueProposition: 'explore',
      variant: 'old',
    },
  ] as any,
  buttonText: 'next',
  embeddedNavBar: EmbeddedNavBar.Close,
  finalButtonText: BUTTON_TEXT,
  onFinish: jest.fn(),
}

describe('Education', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <Education {...educationProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('finishes when pressed', () => {
    const edu = render(<Education {...educationProps} />)
    fireEvent.press(edu.UNSAFE_getByProps({ text: BUTTON_TEXT }))
    expect(educationProps.onFinish).toBeCalled()
  })

  it('navigates back', () => {
    const edu = render(<Education {...educationProps} />)
    fireEvent.press(edu.getByTestId('Education/CloseIcon'))
    expect(navigateBack).toBeCalled()
  })

  it('onboarding step info analytics event fires', () => {
    // Onboarding analytics event
    const onboardingProps = { ...educationProps }
    onboardingProps.stepInfo[0].topic = EducationTopic.onboarding
    render(<Education {...educationProps} />)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      OnboardingEvents.onboarding_education_step_impression,
      {
        valueProposition: 'explore',
        variant: 'old',
        step: 0,
      }
    )
  })
})
