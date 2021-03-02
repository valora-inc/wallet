import Button, { BtnSizes } from '@celo/react-components/components/Button'
import Touchable from '@celo/react-components/components/Touchable'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { Fragment } from 'react'
import { useAsync } from 'react-async-hook'
import { Trans, useTranslation } from 'react-i18next'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CELO_REWARDS_LINK } from 'src/brandingConfig'
import {
  ConsumerIncentivesData,
  fetchConsumerRewardsContent,
  Tier,
} from 'src/consumerIncentives/contentFetcher'
import i18n, { Namespaces } from 'src/i18n'
import { consumerIncentives, leaves } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { getContentForCurrentLang } from 'src/utils/contentTranslations'
import Logger from 'src/utils/Logger'
import { formatFeedDate, getNextMondayAt8pmUtc } from 'src/utils/time'

const TAG = 'ConsumerIncentivesHomeScreen'

const useConsumerIncentivesContent = () => {
  const contentResult = useAsync<ConsumerIncentivesData>(fetchConsumerRewardsContent, [])
  let texts
  if (contentResult.result) {
    texts = getContentForCurrentLang(contentResult.result.content)
  }
  return {
    content: texts,
    tiers: contentResult.result?.tiers,
    loading: contentResult.loading,
    error: contentResult.error,
  }
}

const useAmountToAdd = (tiers: Tier[] | undefined) => {
  const dollarBalanceString = useSelector(stableTokenBalanceSelector) ?? '0'
  const dollarBalance = new BigNumber(dollarBalanceString)
  if (!tiers || tiers.length === 0) {
    return []
  }
  if (dollarBalance.isGreaterThanOrEqualTo(tiers[tiers.length - 1].minBalanceCusd)) {
    return []
  }
  let nextLevel = 1
  while (dollarBalance.isGreaterThanOrEqualTo(tiers[nextLevel - 1].minBalanceCusd)) {
    nextLevel++
  }
  return [
    new BigNumber(tiers[nextLevel - 1].minBalanceCusd).minus(dollarBalance).toFixed(0),
    nextLevel,
  ]
}

type Props = StackScreenProps<StackParamList, Screens.ConsumerIncentivesHomeScreen>
export default function ConsumerIncentivesHomeScreen(props: Props) {
  const { t } = useTranslation(Namespaces.consumerIncentives)
  const userIsVerified = useSelector((state) => state.app.numberVerified)
  const { content, tiers, loading, error } = useConsumerIncentivesContent()
  const [amountToAdd, nextLevel] = useAmountToAdd(tiers)
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch()

  if (!loading && error) {
    Logger.error(TAG, 'Error while loading remote texts from Firebase', error)
    dispatch(showError(ErrorMessages.FIREBASE_FETCH_FAILED))
    navigateBack()
    return null
  }

  const onPressCTA = () => {
    if (userIsVerified) {
      navigate(Screens.FiatExchangeOptions, { isCashIn: true })
    } else {
      navigate(Screens.VerificationEducationScreen, { hideOnboardingStep: true })
    }
  }

  const onLearnMore = () => navigate(Screens.WebViewScreen, { uri: CELO_REWARDS_LINK })

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <Image source={leaves} style={styles.backgroundImage} resizeMode={'stretch'} />
      <SafeAreaView edges={['bottom']} style={styles.contentContainer}>
        <Touchable
          style={[styles.closeButton, { marginTop: insets.top + 20 }]}
          onPress={navigateBack}
          borderless={true}
          hitSlop={variables.iconHitslop}
        >
          <Times />
        </Touchable>
        {loading && (
          <ActivityIndicator
            size="large"
            color={colors.greenBrand}
            style={styles.loading}
            testID="ConsumerIncentives/Loading"
          />
        )}
        {content && (
          <>
            <Image source={consumerIncentives} />
            <Text style={styles.title}>{t('title')}</Text>
            <Text style={[styles.body, styles.description]}>{t('description')}</Text>
            {amountToAdd && (
              <Text style={[styles.body, styles.description]}>
                <Trans
                  i18nKey={'addMore'}
                  ns={Namespaces.consumerIncentives}
                  tOptions={{
                    cUsdToAdd: amountToAdd,
                    date: formatFeedDate(getNextMondayAt8pmUtc(), i18n),
                    level: t('level', { level: nextLevel }),
                  }}
                >
                  <Text style={styles.bold} />
                  <Text style={styles.bold} />
                  <Text style={styles.bold} />
                </Trans>
              </Text>
            )}
            <View style={styles.tiersContainer}>
              {tiers &&
                tiers.map((tier, index) => (
                  <Fragment key={`tier${tier.celoReward}`}>
                    {index > 0 && <View style={styles.separator} />}
                    <Text style={styles.level}>{t('level', { level: index + 1 })}</Text>
                    <Text style={[styles.body, styles.tier]}>
                      {t('getCeloRewards', {
                        reward: tier.celoReward,
                        minBalance: tier.minBalanceCusd,
                      })}
                    </Text>
                  </Fragment>
                ))}
            </View>
            {content.extraSubtitle && <Text style={styles.subtitle}>{content.extraSubtitle}</Text>}
            {content.extraBody && <Text style={styles.body}>{content.extraBody}</Text>}
            {!userIsVerified && (
              <>
                <Text style={styles.subtitle}>{content.unverifiedSubtitle}</Text>
                <Text style={styles.body}>{content.unverifiedBody}</Text>
              </>
            )}
            <View style={styles.buttonContainer}>
              <Button
                size={BtnSizes.FULL}
                text={userIsVerified ? t('addCusd') : t('accountScreen10:confirmNumber')}
                onPress={onPressCTA}
                testID="ConsumerIncentives/CTA"
              />
            </View>
            <TouchableOpacity onPress={onLearnMore} testID="ConsumerIncentives/learnMore">
              <Text style={styles.learnMore}>{t('global:learnMore')}</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    </ScrollView>
  )
}

ConsumerIncentivesHomeScreen.navOptions = noHeader

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    top: 0,
    left: 0,
    right: 0,
  },
  closeButton: {
    alignSelf: 'flex-start',
  },
  loading: {
    height: '100%',
  },
  title: {
    ...fontStyles.h2,
    marginTop: 16,
    textAlign: 'center',
  },
  description: {
    marginTop: 16,
  },
  tiersContainer: {
    width: '100%',
    marginTop: 32,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 4,
  },
  subtitle: {
    ...fontStyles.h2,
    fontSize: 20,
    marginTop: 40,
    marginBottom: 10,
    textAlign: 'center',
  },
  level: {
    ...fontStyles.regular,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    ...fontStyles.regular,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.gray3,
    marginVertical: 16,
    marginHorizontal: 8,
  },
  tier: {
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  perMonth: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  buttonContainer: {
    marginTop: 36,
    width: '100%',
  },
  learnMore: {
    ...fontStyles.notificationHeadline,
    fontSize: 17,
    alignSelf: 'center',
    marginVertical: 24,
    color: colors.greenUI,
  },
})
