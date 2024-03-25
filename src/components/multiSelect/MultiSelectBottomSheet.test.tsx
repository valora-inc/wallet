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
  onClose,
}: {
  selectedOptions: MultiSelectBottomSheetProps<string>['selectedOptions']
  onClose?: MultiSelectBottomSheetProps<string>['onClose']
}) {
  const [state, setState] = useState(selectedOptions)
  return (
    <MultiSelectBottomSheet
      forwardedRef={{ current: null }}
      options={allOptions}
      selectedOptions={state}
      setSelectedOptions={setState}
      selectAllText="Select All"
      title="Title"
      onClose={onClose}
    />
  )
}

describe('MultiSelectBottomSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('only select all is checkmarked when all are selected', () => {
    const { queryByTestId, queryByText } = render(
      <MultiSelect selectedOptions={allOptionsSelected} />
    )

    // All of the icons are rendered
    expect(queryByTestId('One-icon')).toBeTruthy()
    expect(queryByTestId('Two-icon')).toBeTruthy()
    expect(queryByTestId('Three-icon')).toBeTruthy()
    expect(queryByTestId('Four-icon')).toBeTruthy()

    // All of the text is rendered
    expect(queryByText('Title')).toBeTruthy()
    expect(queryByText('Select All')).toBeTruthy()
    expect(queryByText('One')).toBeTruthy()
    expect(queryByText('Two')).toBeTruthy()
    expect(queryByText('Three')).toBeTruthy()
    expect(queryByText('Four')).toBeTruthy()

    // Only the select all checkmark is rendered
    expect(queryByTestId('Select All-checkmark')).toBeTruthy()
    expect(queryByTestId('One-checkmark')).toBeFalsy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()
  })
  it('Adds checkmark when selecting an option', () => {
    const { queryByTestId, getByTestId } = render(
      <MultiSelect selectedOptions={oneOptionSelected} />
    )

    expect(queryByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()

    fireEvent.press(getByTestId('Two-icon'))

    expect(queryByTestId('Two-checkmark')).toBeTruthy()
  })
  it('Removes checkmark to de-select an option', () => {
    const { queryByTestId, getByTestId } = render(
      <MultiSelect selectedOptions={oneOptionSelected} />
    )

    expect(queryByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()

    fireEvent.press(getByTestId('One-icon'))

    expect(queryByTestId('One-checkmark')).toBeFalsy()
  })
  it('Adds all checkmarks to select all options', () => {
    const { queryByTestId, getByText } = render(<MultiSelect selectedOptions={oneOptionSelected} />)

    expect(queryByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()

    fireEvent.press(getByText('Select All'))

    expect(queryByTestId('Select All-checkmark')).toBeTruthy()
    expect(queryByTestId('One-checkmark')).toBeFalsy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()
  })
  it('calls checkmarks correctly when going from all selected to one selected', () => {
    const { getByTestId, queryByTestId } = render(
      <MultiSelect selectedOptions={allOptionsSelected} />
    )
    expect(queryByTestId('Select All-checkmark')).toBeTruthy()

    fireEvent.press(getByTestId('One-icon'))

    expect(queryByTestId('Select All-checkmark')).toBeFalsy()
    expect(queryByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()
  })
  it('calls onClose when done is pressed', () => {
    const onClose = jest.fn()
    const { getByTestId } = render(
      <MultiSelect selectedOptions={oneOptionSelected} onClose={onClose} />
    )

    fireEvent.press(getByTestId('MultiSelectBottomSheet/Done'))

    expect(onClose).toHaveBeenCalled()
  })
})
