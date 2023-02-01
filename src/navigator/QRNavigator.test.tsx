import * as React from 'react'
import QRNavigator, {
  getExperimentParams,
  QRCodePicker,
  QRCodeProps,
} from 'src/navigator/QRNavigator'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { fetchExchanges } from 'src/fiatExchanges/utils'
import { Provider } from 'react-redux'
import { QRCodeDataType, QRCodeStyle, StatsigLayers } from 'src/statsig/types'
import { createMockStore } from 'test/utils'
import { mocked } from 'ts-jest/utils'
import { mockExchanges } from 'test/values'
import { CiCoCurrency } from 'src/utils/currencies'
import { Statsig } from 'statsig-react-native'
import MockedNavigator from 'test/MockedNavigator'
import StyledQRCode from 'src/qrcode/StyledQRGen'

jest.mock('react-native-permissions', () => jest.fn())

jest.mock('src/fiatExchanges/utils', () => ({
  ...(jest.requireActual('src/fiatExchanges/utils') as any),
  fetchExchanges: jest.fn(),
}))

jest.mock('src/qrcode/StyledQRGen', () => jest.fn().mockReturnValue(''))

const mockStore = createMockStore({
  networkInfo: {
    userLocationData: {
      countryCodeAlpha2: 'US',
      region: null,
      ipAddress: '127.0.0.1',
    },
  },
  web3: {
    account: '0x0000',
  },
  account: {
    name: 'username',
  },
})

function getProps(qrCodeStyle: QRCodeStyle): QRCodeProps {
  // getMockStackScreenProps won't work for the tab navigator
  return {
    route: {
      params: {
        qrCodeDataType: QRCodeDataType.Address,
        qrCodeStyle,
      },
    },
    qrSvgRef: jest.fn(),
  } as any
}

describe('QRNavigator', () => {
  beforeAll(async () => {
    await Statsig.initialize('client-sdk-key-testing', null, { localMode: true })
  })
  afterEach(async () => {
    const overrides = Statsig.getAllOverrides()
    Object.keys(overrides.gates).forEach((gateName) => Statsig.removeGateOverride(gateName))
    Object.keys(overrides.configs).forEach((configName) => Statsig.removeConfigOverride(configName))
    Object.keys(overrides.layers).forEach((layerName) => Statsig.removeLayerOverrie(layerName)) // lol @ the typo, I (Charlie) submitted a PR to fix their SDK but it will take time to get a new version published
  })
  const qrLayerControlParams = { qrCodeStyle: 'Legacy', qrCodeDataType: 'ValoraDeepLink' }
  const qrLayerTreatmentParams = { qrCodeStyle: 'New', qrCodeDataType: 'Address' }
  describe('helper functions', () => {
    it('getExperimentParams', () => {
      Statsig.overrideLayer(StatsigLayers.SEND_RECEIVE_QR_CODE, { ...qrLayerControlParams })
      expect(getExperimentParams()).toEqual(qrLayerControlParams)
      Statsig.overrideLayer(StatsigLayers.SEND_RECEIVE_QR_CODE, { ...qrLayerTreatmentParams })
      expect(getExperimentParams()).toEqual(qrLayerTreatmentParams)
    })
  })
  describe('QRCodePicker', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('renders the new style when selected', async () => {
      mocked(fetchExchanges).mockResolvedValue(mockExchanges)

      const { queryByTestId } = render(
        <Provider store={mockStore}>
          <QRCodePicker {...getProps(QRCodeStyle.New)} />
        </Provider>
      )
      await waitFor(() => expect(fetchExchanges).toHaveBeenCalledWith('US', CiCoCurrency.CELO))
      expect(queryByTestId('styledQRCode')).toBeTruthy()
    })

    it('renders the legacy style when selected', async () => {
      const { queryByTestId } = render(
        <Provider store={mockStore}>
          <QRCodePicker {...getProps(QRCodeStyle.Legacy)} />
        </Provider>
      )
      await waitFor(() => expect(fetchExchanges).not.toHaveBeenCalled())
      expect(queryByTestId('QRCode')).toBeTruthy()
    })
  })
  describe('QRNavigator component', () => {
    it('renders tabs for scan and my code', () => {
      const { queryByText } = render(
        <Provider store={mockStore}>
          <MockedNavigator component={QRNavigator} />
        </Provider>
      )
      expect(queryByText('myCode')).toBeTruthy()
      expect(queryByText('scanCode')).toBeTruthy()
    })
    it('integration test: user with Legacy style parameter gets old style', async () => {
      Statsig.overrideLayer(StatsigLayers.SEND_RECEIVE_QR_CODE, {
        qrCodeStyle: 'Legacy',
      })
      const { getByText, queryByTestId } = render(
        <Provider store={mockStore}>
          <MockedNavigator component={QRNavigator} />
        </Provider>
      )
      await fireEvent.press(getByText('myCode'))
      expect(queryByTestId('QRCode')).toBeTruthy()
      expect(queryByTestId('styledQRCode')).toBeFalsy()
    })
    it('integration test: user with New style parameter gets new style', async () => {
      Statsig.overrideLayer(StatsigLayers.SEND_RECEIVE_QR_CODE, {
        qrCodeStyle: 'New',
      })
      const { getByText, queryByTestId } = render(
        <Provider store={mockStore}>
          <MockedNavigator component={QRNavigator} />
        </Provider>
      )
      await fireEvent.press(getByText('myCode'))
      expect(queryByTestId('styledQRCode')).toBeTruthy()
      expect(queryByTestId('QRCode')).toBeFalsy()
    })
    it('integration test: user with Address data type parameter gets qr code with address', async () => {
      Statsig.overrideLayer(StatsigLayers.SEND_RECEIVE_QR_CODE, {
        qrCodeStyle: 'New',
        qrCodeDataType: 'Address',
      })
      const { getByText } = render(
        <Provider store={mockStore}>
          <MockedNavigator component={QRNavigator} />
        </Provider>
      )
      await fireEvent.press(getByText('myCode'))
      expect(StyledQRCode).toHaveBeenCalledWith(
        expect.objectContaining({ value: '0x0000' }),
        expect.anything()
      )
    })
    // TODO test that qrContent is address for treatment group
  })
})
