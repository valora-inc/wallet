import { render } from '@testing-library/react-native'
import * as React from 'react'
import { TextInput } from 'react-native'
import CodeInput, { CodeInputStatus } from 'src/components/CodeInput'

describe('CodeInput', () => {
  it('renders correctly for all CodeInputStatus states', () => {
    ;[
      CodeInputStatus.Disabled,
      CodeInputStatus.Inputting,
      CodeInputStatus.Received,
      CodeInputStatus.Processing,
      CodeInputStatus.Accepted,
      CodeInputStatus.Error,
    ].map((status) => {
      const { toJSON } = render(
        <CodeInput
          label="label"
          status={status}
          inputValue={'test'}
          inputPlaceholder={'placeholder'}
          onInputChange={jest.fn()}
          shouldShowClipboard={jest.fn()}
          shortVerificationCodesEnabled={false}
        />
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })

  it('renders correctly for all CodeInputStatus states with short codes', () => {
    ;[
      CodeInputStatus.Disabled,
      CodeInputStatus.Inputting,
      CodeInputStatus.Received,
      CodeInputStatus.Processing,
      CodeInputStatus.Accepted,
      CodeInputStatus.Error,
    ].map((status) => {
      const { toJSON } = render(
        <CodeInput
          label="label"
          status={status}
          inputValue={'test'}
          inputPlaceholder={'placeholder'}
          onInputChange={jest.fn()}
          shouldShowClipboard={jest.fn()}
          shortVerificationCodesEnabled={true}
        />
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })

  it('disables auto correct / suggestion when in input mode', () => {
    const { UNSAFE_getByType } = render(
      <CodeInput
        label="label"
        status={CodeInputStatus.Inputting}
        inputValue={'test'}
        inputPlaceholder={'placeholder'}
        onInputChange={jest.fn()}
        shouldShowClipboard={jest.fn()}
        shortVerificationCodesEnabled={false}
      />
    )

    expect(UNSAFE_getByType(TextInput).props.autoCorrect).toBe(false)
    expect(UNSAFE_getByType(TextInput).props.autoCapitalize).toBe('none')
    expect(UNSAFE_getByType(TextInput).props.keyboardType).toBe('visible-password')
  })
})
