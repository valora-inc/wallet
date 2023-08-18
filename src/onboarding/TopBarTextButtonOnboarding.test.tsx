import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import TopBarTextButtonOnboarding from 'src/onboarding/TopBarTextButtonOnboarding'

describe('Given TopBarTextButtonOnboarding', () => {
  describe('When pressed', () => {
    it('Then fires the onPress prop', () => {
      const onPress = jest.fn()
      const { getByTestId } = render(
        <TopBarTextButtonOnboarding
          title="Test Title"
          testID="TopBarTextButtonOnboarding"
          onPress={onPress}
        />
      )
      const button = getByTestId('TopBarTextButtonOnboarding')

      fireEvent.press(button)
      expect(onPress).toBeCalled()
    })
  })
})
