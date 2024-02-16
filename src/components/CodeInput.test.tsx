import { render } from '@testing-library/react-native'
import * as React from 'react'
import CodeInput, { CodeInputStatus } from 'src/components/CodeInput'
import TextInput from 'src/components/TextInput'

jest.mock('src/components/TextInput', () => jest.fn(() => null))

describe('CodeInput', () => {
  it('disables auto correct / suggestion when in input mode', () => {
    render(
      <CodeInput
        status={CodeInputStatus.Inputting}
        inputValue={'test'}
        inputPlaceholder={'placeholder'}
        onInputChange={jest.fn()}
      />
    )

    const expectedProps = {
      autoCorrect: false,
      autoCapitalize: 'none',
      keyboardType: 'number-pad',
    }
    expect(TextInput).toHaveBeenCalledWith(expect.objectContaining(expectedProps), {})
  })
})
