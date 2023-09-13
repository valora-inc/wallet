import { navigateToFiatExchangeStart } from 'src/fiatExchanges/navigator'
import { navigateHome } from 'src/navigator/NavigationService'

jest.mock('src/statsig')

describe('navigateToFiatExchangeStart', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('navigates to Home', () => {
    navigateToFiatExchangeStart()
    expect(navigateHome).toHaveBeenCalledWith()
  })
})
