import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SignInWithEmail from 'src/keylessBackup/SignInWithEmail'

describe('SignInWithEmail', () => {
  it('pressing sign in with google emits analytics event', () => {
    const { getByTestId } = render(<SignInWithEmail />)
    const continueButton = getByTestId('SignInWithEmail/Google')
    fireEvent.press(continueButton)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('sign_in_with_google')
  })
})
