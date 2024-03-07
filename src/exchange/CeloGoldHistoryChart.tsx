import BigNumber from 'bignumber.js'
import _ from 'lodash'
import React, { useCallback, useState } from 'react'
import { WithTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import { Circle, G, Line, Text as SvgText } from 'react-native-svg'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { exchangeHistorySelector } from 'src/exchange/reducer'
import { withTranslation } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { tokensBySymbolSelector } from 'src/tokens/selectors'
import { getLocalCurrencyDisplayValue } from 'src/utils/formatting'
import { formatFeedDate } from 'src/utils/time'
import { VictoryGroup, VictoryLine, VictoryScatter } from 'victory-native'

const CHART_WIDTH = variables.width
const CHART_HEIGHT = 180
const CHART_MIN_VERTICAL_RANGE = 0.1 // one cent
const CHART_DOMAIN_PADDING = { y: [30, 30] as [number, number], x: [5, 5] as [number, number] }

interface OwnProps {
  testID?: string
  color?: colors
  containerStyle?: ViewStyle
  chartPadding?: number
}

type Props = WithTranslation & OwnProps

// ChartAwareSvgText draws text on the chart with avareness of its edges.
// Example: we want to draw some text at {x:10,y:10} (coordinates of the center).
// The text width is 33px and if draw it right away it will be cuted by the chart edges.
// The component will adjust coordinates to {x: (textWidthInPixels/2), y: 10}
function ChartAwareSvgText({
  position,
  x,
  y,
  value,
  chartWidth,
}: {
  position: 'top' | 'bottom'
  x: number
  y: number
  value: string
  chartWidth: number
}) {
  if (position === 'top') {
    y = y - 16
  } else if (position === 'bottom') {
    y = y + 25
  }
  const [adjustedX, setAdjustedX] = useState(x)
  const horizontalOffset = variables.contentPadding
  const onLayout = useCallback(
    ({
      nativeEvent: {
        layout: { width },
      },
    }: LayoutChangeEvent) => {
      if (Math.abs(width - chartWidth) > 2) {
        if (x - width / 2 - horizontalOffset < 0) {
          setAdjustedX(width / 2 + horizontalOffset)
        }
        if (x + width / 2 + horizontalOffset > chartWidth) {
          setAdjustedX(chartWidth - width / 2 - horizontalOffset)
        }
      }
    },
    [x]
  )
  return (
    <SvgText
      /*
      // @ts-ignore */
      onLayout={onLayout}
      fill={colors.gray4}
      fontSize="14"
      fontFamily="Inter-Regular"
      x={adjustedX}
      y={y}
      textAnchor="middle"
    >
      {value}
    </SvgText>
  )
}

function renderPointOnChart(
  chartData: Array<{ amount: number | BigNumber; displayValue: string }>,
  chartWidth: number,
  color: colors
) {
  let lowestRateIdx = 0,
    highestRateIdx = 0
  chartData.forEach((rate, idx) => {
    if (rate.amount > chartData[highestRateIdx].amount) {
      highestRateIdx = idx
    }
    if (rate.amount < chartData[lowestRateIdx].amount) {
      lowestRateIdx = idx
    }
  })
  return ({ datum, x, y }: { x: number; y: number; datum: { _x: number; _y: number } }) => {
    const idx = datum._x
    const result = []
    switch (idx) {
      case 0:
        result.push(
          <G key={idx + 'dot'}>
            <Line x1={0} y1={y} x2={chartWidth} y2={y} stroke={colors.gray2} strokeWidth="1" />
            <Circle cx={x} cy={y} r="4" fill={color} />
          </G>
        )
        break

      case chartData.length - 1:
        result.push(
          <G key={idx + 'dot'}>
            <Circle cx={x} cy={y} r="4" fill={color} />
          </G>
        )
        break
    }
    switch (idx) {
      case highestRateIdx:
        result.push(
          <ChartAwareSvgText
            x={x}
            y={y}
            key={idx}
            value={chartData[highestRateIdx].displayValue}
            position={'top'}
            chartWidth={chartWidth}
          />
        )
        break

      case lowestRateIdx:
        result.push(
          <ChartAwareSvgText
            x={x}
            y={y}
            key={idx}
            value={chartData[lowestRateIdx].displayValue}
            position={'bottom'}
            chartWidth={chartWidth}
          />
        )
        break
    }

    switch (result.length) {
      case 0:
        return null
      case 1:
        return result[0]
      default:
        return <>{result}</>
    }
  }
}

function Loader({ color }: { color: colors }) {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={color} />
    </View>
  )
}
/**
 * @deprecated - Use priceHistory/PriceHistoryChart.tsx instead as it handles multiple tokens
 */
