import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import Mailer from 'react-native-mail'
import { Provider } from 'react-redux'
import SupportContact, { validateEmail } from 'src/account/SupportContact'
import { sendSupportRequest } from 'src/account/zendesk'
import { APP_NAME, CELO_SUPPORT_EMAIL_ADDRESS } from 'src/brandingConfig'
import i18n from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import Logger from 'src/utils/Logger'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { MultichainBetaStatus } from 'src/app/actions'

const mockScreenProps = getMockStackScreenProps(Screens.SupportContact)
jest.mock('src/account/zendesk')
jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn().mockReturnValue(false),
}))

describe('validateEmail', () => {
  it.each([
    ['bar', false],
    ['bar@', false],
    ['bar@foo', false],
    ['bar@foo.', false],
    ['bar@foo.c', false],
    ['bar@foo.co', true],
    ['bar@foo..co', false],
    ['อีเมลทดสอบ@ยูเอทดสอบ.ไทย', true],
    ['อีเมลทดสอบ@ทีเอชนิค.องค์กร.ไทย', true],
    ['bar@random.foos', true],
  ])('validates email %s', (email, expected) => {
    expect(validateEmail(email)).toBe(expected)
  })
})

describe('Contact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('withEmail', () => {
    it('renders correctly', () => {
      const tree = render(
        <Provider store={createMockStore({})}>
          <SupportContact {...mockScreenProps} />
        </Provider>
      )
      expect(tree).toMatchSnapshot()
    })

    it('submits email with logs', async () => {
      const mockedLogAttachments = Logger.getLogsToAttach as jest.Mock
      Logger.getCurrentLogFileName = jest.fn(() => 'log2.txt')
      const logAttachments = [
        {
          path: 'logs/log1.txt',
          type: 'text',
          name: 'log1.txt',
        },
        {
          path: 'logs/log2.txt',
          type: 'text',
          name: 'log2.txt',
        },
      ]
      mockedLogAttachments.mockResolvedValue(logAttachments)

      const { getByTestId } = render(
        <Provider
          store={createMockStore({ app: { multichainBetaStatus: MultichainBetaStatus.OptedIn } })}
        >
          <SupportContact {...mockScreenProps} />
        </Provider>
      )
      // Text is required to send to support
      fireEvent.changeText(getByTestId('MessageEntry'), 'Test Message')
      await act(() => {
        fireEvent.press(getByTestId('SubmitContactForm'))
      })

      expect(Mailer.mail).toBeCalledWith(
        expect.objectContaining({
          isHTML: true,
          body: 'Test Message<br/><br/><b>{"version":"0.0.1","systemVersion":"7.1","buildNumber":"1","apiLevel":-1,"os":"android","country":"US","region":null,"deviceId":"someDeviceId","deviceBrand":"someBrand","deviceModel":"someModel","address":"0x0000000000000000000000000000000000007e57","sessionId":"","numberVerifiedCentralized":false,"multichainBetaStatus":"OptedIn","hooksPreviewEnabled":false,"network":"alfajores"}</b><br/><br/><b>Support logs are attached...</b>',
          recipients: [CELO_SUPPORT_EMAIL_ADDRESS],
          subject: i18n.t('supportEmailSubject', { appName: APP_NAME, user: '+1415555XXXX' }),
          attachments: logAttachments,
        }),
        expect.any(Function)
      )
    })
  })
  describe('withZendesk', () => {
    it('submits zendesk request with logs, message, email, and name', async () => {
      jest.mocked(getFeatureGate).mockReturnValue(true)
      const mockedLogAttachments = Logger.getLogsToAttach as jest.Mock
      Logger.getCurrentLogFileName = jest.fn(() => 'log2.txt')
      const logAttachments = [
        {
          path: 'logs/log1.txt',
          type: 'text',
          name: 'log1.txt',
        },
        {
          path: 'logs/log2.txt',
          type: 'text',
          name: 'log2.txt',
        },
      ]
      mockedLogAttachments.mockResolvedValue(logAttachments)

      const { getByTestId } = render(
        <Provider
          store={createMockStore({ app: { multichainBetaStatus: MultichainBetaStatus.OptedOut } })}
        >
          <SupportContact {...mockScreenProps} />
        </Provider>
      )
      // Text is required to send to support
      fireEvent.changeText(getByTestId('MessageEntry'), 'Test Message')
      fireEvent.changeText(getByTestId('NameEntry'), 'My Name')
      fireEvent.changeText(getByTestId('EmailEntry'), 'my@email.com')

      await act(() => {
        fireEvent.press(getByTestId('SubmitContactForm'))
      })

      expect(Mailer.mail).not.toBeCalled()
      expect(sendSupportRequest).toHaveBeenCalledWith({
        message: 'Test Message',
        deviceInfo: {
          address: '0x0000000000000000000000000000000000007e57',
          apiLevel: -1,
          buildNumber: '1',
          country: 'US',
          deviceBrand: 'someBrand',
          deviceId: 'someDeviceId',
          deviceModel: 'someModel',
          hooksPreviewEnabled: false,
          multichainBetaStatus: 'OptedOut',
          network: 'alfajores',
          numberVerifiedCentralized: false,
          os: 'android',
          region: null,
          sessionId: '',
          systemVersion: '7.1',
          version: '0.0.1',
        },
        logFiles: logAttachments,
        userEmail: 'my@email.com',
        userName: 'My Name',
        subject: i18n.t('supportEmailSubject', { appName: APP_NAME, user: '+1415555XXXX' }),
      })
    })
  })
})
