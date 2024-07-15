import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { useState } from 'react'
import MultiSelectBottomSheet, {
  MultiSelectBottomSheetProps,
} from 'src/components/multiSelect/MultiSelectBottomSheet'

const allOptions = [
  { text: 'One', iconUrl: 'icon', id: 'one' },
  { text: 'Two', iconUrl: 'icon', id: 'two' },
  { text: 'Three', iconUrl: 'icon', id: 'three' },
  { text: 'Four', iconUrl: 'icon', id: 'four' },
]

const oneOptionSelected = ['one']
const allOptionsSelected = ['one', 'two', 'three', 'four']

function MultiSelect({
  selectedOptions,
  onSelect,
  mode = 'select-multiple',
}: {
  selectedOptions: MultiSelectBottomSheetProps<string>['selectedOptions']
  onSelect?: MultiSelectBottomSheetProps<string>['onSelect']
  mode?: 'select-all-or-one' | 'select-multiple'
}) {
  const [state, setState] = useState(selectedOptions)
  return (
    <MultiSelectBottomSheet
      forwardedRef={{
        current: null,
      }}
      options={allOptions}
      selectedOptions={state}
      setSelectedOptions={setState}
      selectAllText="Select All"
      title="Title"
      onSelect={onSelect}
      mode={mode}
    />
  )
}

describe('MultiSelectBottomSheet', () => {
  const onSelectSpy = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('only select all is checkmarked when all are selected', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <MultiSelect selectedOptions={allOptionsSelected} />
    )

    // All of the icons are rendered
    expect(getByTestId('One-icon')).toBeTruthy()
    expect(getByTestId('Two-icon')).toBeTruthy()
    expect(getByTestId('Three-icon')).toBeTruthy()
    expect(getByTestId('Four-icon')).toBeTruthy()

    // All of the text is rendered
    expect(getByText('Title')).toBeTruthy()
    expect(getByText('Select All')).toBeTruthy()
    expect(getByText('One')).toBeTruthy()
    expect(getByText('Two')).toBeTruthy()
    expect(getByText('Three')).toBeTruthy()
    expect(getByText('Four')).toBeTruthy()

    // Only the select all checkmark is rendered
    expect(getByTestId('Select All-checkmark')).toBeTruthy()
    expect(queryByTestId('One-checkmark')).toBeFalsy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()
  })
  it('Adds checkmark when selecting an option', () => {
    const { queryByTestId, getByTestId } = render(
      <MultiSelect selectedOptions={oneOptionSelected} />
    )

    expect(getByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()

    fireEvent.press(getByTestId('Two-icon'))

    expect(getByTestId('Two-checkmark')).toBeTruthy()
  })
  it('Removes checkmark to de-select an option', () => {
    const { queryByTestId, getByTestId } = render(
      <MultiSelect selectedOptions={oneOptionSelected} />
    )

    expect(getByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()

    fireEvent.press(getByTestId('One-icon'))

    expect(queryByTestId('One-checkmark')).toBeFalsy()
  })
  it('Adds all checkmarks to select all options', () => {
    const { queryByTestId, getByTestId, getByText } = render(
      <MultiSelect selectedOptions={oneOptionSelected} />
    )

    expect(getByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()

    fireEvent.press(getByText('Select All'))

    expect(getByTestId('Select All-checkmark')).toBeTruthy()
    expect(queryByTestId('One-checkmark')).toBeFalsy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()
  })
  it('renders checkmarks correctly when going from all selected to one selected', () => {
    const { getByTestId, queryByTestId } = render(
      <MultiSelect selectedOptions={allOptionsSelected} />
    )
    expect(getByTestId('Select All-checkmark')).toBeTruthy()

    fireEvent.press(getByTestId('One-icon'))

    expect(queryByTestId('Select All-checkmark')).toBeFalsy()
    expect(getByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()
  })
  it('calls onSelect when a selection is made', () => {
    const { getByTestId } = render(
      <MultiSelect selectedOptions={oneOptionSelected} onSelect={onSelectSpy} />
    )

    fireEvent.press(getByTestId('Two-icon'))
    expect(onSelectSpy).toHaveBeenCalledTimes(1)
    expect(onSelectSpy).toHaveBeenCalledWith(['one', 'two']) // 'one' is selected in the props

    fireEvent.press(getByTestId('Three-icon'))
    expect(onSelectSpy).toHaveBeenCalledTimes(2)
    expect(onSelectSpy).toHaveBeenNthCalledWith(2, ['one', 'two', 'three']) // 'one' is selected in the props

    fireEvent.press(getByTestId('MultiSelectBottomSheet/Done'))
    expect(onSelectSpy).toHaveBeenCalledTimes(2) // dismissing the bottom sheet does not trigger further calls
  })
  describe('select-all-or-one', () => {
    it('calls onSelect when an option is selected', () => {
      const { getByTestId, getByText } = render(
        <MultiSelect
          selectedOptions={oneOptionSelected}
          mode={'select-all-or-one'}
          onSelect={onSelectSpy}
        />
      )

      fireEvent.press(getByTestId('Two-icon'))
      expect(onSelectSpy).toHaveBeenCalledTimes(1)
      expect(onSelectSpy).toHaveBeenCalledWith(['two'])

      fireEvent.press(getByTestId('Three-icon'))
      expect(onSelectSpy).toHaveBeenCalledTimes(2)
      expect(onSelectSpy).toHaveBeenNthCalledWith(2, ['three'])

      fireEvent.press(getByText('Select All'))
      expect(onSelectSpy).toHaveBeenCalledTimes(3)
      expect(onSelectSpy).toHaveBeenNthCalledWith(3, allOptionsSelected)
    })
  })
})
