import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import MultiSelectBottomSheet from 'src/components/multiSelect/MultiSelectBottomSheet'


const allOptions = [
  { text: 'One', iconUrl: 'icon', id: 'one' },
  { text: 'Two', iconUrl: 'icon', id: 'two' },
  { text: 'Three', iconUrl: 'icon', id: 'three' },
  { text: 'Four', iconUrl: 'icon', id: 'four' },
]

const oneOptionSelected = ['one']
const allOptionsSelected = ['one', 'two', 'three', 'four']

function renderMultiSelect(
  selectedOptions: string[],
  setSelectedOptionsMock: (selectedOptions: string[]) => void,
  onClose?: () => void
) {
  return render(
    <MultiSelectBottomSheet
      forwardedRef={{ current: null }}
      options={allOptions}
      selectedOptions={selectedOptions}
      setSelectedOptions={setSelectedOptionsMock}
      selectAllText="Select All"
      title="Title"
      onClose={onClose}
    />
  )
}

describe('MultiSelectBottomSheet', () => {
  const setSelectedOptions = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('only select all is checkmarked when all are selected', () => {
    const { queryByTestId, queryByText } = renderMultiSelect(allOptionsSelected, setSelectedOptions)

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
  it('calls setSelectedOptions to select an option', () => {
    const { queryByTestId, getByTestId } = renderMultiSelect(oneOptionSelected, setSelectedOptions)

    expect(queryByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()

    fireEvent.press(getByTestId('Two-icon'))

    expect(setSelectedOptions).toHaveBeenLastCalledWith(['one', 'two'])
  })
  it('calls setSelectedOptions to unselect an option', () => {
    const { queryByTestId, getByTestId } = renderMultiSelect(oneOptionSelected, setSelectedOptions)

    expect(queryByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()

    fireEvent.press(getByTestId('One-icon'))

    expect(setSelectedOptions).toHaveBeenLastCalledWith([])
  })
  it('calls setSelectedOptions to select all options', () => {
    const { queryByTestId, getByText } = renderMultiSelect(oneOptionSelected, setSelectedOptions)

    expect(queryByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()

    fireEvent.press(getByText('Select All'))

    expect(setSelectedOptions).toHaveBeenLastCalledWith(allOptionsSelected)
  })
  it('calls setSelectedOptions correctly when going from all selected to one selected', () => {
    const { getByTestId } = renderMultiSelect(allOptionsSelected, setSelectedOptions)

    fireEvent.press(getByTestId('One-icon'))

    expect(setSelectedOptions).toHaveBeenCalledWith(['one'])
  })
  it('calls onClose when done is pressed', () => {
    const onClose = jest.fn()
    const { getByTestId } = renderMultiSelect(allOptionsSelected, setSelectedOptions, onClose)

    fireEvent.press(getByTestId('MultiSelectBottomSheet/Done'))

    expect(setSelectedOptions).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
