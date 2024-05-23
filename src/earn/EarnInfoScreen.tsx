import { useHeaderHeight } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EARN_STABLECOINS_LEARN_MORE } from 'src/brandingConfig'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { useAavePoolInfo } from 'src/earn/hooks'
import ArrowDown from 'src/icons/ArrowDown'
import CircledIcon from 'src/icons/CircledIcon'
import Logo from 'src/icons/Logo'
import UpwardGraph from 'src/icons/UpwardGraph'
import { headerWithCloseButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'

const ICON_SIZE = 24
const ICON_BACKGROUND_CIRCLE_SIZE = 36

function DetailsItem({
  icon,
  title,
  subtitle,
  footnote,
}: {
  icon: ReactElement
  title: string
  subtitle: string
  footnote?: string
}) {
  return (
    <View style={styles.detailsItemContainer}>
      <CircledIcon backgroundColor={Colors.white} radius={ICON_BACKGROUND_CIRCLE_SIZE}>
        {icon}
      </CircledIcon>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailsItemTitle}>{title}</Text>
        <Text style={styles.detailsItemSubtitle}>{subtitle}</Text>
        {!!footnote && <Text style={styles.detailsItemFootnote}>{footnote}</Text>}
      </View>
    </View>
  )
}

type Props = NativeStackScreenProps<StackParamList, Screens.EarnInfoScreen>

export default function EarnInfoScreen({ route }: Props) {
  const { t } = useTranslation()
  const { depositTokenId } = route.params
  const headerHeight = useHeaderHeight()

  const tokenInfo = useTokenInfo(depositTokenId)
  const tokenSymbol = tokenInfo?.symbol

  const asyncPoolInfo = useAavePoolInfo({ depositTokenId })
  const apy = asyncPoolInfo?.result?.apy

  const isGasSubsidized = getFeatureGate(StatsigFeatureGates.SUBSIDIZE_STABLECOIN_EARN_GAS_FEES)
  const { providerName } = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.EARN_STABLECOIN_CONFIG]
  )

  return (
    <SafeAreaView
      style={[styles.safeAreaContainer, { paddingTop: headerHeight }]}
      edges={['bottom']}
    >
      <ScrollView>
        {apy ? (
          <Text style={styles.title}>
            {t('earnFlow.earnInfo.titleWithApy', { apy: (apy * 100).toFixed(2), tokenSymbol })}
          </Text>
        ) : (
          <Text style={styles.title}>
            {t('earnFlow.earnInfo.titleWithoutApy', { tokenSymbol })}
          </Text>
        )}
        <View style={styles.detailsContainer}>
          <DetailsItem
            icon={<UpwardGraph size={ICON_SIZE} color={Colors.black} />}
            title={t('earnFlow.earnInfo.details.earn.title')}
            subtitle={t('earnFlow.earnInfo.details.earn.subtitle', { tokenSymbol, providerName })}
            footnote={isGasSubsidized ? t('earnFlow.earnInfo.details.earn.footnote') : undefined}
          />
          <DetailsItem
            icon={<Logo size={ICON_SIZE} color={Colors.black} />}
            title={t('earnFlow.earnInfo.details.manage.title')}
            subtitle={t('earnFlow.earnInfo.details.manage.subtitle', { providerName })}
          />
          <DetailsItem
            icon={<ArrowDown size={ICON_SIZE} color={Colors.black} />}
            title={t('earnFlow.earnInfo.details.access.title')}
            subtitle={t('earnFlow.earnInfo.details.access.subtitle', { providerName })}
          />
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button
          onPress={() => {
            navigate(Screens.WebViewScreen, { uri: EARN_STABLECOINS_LEARN_MORE })
          }}
          text={t('earnFlow.earnInfo.action.learn')}
          type={BtnTypes.GRAY_WITH_BORDER}
          size={BtnSizes.FULL}
        />
        <Button
          onPress={() => {
            navigate(Screens.EarnEnterAmount, { tokenId: depositTokenId })
          }}
          text={t('earnFlow.earnInfo.action.earn')}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
        />
      </View>
    </SafeAreaView>
  )
}

EarnInfoScreen.navigationOptions = () => ({
  ...headerWithCloseButton,
  headerTransparent: true,
  headerShown: true,
  headerStyle: {
    backgroundColor: 'transparent',
  },
})

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: Colors.yellowishOrange,
    paddingHorizontal: Spacing.Regular16,
  },
  title: {
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.Thick24,
    ...typeScale.titleLarge,
  },
  detailsContainer: {
    gap: Spacing.Large32,
  },
  detailsItemContainer: {
    flexDirection: 'row',
    gap: Spacing.Regular16,
  },
  detailsItemTitle: {
    color: Colors.black,
    ...typeScale.labelSemiBoldSmall,
  },
  detailsItemSubtitle: {
    color: Colors.black,
    ...typeScale.bodyXSmall,
  },
  detailsItemFootnote: {
    color: Colors.black,
    marginTop: Spacing.Smallest8,
    ...typeScale.bodyXXSmall,
  },
  buttonContainer: {
    gap: Spacing.Smallest8,
    marginHorizontal: Spacing.Smallest8,
  },
})
