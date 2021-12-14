import { CICOEvents } from 'src/analytics/Events'
import * as React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { headerWithBackButtonEvent, headerWithCloseButtonEvent } from 'src/navigator/Headers'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'

jest.mock('src/analytics/ValoraAnalytics')

const testID = 'button'

describe('Headers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('headerWithBackButtonEvent', () => {
    it('Sends an event on button press', () => {
      const { headerLeft } = headerWithBackButtonEvent({
        eventName: CICOEvents.persona_kyc_start,
        testID,
      })
      const component = headerLeft ? headerLeft({ canGoBack: true }) : null
      const { getByTestId } = render(component as React.ReactElement)
      fireEvent.press(getByTestId(testID))
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(CICOEvents.persona_kyc_start)
    })
  })

  describe('headerWithCloseButtonEvent', () => {
    it('Sends an event on button press', () => {
      const { headerLeft } = headerWithCloseButtonEvent({
        eventName: CICOEvents.persona_kyc_start,
        testID,
      })
      const component = headerLeft ? headerLeft({}) : null
      const { getByTestId } = render(component as React.ReactElement)
      fireEvent.press(getByTestId(testID))
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(CICOEvents.persona_kyc_start)
    })
  })
})