function CeloGoldHistoryChart({
  testID,
  i18n,
  color = colors.goldBrand,
  containerStyle,
  chartPadding = variables.contentPadding,
}: Props) {
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const displayLocalCurrency = useCallback(
    (amount: BigNumber.Value) =>
      getLocalCurrencyDisplayValue(amount, localCurrencyCode || LocalCurrencyCode.USD, true),
    [localCurrencyCode]
  )
  const localExchangeRate = useSelector(usdToLocalCurrencyRateSelector)
  const dollarsToLocal = useCallback(
    (amount: BigNumber.Value | null) =>
      convertDollarsToLocalAmount(amount, localCurrencyCode ? localExchangeRate : 1),
    [localExchangeRate]
  )
  const exchangeHistory = useSelector(exchangeHistorySelector)
  const tokensBySymbol = useSelector(tokensBySymbolSelector)

  const onTap = useCallback(() => {
    ValoraAnalytics.track(CeloExchangeEvents.celo_chart_tapped)
  }, [])

  if (!exchangeHistory.aggregatedExchangeRates?.length) {
    return <Loader color={color} />
  }

  const chartData = exchangeHistory.aggregatedExchangeRates.map((exchangeRate) => {
    const localAmount = dollarsToLocal(exchangeRate.exchangeRate)
    return {
      amount: localAmount ? localAmount.toNumber() : 0,
      displayValue: localAmount ? displayLocalCurrency(localAmount) : '',
    }
  })

  const currentGoldRateInLocalCurrency =
    tokensBySymbol.CGLD?.lastKnownPriceUsd?.toNumber() ||
    chartData[chartData.length - 1].amount ||
    null
  const oldestGoldRateInLocalCurrency = chartData[0].amount
  if (oldestGoldRateInLocalCurrency === null || currentGoldRateInLocalCurrency === null) {
    return <Loader color={color} />
  }
  // We need displayValue to show min/max on the chart. In case the
  // current value is min/max we do not need to show it once again,
  // therefor displayValue = ''
  chartData.push({
    amount: currentGoldRateInLocalCurrency,
    displayValue: displayLocalCurrency(currentGoldRateInLocalCurrency),
  })
  const RenderPoint = renderPointOnChart(chartData, CHART_WIDTH, color)

  const values = chartData.map((el) => el.amount)
  const min = Math.min(...values)
  const max = Math.max(...values)
  let domain
  // ensure that vertical chart range is at least CHART_MIN_VERTICAL_RANGE
  if (max - min < CHART_MIN_VERTICAL_RANGE) {
    const offset = CHART_MIN_VERTICAL_RANGE - (max - min) / 2
    domain = {
      y: [min - offset, max + offset] as [number, number],
      x: [0, chartData.length - 1] as [number, number],
    }
  }
  const latestExchangeRate = _.last(exchangeHistory.aggregatedExchangeRates)!

  return (
    <View style={[styles.container, containerStyle]} onTouchStart={onTap} testID={testID}>
      <VictoryGroup
        domainPadding={CHART_DOMAIN_PADDING}
        singleQuadrantDomainPadding={false}
        padding={{ left: chartPadding, right: chartPadding }}
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        data={chartData.map((el) => el.amount)}
        domain={domain}
      >
        {/*
        // @ts-ignore */}
        <VictoryScatter dataComponent={<RenderPoint />} />
        <VictoryLine
          interpolation="monotoneX"
          style={{
            data: { stroke: color },
          }}
        />
      </VictoryGroup>
      <View style={[styles.range, { paddingHorizontal: chartPadding }]}>
        <Text style={styles.timeframe}>
          {formatFeedDate(latestExchangeRate.timestamp - exchangeHistory.range, i18n)}
        </Text>
        <Text style={styles.timeframe}>{formatFeedDate(latestExchangeRate.timestamp, i18n)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.Thick24,
  },
  loader: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT + 37.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeframe: {
    color: colors.gray3,
    fontSize: 16,
  },
  range: {
    marginTop: variables.contentPadding,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
})

export default withTranslation<Props>()(CeloGoldHistoryChart)
