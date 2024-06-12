import { useHeaderHeight } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { EARN_STABLECOINS_LEARN_MORE } from 'src/config'
import ArrowDown from 'src/icons/ArrowDown'
import Blob from 'src/icons/Blob'
import CircledIcon from 'src/icons/CircledIcon'
import Logo from 'src/icons/Logo'
import Palm from 'src/icons/Palm'
import UpwardGraph from 'src/icons/UpwardGraph'
import { headerWithCloseButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

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
      <CircledIcon backgroundColor={Colors.gray2} radius={ICON_BACKGROUND_CIRCLE_SIZE}>
        {icon}
      </CircledIcon>
      <View style={styles.flex}>
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
  const { tokenId } = route.params
  const isGasSubsidized = getFeatureGate(StatsigFeatureGates.SUBSIDIZE_STABLECOIN_EARN_GAS_FEES)

  const headerHeight = useHeaderHeight()
  const { bottom } = useSafeAreaInsets()
  const insetsStyle = {
    paddingBottom: Math.max(bottom, Spacing.Regular16),
  }

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { paddingTop: headerHeight }]} edges={[]}>
      <ScrollView>
        <Text style={styles.title}>{t('earnFlow.earnInfo.title')}</Text>
        <View style={styles.detailsContainer}>
          <DetailsItem
            icon={<UpwardGraph size={ICON_SIZE} color={Colors.black} />}
            title={
              isGasSubsidized
                ? t('earnFlow.earnInfo.details.earn.titleGasSubsidy')
                : t('earnFlow.earnInfo.details.earn.title')
            }
            subtitle={t('earnFlow.earnInfo.details.earn.subtitle')}
            footnote={
              isGasSubsidized ? t('earnFlow.earnInfo.details.earn.footnoteSubsidy') : undefined
            }
          />
          <DetailsItem
            icon={<Logo size={ICON_SIZE} color={Colors.black} />}
            title={t('earnFlow.earnInfo.details.manage.title')}
            subtitle={t('earnFlow.earnInfo.details.manage.subtitle')}
          />
          <DetailsItem
            icon={<ArrowDown size={ICON_SIZE} color={Colors.black} />}
            title={t('earnFlow.earnInfo.details.access.title')}
            subtitle={t('earnFlow.earnInfo.details.access.subtitle')}
          />
        </View>
      </ScrollView>
      <View style={[styles.buttonContainer, insetsStyle]}>
        <Button
          onPress={() => {
            ValoraAnalytics.track(EarnEvents.earn_info_learn_press)
            navigate(Screens.WebViewScreen, { uri: EARN_STABLECOINS_LEARN_MORE })
          }}
          text={t('earnFlow.earnInfo.action.learn')}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
        />
        <Button
          onPress={() => {
            ValoraAnalytics.track(EarnEvents.earn_info_earn_press, { tokenId })
            navigate(Screens.EarnEnterAmount, { tokenId })
          }}
          text={t('earnFlow.earnInfo.action.earn')}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
        />
      </View>
      <Blob
        style={{
          position: 'absolute',
          left: 53,
          zIndex: -1,
        }}
      />
      <Palm
        style={{
          position: 'absolute',
          bottom: 0,
          zIndex: -1,
        }}
      />
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
    paddingHorizontal: Spacing.Regular16,
  },
  flex: {
    flex: 1,
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
