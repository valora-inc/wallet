import { navigateToFiatExchangeStart } from 'src/fiatExchanges/navigator'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getExperimentParams } from 'src/statsig'
import { mocked } from 'ts-jest/utils'

jest.mock('src/statsig')

describe('navigateToFiatExchangeStart', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('navigates to FiatExchange if showAddWithdrawOnMenu is true', () => {
    mocked(getExperimentParams).mockReturnValueOnce({ showAddWithdrawOnMenu: true })
    navigateToFiatExchangeStart()
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchange)
  })

  it('navigates to Home if showAddWithdrawOnMenu is false', () => {
    mocked(getExperimentParams).mockReturnValueOnce({ showAddWithdrawOnMenu: false })
    navigateToFiatExchangeStart()
    expect(navigateHome).toHaveBeenCalledWith()
  })
})
