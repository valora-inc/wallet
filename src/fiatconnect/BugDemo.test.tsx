import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import Persona from '../account/Persona'
import { KycStatus } from '../account/reducer'

jest.mock('src/account/Persona')
describe('bug demo', () => {
  it('uses onClick provided', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <Persona onPress={onPress} kycStatus={KycStatus.Approved} disabled={false} />
    )
    fireEvent.press(getByTestId('PersonaButton')) // this test fails (as one would expect, since the onPress handler is ignored in the mock component)
    expect(onPress).toHaveBeenCalled()
  })
})
