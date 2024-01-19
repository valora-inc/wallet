import { render } from '@testing-library/react-native'
import * as React from 'react'
import RecoveryPhraseInput, { RecoveryPhraseInputStatus } from 'src/components/RecoveryPhraseInput'
import TextInput from 'src/components/TextInput'

jest.mock('src/components/TextInput', () => jest.fn(() => null))

describe('RecoveryPhraseInput', () => {
  it('disables auto correct / suggestion when in input mode', () => {
    render(
      <RecoveryPhraseInput
        status={RecoveryPhraseInputStatus.Inputting}
        inputValue={'test'}
        inputPlaceholder={'placeholder'}
        onInputChange={jest.fn()}
        shouldShowClipboard={jest.fn()}
      />
    )
    const expectedProps = {
      autoCorrect: false,
      autoCapitalize: 'none',
      keyboardType: 'visible-password',
    }
    expect(TextInput).toHaveBeenCalledWith(expect.objectContaining(expectedProps), {})
  })
})
