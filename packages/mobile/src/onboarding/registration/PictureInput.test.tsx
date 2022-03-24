import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import ImagePicker from 'react-native-image-crop-picker'
import { Provider } from 'react-redux'
import PictureInput from 'src/onboarding/registration/PictureInput'
import { getDataURL } from 'src/utils/image'
import Logger from 'src/utils/Logger'
import { createMockStore } from 'test/utils'

const mockOnPhotoChosen = jest.fn()
const mockProps = {
  picture: 'abc',
  onPhotoChosen: mockOnPhotoChosen,
  backgroundColor: 'white',
}

const mockImageObj = {
  mime: 'image/jpeg',
  data: 'iVBORw0KGgoAAAANSUhEUgAAAJgAAACYCAMAAAAvHRpcK4CDXcXkfWNyfj///',
}
jest.mock('react-native-image-crop-picker', () => ({
  openPicker: jest.fn(() => Promise.resolve(mockImageObj)),
  openCamera: jest.fn(),
}))

jest.mock('src/utils/Logger', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('PictureInputScreen', () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const store = createMockStore()
    const tree = render(
      <Provider store={store}>
        <PictureInput {...mockProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('calls onPhotoChosen callback when a picture is selected', async () => {
    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <PictureInput {...mockProps} />
      </Provider>
    )

    await fireEvent.press(getByText('chooseFromLibrary'))
    // Transition time for the modal to close
    jest.advanceTimersByTime(500)

    await waitFor(() =>
      expect(ImagePicker.openPicker).toHaveBeenCalledWith({
        width: 150,
        height: 150,
        cropping: true,
        includeBase64: true,
        cropperCircleOverlay: true,
        cropperCancelText: 'cancel',
        cropperChooseText: 'choose',
      })
    )
    const expectedDataURL = getDataURL(mockImageObj.mime, mockImageObj.data)
    await waitFor(() => expect(mockOnPhotoChosen).toHaveBeenCalledWith(expectedDataURL))
  })

  it('does not log error if user cancelled image selection', async () => {
    const store = createMockStore()
    ImagePicker.openPicker = jest.fn(() =>
      Promise.reject(new Error('User cancelled image selection'))
    )
    const { getByText } = render(
      <Provider store={store}>
        <PictureInput {...mockProps} />
      </Provider>
    )

    await fireEvent.press(getByText('chooseFromLibrary'))
    // Transition time for the modal to close
    jest.advanceTimersByTime(500)
    await waitFor(() =>
      expect(Logger.info).toHaveBeenCalledWith('PictureInput', 'User cancelled image selection')
    )
  })
})
