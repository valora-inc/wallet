import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Platform } from 'react-native'
import SmsRetriever from 'react-native-sms-retriever'
import PhoneNumberInput from 'src/components/PhoneNumberInput'
import { Countries } from 'src/utils/Countries'

jest.mock('react-native-sms-retriever', () => {
  return {
    requestPhoneNumber: jest.fn(() => '+49030111111'),
  }
})

const requestPhoneNumber = jest.mocked(SmsRetriever.requestPhoneNumber)

const countries = new Countries('en-us')

describe('PhoneNumberInput', () => {
  it('renders and behaves correctly', async () => {
    // mock
    Platform.OS = 'ios'

    const onChange = jest.fn()
    const onPressCountry = jest.fn()
    const { getByTestId, getByText, toJSON } = render(
      <PhoneNumberInput
        label="Phone number"
        country={countries.getCountryByCodeAlpha2('FR')}
        internationalPhoneNumber=""
        onChange={onChange}
        onPressCountry={onPressCountry}
      />
    )
    expect(toJSON()).toMatchSnapshot()

    expect(getByText('🇫🇷')).toBeTruthy()
    expect(getByTestId('PhoneNumberField').props.placeholder).toBe('00 00 00 00 00')

    await act(() => {
      fireEvent.press(getByTestId('CountrySelectionButton'))
    })

    expect(onPressCountry).toHaveBeenCalled()

    fireEvent.changeText(getByTestId('PhoneNumberField'), '123')
    expect(onChange).toHaveBeenCalledWith('123', '+33')
  })

  describe('native phone picker (Android)', () => {
    beforeEach(() => {
      Platform.OS = 'android'
    })

    it('requests the device phone number when focusing the phone number field', async () => {
      const onChange = jest.fn()
      const { getByTestId } = render(
        <PhoneNumberInput
          label="Phone number"
          country={undefined}
          internationalPhoneNumber=""
          onChange={onChange}
          onPressCountry={jest.fn()}
        />
      )

      await act(() => {
        fireEvent(getByTestId('PhoneNumberField'), 'focus')
      })

      expect(onChange).toHaveBeenCalledWith('030 111111', '+49')
    })

    it('requests the device phone number when pressing the country selection button', async () => {
      const onChange = jest.fn()
      const { getByTestId } = render(
        <PhoneNumberInput
          label="Phone number"
          country={undefined}
          internationalPhoneNumber=""
          onChange={onChange}
          onPressCountry={jest.fn()}
        />
      )

      await act(() => {
        fireEvent.press(getByTestId('CountrySelectionButton'))
      })
      expect(onChange).toHaveBeenCalledWith('030 111111', '+49')
    })
  })

  it("doesn't trigger the native phone picker if there's data in the form", async () => {
    const onChange = jest.fn()
    const { getByTestId } = render(
      <PhoneNumberInput
        label="Phone number"
        country={undefined}
        internationalPhoneNumber="123"
        onChange={onChange}
        onPressCountry={jest.fn()}
      />
    )

    await act(() => {
      fireEvent(getByTestId('PhoneNumberField'), 'focus')
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('can read Canadian phone numbers', async () => {
    const onChange = jest.fn()
    const { getByTestId } = render(
      <PhoneNumberInput
        label="Phone number"
        country={undefined}
        internationalPhoneNumber=""
        onChange={onChange}
        onPressCountry={jest.fn()}
      />
    )

    requestPhoneNumber.mockResolvedValue('+1 416-868-0000')

    await act(() => {
      fireEvent(getByTestId('PhoneNumberField'), 'focus')
    })
    expect(onChange).toHaveBeenCalledWith('(416) 868-0000', '+1')
  })

  it('can read US phone numbers', async () => {
    const onChange = jest.fn()
    const { getByTestId } = render(
      <PhoneNumberInput
        label="Phone number"
        country={undefined}
        internationalPhoneNumber=""
        onChange={onChange}
        onPressCountry={jest.fn()}
      />
    )

    requestPhoneNumber.mockResolvedValue('+1 415-426-5200')

    await act(() => {
      fireEvent(getByTestId('PhoneNumberField'), 'focus')
    })
    expect(onChange).toHaveBeenCalledWith('(415) 426-5200', '+1')
  })

  it('renders and behaves correctly with Côte d’Ivoire phone numbers', async () => {
    // mock
    Platform.OS = 'ios'

    const onChange = jest.fn()
    const onPressCountry = jest.fn()
    const { getByTestId, getByText } = render(
      <PhoneNumberInput
        label="Phone number"
        country={countries.getCountryByCodeAlpha2('CI')}
        internationalPhoneNumber=""
        onChange={onChange}
        onPressCountry={onPressCountry}
      />
    )

    expect(getByText('🇨🇮')).toBeTruthy()
    expect(getByTestId('PhoneNumberField').props.placeholder).toBe('00 00 0 00000')
    await act(() => {
      fireEvent.press(getByTestId('CountrySelectionButton'))
    })
    expect(onPressCountry).toHaveBeenCalled()

    fireEvent.changeText(getByTestId('PhoneNumberField'), '2123456789')
    expect(onChange).toHaveBeenCalledWith('21 23 4 56789', '+225')
  })
})
