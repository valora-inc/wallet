import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import { Duration, intervalToDuration } from 'date-fns'
import React, { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { EarnPosition } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { formattedAge } from 'src/utils/time'

function TitleSection({
  title,
  tokensInfo,
  providerName,
  networkName,
}: {
  title: string
  tokensInfo: TokenBalance[]
  providerName: string
  networkName: string
}) {
  return (
    <View style={styles.titleContainer}>
      <TokenIcons tokensInfo={tokensInfo} />
      <Text style={styles.title}>{title}</Text>
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitleLabel}>
          <Trans i18nKey="earnFlow.poolInfoScreen.chainName" values={{ networkName }}>
            <Text style={styles.subtitleInfo}></Text>
          </Trans>
        </Text>
        <Text style={styles.subtitleLabel}>
          <Trans i18nKey="earnFlow.poolInfoScreen.protocolName" values={{ providerName }}>
            <Text style={styles.subtitleInfo}></Text>
          </Trans>
        </Text>
      </View>
    </View>
  )
}

function TokenIcons({
  tokensInfo,
  size = IconSize.MEDIUM,
  showNetworkIcon = true,
}: {
  tokensInfo: TokenBalance[]
  size?: IconSize
  showNetworkIcon?: boolean
}) {
  return (
    <View style={styles.tokenIconsContainer}>
      {tokensInfo.map((token, index) => (
        <TokenIcon
          key={token.tokenId}
          token={token}
          viewStyle={!!index && { marginLeft: -Spacing.Regular16, zIndex: -index }}
          size={size}
          showNetworkIcon={showNetworkIcon}
        />
      ))}
    </View>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>
}

function YieldCard({
  infoIconPress,
  tokensInfo,
  earnPosition,
}: {
  infoIconPress: () => void
  tokensInfo: TokenBalance[]
  earnPosition: EarnPosition
}) {
  const { t } = useTranslation()
  const yieldRateSum = earnPosition.dataProps.yieldRates
    .map((rate) => rate.percentage)
    .reduce((acc, rate) => acc + rate, 0)

  return (
    <Card>
      <View style={styles.cardLineContainer}>
        <View style={styles.cardLineLabel}>
          <Text numberOfLines={1} style={styles.cardTitleText}>
            {t('earnFlow.poolInfoScreen.yieldRate')}
          </Text>
          <Touchable onPress={infoIconPress}>
            <InfoIcon size={16} color={Colors.gray3} />
          </Touchable>
        </View>
        <Text style={styles.cardTitleText}>
          {yieldRateSum > 0
            ? t('earnFlow.poolInfoScreen.ratePercent', { rate: yieldRateSum.toFixed(2) })
            : '--'}
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        {earnPosition.dataProps.yieldRates.map((rate, index) => {
          // TODO: investigate how to do when there are multiple tokens in a yield rate
          const tokenInfo = tokensInfo.filter((token) => token.tokenId === rate.tokenId)
          return (
            <View style={styles.cardLineContainer} key={index}>
              <View style={styles.cardLineLabel}>
                <Text style={styles.cardLabelText}>{rate.label}</Text>
                <TokenIcons
                  tokensInfo={tokenInfo}
                  size={IconSize.XXSMALL}
                  showNetworkIcon={false}
                />
              </View>
              <Text style={styles.cardLabelText}>
                {t('earnFlow.poolInfoScreen.ratePercent', { rate: rate.percentage.toFixed(2) })}
              </Text>
            </View>
          )
        })}
      </View>
    </Card>
  )
}

function TvlCard({
  earnPosition,
  infoIconPress,
}: {
  earnPosition: EarnPosition
  infoIconPress: () => void
}) {
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const { t } = useTranslation()
  const tvl = earnPosition.dataProps.tvl
  const priceUsd = earnPosition.priceUsd
  const tvlInFiat = useDollarsToLocalAmount(
    tvl ? new BigNumber(tvl).times(new BigNumber(priceUsd)) : null
  )
  const tvlString = useMemo(() => {
    return `${localCurrencySymbol}${tvlInFiat ? formatValueToDisplay(tvlInFiat) : '--'}`
  }, [localCurrencySymbol, tvlInFiat])

  return (
    <Card>
      <View style={styles.cardLineContainer}>
        <View style={styles.cardLineLabel}>
          <Text numberOfLines={1} style={styles.cardTitleText}>
            {t('earnFlow.poolInfoScreen.tvl')}
          </Text>
          <Touchable onPress={infoIconPress}>
            <InfoIcon size={16} color={Colors.gray3} />
          </Touchable>
        </View>
        <Text style={styles.cardTitleText}>{tvlString}</Text>
      </View>
    </Card>
  )
}

function AgeCard({ ageOfPool, infoIconPress }: { ageOfPool: Date; infoIconPress: () => void }) {
  const { t } = useTranslation()
  const dateInterval: Duration = intervalToDuration({
    start: ageOfPool,
    end: new Date(),
  })

  return (
    <Card>
      <View style={styles.cardLineContainer}>
        <View style={styles.cardLineLabel}>
          <Text numberOfLines={1} style={styles.cardTitleText}>
            {t('earnFlow.poolInfoScreen.ageOfPool')}
          </Text>
          <Touchable onPress={infoIconPress}>
            <InfoIcon size={16} color={Colors.gray3} />
          </Touchable>
        </View>
        <Text style={styles.cardTitleText}>{formattedAge(dateInterval)}</Text>
      </View>
    </Card>
  )
}

type Props = NativeStackScreenProps<StackParamList, Screens.EarnPoolInfoScreen>

export default function EarnPoolInfoScreen({ route }: Props) {
  const { networkId, tokens, displayProps, appName, dataProps } = route.params.pool
  const allTokens = useSelector((state) => tokensByIdSelector(state, [networkId]))
  const tokensInfo = useMemo(() => {
    return tokens
      .map((token) => allTokens[token.tokenId])
      .filter((token): token is TokenBalance => !!token)
  }, [tokens, allTokens])

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <TitleSection
          title={displayProps.title}
          tokensInfo={tokensInfo}
          providerName={appName}
          networkName={NETWORK_NAMES[networkId]}
        />
        <View style={{ height: Spacing.Thick24 }} />
        <View style={styles.cardsContainer}>
          <YieldCard
            infoIconPress={() => Logger.debug('YieldCard Info Icon Pressed!')}
            tokensInfo={tokensInfo}
            earnPosition={route.params.pool}
          />
          <TvlCard
            earnPosition={route.params.pool}
            infoIconPress={() => Logger.debug(' TvlCard Info Icon Pressed!')}
          />
          {dataProps.contractCreatedAt ? (
            <AgeCard
              ageOfPool={new Date(dataProps.contractCreatedAt)}
              infoIconPress={() => Logger.debug('AgeCard Info Icon Pressed!')}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: Spacing.Thick24,
  },
  container: {
    flex: 1,
  },
  title: {
    ...typeScale.titleMedium,
  },
  subtitleLabel: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
  subtitleInfo: {
    ...typeScale.labelSmall,
    color: Colors.black,
  },
  titleContainer: {
    gap: Spacing.Smallest8,
  },
  subtitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: Spacing.Thick24,
    rowGap: 0, // Set to Zero to prevent gap between rows when flexWrap is set to wrap
    flexWrap: 'wrap',
  },
  tokenIconsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  cardsContainer: {
    gap: Spacing.Regular16,
  },
  card: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: Spacing.Thick24,
    gap: 16,
  },
  cardLineContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLineLabel: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    paddingRight: 20, // Prevents Icon from being cut off on long labels
  },
  cardTitleText: {
    ...typeScale.labelSemiBoldLarge,
    color: Colors.black,
  },
  cardLabelText: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
})
