import { createJumpstartLink } from 'src/firebase/dynamicLinks'
import { NetworkId } from 'src/transactions/types'

const mockBuildLink = jest.fn()
jest.mock('@react-native-firebase/dynamic-links', () => () => ({
  buildLink: () => mockBuildLink(),
}))
jest.mock('src/brandingConfig', () => ({
  WEB_LINK: 'https://celo.org/',
}))

describe('dynamic links', () => {
  it('should create the jumpstart link', async () => {
    const mockBaseLink =
      'https://vlra.app/?ibi=co%2Eclabs%2Evalora%2Edev&isi=1520414263&apn=co%2Eclabs%2Evalora%2Edev&link='
    mockBuildLink.mockResolvedValue(`${mockBaseLink}https%3A%2F%2Fcelo%2Eorg`)

    const result = await createJumpstartLink('0xprivateKey', NetworkId['celo-alfajores'])

    expect(result).toEqual(
      `${mockBaseLink}https%3A%2F%2Fcelo%2Eorg%2Fjumpstart%2F0xprivateKey%2Fcelo%2Dalfajores`
    )
  })
})
