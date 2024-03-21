import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import MultiSelectBottomSheet from 'src/components/multiSelect/MultiSelectBottomSheet'

const allItemsSelected = {
  one: true,
  two: true,
  three: true,
  four: true,
}

const oneItemSelected = {
  one: true,
  two: false,
  three: false,
  four: false,
}

const textAndIconMap = {
  one: {
    text: 'One',
    icon: 'icon',
  },
  two: {
    text: 'Two',
    icon: 'icon',
  },
  three: {
    text: 'Three',
    icon: 'icon',
  },
  four: {
    text: 'Four',
    icon: 'icon',
  },
}

function renderMultiSelect(
  selectedItems: Record<string, boolean>,
  setSelectedItemsMock: (selectedItems: Record<string, boolean>) => void,
  onClose?: () => void
) {
  return render(
    <MultiSelectBottomSheet
      forwardedRef={{ current: null }}
      selectedItems={selectedItems}
      setSelectedItems={setSelectedItemsMock}
      textAndIconMap={textAndIconMap}
      selectAllText="Select All"
      title="Title"
      onClose={onClose}
    />
  )
}

describe('MultiSelectBottomSheet', () => {
  const setSelectedItems = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('only select all is checkmarked when all are selected', () => {
    const { queryByTestId, queryByText } = renderMultiSelect(allItemsSelected, setSelectedItems)

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
  it('calls setSelectedItems to select an item', () => {
    const { queryByTestId, getByTestId } = renderMultiSelect(oneItemSelected, setSelectedItems)

    expect(queryByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()

    fireEvent.press(getByTestId('Two-icon'))

    expect(setSelectedItems).toHaveBeenLastCalledWith({
      one: true,
      two: true,
      three: false,
      four: false,
    })
  })
  it('calls setSelectedItems to unselect an item', () => {
    const { queryByTestId, getByTestId } = renderMultiSelect(oneItemSelected, setSelectedItems)

    expect(queryByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()

    fireEvent.press(getByTestId('One-icon'))

    expect(setSelectedItems).toHaveBeenLastCalledWith({
      one: false,
      two: false,
      three: false,
      four: false,
    })
  })
  it('calls setSelectedItems to select all items', () => {
    const { queryByTestId, getByText } = renderMultiSelect(oneItemSelected, setSelectedItems)

    expect(queryByTestId('One-checkmark')).toBeTruthy()
    expect(queryByTestId('Two-checkmark')).toBeFalsy()
    expect(queryByTestId('Three-checkmark')).toBeFalsy()
    expect(queryByTestId('Four-checkmark')).toBeFalsy()

    fireEvent.press(getByText('Select All'))

    expect(setSelectedItems).toHaveBeenLastCalledWith({
      one: true,
      two: true,
      three: true,
      four: true,
    })
  })
  it('calls setSelectedItems correctly when going from all selected to one selected', () => {
    const { getByTestId } = renderMultiSelect(allItemsSelected, setSelectedItems)

    fireEvent.press(getByTestId('One-icon'))

    expect(setSelectedItems).toHaveBeenCalledWith({
      one: true,
      two: false,
      three: false,
      four: false,
    })
  })
  it('calls onClose when done is pressed', () => {
    const onClose = jest.fn()
    const { getByTestId } = renderMultiSelect(allItemsSelected, setSelectedItems, onClose)

    fireEvent.press(getByTestId('MultiSelectBottomSheet/Done'))

    expect(setSelectedItems).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
