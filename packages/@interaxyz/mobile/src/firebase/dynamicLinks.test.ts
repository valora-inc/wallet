import { createJumpstartLink } from 'src/firebase/dynamicLinks'
import { getDynamicConfigParams } from 'src/statsig'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'

const mockBuildLink = jest.fn()
jest.mock('@react-native-firebase/dynamic-links', () => () => ({
  buildLink: () => mockBuildLink(),
}))
jest.mock('src/statsig')

describe('dynamic links', () => {
  it('should create the jumpstart link', async () => {
    jest.mocked(getDynamicConfigParams).mockImplementation(({ configName }) => {
      if (configName === StatsigDynamicConfigs.APP_CONFIG) {
        return {
          links: {
            web: 'https://celo.org/',
          },
        }
      }
      return {} as any
    })

    const mockBaseLink =
      'https://example.com/?ibi=co%2Eclabs%2Eappname%2Edev&isi=1520414263&apn=co%2Eclabs%2Eappname%2Edev&link='
    mockBuildLink.mockResolvedValue(`${mockBaseLink}https%3A%2F%2Fcelo%2Eorg`)

    const result = await createJumpstartLink('0xprivateKey', NetworkId['celo-alfajores'])

    expect(result).toEqual(
      `${mockBaseLink}https%3A%2F%2Fcelo%2Eorg%2Fjumpstart%2F0xprivateKey%2Fcelo%2Dalfajores`
    )
  })
})
