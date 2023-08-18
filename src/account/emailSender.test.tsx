import 'react-native'
import { openComposer } from 'react-native-email-link'
import Mailer from 'react-native-mail'
import { sendEmail } from 'src/account/emailSender'

jest.mock('react-native-mail')
jest.mock('react-native-email-link')

describe('emailSender', () => {
  const subject = 'Subject'
  const recipient = 'support@celo.org'
  const body = 'The Body'

  it('submits email with native app', async () => {
    jest.spyOn(Mailer, 'mail').mockImplementationOnce((_: any, fn: any) => {
      fn(null, 'sent')
    })

    await sendEmail({
      subject,
      recipients: [recipient],
      body,
      isHTML: true,
    })
    expect(Mailer.mail).toBeCalledWith(
      expect.objectContaining({
        isHTML: true,
        body,
        recipients: [recipient],
        subject,
      }),
      expect.any(Function)
    )
  })

  it('submits email with a non native app', async () => {
    jest.spyOn(Mailer, 'mail').mockImplementationOnce((_: any, fn: any) => {
      fn({}, 'error')
    })

    await sendEmail({
      subject,
      recipients: [recipient],
      body,
      isHTML: true,
    })
    expect(openComposer).toHaveBeenCalledWith({
      body: `${body}\n\n`,
      to: recipient,
      subject,
    })
  })
})
