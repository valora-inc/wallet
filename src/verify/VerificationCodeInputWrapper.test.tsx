import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import SmsRetriever from 'react-native-sms-retriever'
import VerificationCodeInputWrapper from 'src/verify/VerificationCodeInputWrapper'
import { PhoneNumberVerificationStatus } from 'src/verify/hooks'
import { mocked } from 'ts-jest/utils'

const mockedSmsRetriever = mocked(SmsRetriever)

describe('VerificationCodeInputWrapper', () => {
  const mockOnSuccess = jest.fn()
  const mockOnResendSms = jest.fn()
  const mockSetSmsCode = jest.fn()
  const mockPhoneNumber = '+15555555555'

  const renderComponent = (
    verificationStatus = PhoneNumberVerificationStatus.NONE,
    showResend = true
  ) =>
    render(
      <VerificationCodeInputWrapper
        phoneNumber={mockPhoneNumber}
        verificationStatus={verificationStatus}
        onSuccess={mockOnSuccess}
        onResendSms={showResend ? mockOnResendSms : undefined}
        setSmsCode={mockSetSmsCode}
      />
    )

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  it('displays the correct components', () => {
    const { getByText, getByTestId } = renderComponent()

    expect(
      getByText(`phoneVerificationInput.description, {"phoneNumber":"${mockPhoneNumber}"}`)
    ).toBeTruthy()
    expect(getByTestId('PhoneVerificationResendSmsBtn')).toBeDisabled()
  })

  it('hides resend button if onResendSms is not set', () => {
    const { getByText, queryByTestId } = renderComponent(PhoneNumberVerificationStatus.NONE, false)

    expect(
      getByText(`phoneVerificationInput.description, {"phoneNumber":"${mockPhoneNumber}"}`)
    ).toBeTruthy()
    expect(queryByTestId('PhoneVerificationResendSmsBtn')).toBeFalsy()
  })

  it('invokes setSmsCode if code is set', async () => {
    const { getByText, getByTestId } = renderComponent()

    expect(
      getByText(`phoneVerificationInput.description, {"phoneNumber":"${mockPhoneNumber}"}`)
    ).toBeTruthy()
    await act(() => {
      fireEvent.changeText(getByTestId('PhoneVerificationCode'), '123456')
    })
    expect(mockSetSmsCode).toHaveBeenCalledWith('123456')
  })

  it('displays tick mark and invokes onSuccess if verification status is success', () => {
    const { getByText, getByTestId } = renderComponent(PhoneNumberVerificationStatus.SUCCESSFUL)

    expect(
      getByText(`phoneVerificationInput.description, {"phoneNumber":"${mockPhoneNumber}"}`)
    ).toBeTruthy()
    expect(getByTestId('PhoneVerificationCode/CheckIcon')).toBeTruthy()
    jest.runOnlyPendingTimers()
    expect(mockOnSuccess).toHaveBeenCalledWith()
  })

  it('displays error icon verification status is failed', () => {
    const { getByText, getByTestId } = renderComponent(PhoneNumberVerificationStatus.FAILED)

    expect(
      getByText(`phoneVerificationInput.description, {"phoneNumber":"${mockPhoneNumber}"}`)
    ).toBeTruthy()
    expect(getByTestId('PhoneVerificationCode/ErrorIcon')).toBeTruthy()
  })

  it('reads SMS code on Android automatically', async () => {
    const { getByText } = renderComponent()

    expect(
      getByText(`phoneVerificationInput.description, {"phoneNumber":"${mockPhoneNumber}"}`)
    ).toBeTruthy()

    await waitFor(() => expect(mockedSmsRetriever.startSmsRetriever).toHaveBeenCalledTimes(1))
    expect(mockedSmsRetriever.addSmsListener).toHaveBeenCalledTimes(1)

    const smsListener = mockedSmsRetriever.addSmsListener.mock.calls[0][0]

    await act(() => {
      // Simulate the SMS code being received
      smsListener({ message: 'Your verification code for Valora is: 456789 5yaJvJcZt2P' })
    })
    expect(mockSetSmsCode).toHaveBeenCalledWith('456789')
  })
})
