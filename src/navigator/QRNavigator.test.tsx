import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { fetchExchanges } from 'src/fiatExchanges/utils'
import QRNavigator, {
  getExperimentParams,
  QRCodePicker,
  QRCodeProps,
} from 'src/navigator/QRNavigator'
import QRCode from 'src/qrcode/QRGen'
import StyledQRCode from 'src/qrcode/StyledQRGen'
import { QRCodeDataType, QRCodeStyle, StatsigLayers } from 'src/statsig/types'
import { CiCoCurrency } from 'src/utils/currencies'
import { Statsig } from 'statsig-react-native'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockExchanges } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('react-native-permissions', () => jest.fn())

jest.mock('src/fiatExchanges/utils', () => ({
  ...(jest.requireActual('src/fiatExchanges/utils') as any),
  fetchExchanges: jest.fn(),
}))

jest.mock('src/qrcode/StyledQRGen', () => jest.fn().mockReturnValue(''))
jest.mock('src/qrcode/QRGen', () => jest.fn().mockReturnValue(''))

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
    Object.keys(overrides.layers).forEach((layerName) => Statsig.removeLayerOverride(layerName))
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
      const { queryByText, queryByTestId } = render(
        <Provider store={mockStore}>
          <MockedNavigator component={QRNavigator} />
        </Provider>
      )

      expect(queryByTestId('Times')).toBeTruthy()
      expect(queryByText('myCode')).toBeTruthy()
      expect(queryByText('scanCode')).toBeTruthy()
    })
    it('renders back button when parameter is set', () => {
      const { queryByTestId } = render(
        <Provider store={mockStore}>
          <MockedNavigator component={QRNavigator} params={{ showBackButton: true }} />
        </Provider>
      )

      expect(queryByTestId('BackChevron')).toBeTruthy()
    })
    describe('integration tests for usage of experiment parameters', () => {
      it('user with Address data type, New style gets styled qr code with address', async () => {
        Statsig.overrideLayer(StatsigLayers.SEND_RECEIVE_QR_CODE, {
          qrCodeStyle: 'New',
          qrCodeDataType: 'Address',
        })
        const { getByText, queryByTestId } = render(
          <Provider store={mockStore}>
            <MockedNavigator component={QRNavigator} />
          </Provider>
        )
        await fireEvent.press(getByText('myCode'))
        expect(queryByTestId('styledQRCode')).toBeTruthy()
        expect(queryByTestId('QRCode')).toBeFalsy()
        expect(StyledQRCode).toHaveBeenCalledWith(
          expect.objectContaining({ value: '0x0000' }),
          expect.anything()
        )
      })
      it('user with Address data type, Legacy style gets legacy qr code with address', async () => {
        Statsig.overrideLayer(StatsigLayers.SEND_RECEIVE_QR_CODE, {
          qrCodeStyle: 'Legacy',
          qrCodeDataType: 'Address',
        })
        const { getByText, queryByTestId } = render(
          <Provider store={mockStore}>
            <MockedNavigator component={QRNavigator} />
          </Provider>
        )
        await fireEvent.press(getByText('myCode'))
        expect(queryByTestId('QRCode')).toBeTruthy()
        expect(queryByTestId('styledQRCode')).toBeFalsy()
        expect(QRCode).toHaveBeenCalledWith(
          expect.objectContaining({ value: '0x0000' }),
          expect.anything()
        )
      })
      it('user with Address data type, ValoraDeepLink style gets styled qr code with deep link', async () => {
        Statsig.overrideLayer(StatsigLayers.SEND_RECEIVE_QR_CODE, {
          qrCodeStyle: 'New',
          qrCodeDataType: 'ValoraDeepLink',
        })
        const { getByText, queryByTestId } = render(
          <Provider store={mockStore}>
            <MockedNavigator component={QRNavigator} />
          </Provider>
        )
        await fireEvent.press(getByText('myCode'))
        expect(queryByTestId('styledQRCode')).toBeTruthy()
        expect(queryByTestId('QRCode')).toBeFalsy()
        expect(StyledQRCode).toHaveBeenCalledWith(
          expect.objectContaining({
            value: expect.stringContaining('celo://wallet/pay?address=0x0000'),
          }),
          expect.anything()
        )
      })
      it('user with ValoraDeepLink data type, Legacy style gets legacy qr code with valora deep link', async () => {
        Statsig.overrideLayer(StatsigLayers.SEND_RECEIVE_QR_CODE, {
          qrCodeStyle: 'Legacy',
          qrCodeDataType: 'ValoraDeepLink',
        })
        const { getByText, queryByTestId } = render(
          <Provider store={mockStore}>
            <MockedNavigator component={QRNavigator} />
          </Provider>
        )
        await fireEvent.press(getByText('myCode'))
        expect(queryByTestId('QRCode')).toBeTruthy()
        expect(queryByTestId('styledQRCode')).toBeFalsy()
        expect(QRCode).toHaveBeenCalledWith(
          expect.objectContaining({
            value: expect.stringContaining('celo://wallet/pay?address=0x0000'),
          }),
          expect.anything()
        )
      })
    })
  })
})
