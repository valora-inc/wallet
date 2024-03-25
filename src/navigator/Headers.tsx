import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import * as React from 'react'
import { Trans } from 'react-i18next'
import { Dimensions, PixelRatio, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import AccountCircleButton from 'src/components/AccountCircleButton'
import BackButton from 'src/components/BackButton'
import CancelButton from 'src/components/CancelButton'
import CloseButton from 'src/components/CloseButton'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import LegacyTokenDisplay from 'src/components/LegacyTokenDisplay'
import QrScanButton from 'src/components/QrScanButton'
import TokenDisplay from 'src/components/TokenDisplay'
import NotificationBell from 'src/home/NotificationBell'
import i18n from 'src/i18n'
import BackChevronCentered from 'src/icons/BackChevronCentered'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfoByCurrency } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import { Currency } from 'src/utils/currencies'

export const noHeader: NativeStackNavigationOptions = {
  headerShown: false,
}

export const noHeaderGestureDisabled: NativeStackNavigationOptions = {
  headerShown: false,
  gestureEnabled: false,
}

const android_ripple = {
  color: colors.gray2,
  foreground: true,
  borderless: true,
}

export const headerTransparentWithBack: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  animationDuration: 130,
  headerShown: true,
  headerTransparent: true,
  // Needed for Android to truly make the header transparent
  headerStyle: {
    backgroundColor: 'transparent',
  },
  headerLeft: ({ canGoBack }) =>
    canGoBack ? (
      Platform.OS === 'ios' ? (
        <TopBarIconButton
          onPress={navigateBack}
          icon={<BackChevronCentered />}
          style={styles.floatingButton}
          testID="FloatingBackButton"
        />
      ) : (
        <Pressable
          android_ripple={android_ripple}
          onPress={navigateBack}
          style={styles.floatingButton}
          testID="FloatingBackButton"
        >
          <BackChevronCentered />
        </Pressable>
      )
    ) : null,
}

export const styles = StyleSheet.create({
  headerTitle: {
    ...typeScale.labelSemiBoldMedium,
    maxWidth: Dimensions.get('window').width * 0.6,
  },
  headerSubTitle: {
    color: colors.gray4,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenHeader: {
    textAlign: 'center',
    fontWeight: undefined,
  },
  floatingButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.black,
    borderRadius: 100,
    elevation: 4,
    height: 32,
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: 32,
  },
  topElementsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export const nuxNavigationOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerTransparent: true,
  // Prevents double back button on Android
  headerBackVisible: false,
  headerLeft: ({ canGoBack }) => (canGoBack ? <BackButton /> : <View />),
  headerRight: () => <View />,
  headerTitle: () => <DisconnectBanner />,
  headerStyle: {
    backgroundColor: 'transparent',
  },
}

export const nuxNavigationOptionsOnboarding: NativeStackNavigationOptions = {
  ...nuxNavigationOptions,
  headerLeft: ({ canGoBack }) =>
    canGoBack ? <BackButton color={colors.onboardingBrownLight} /> : <View />,
}

export const nuxNavigationOptionsNoBackButton: NativeStackNavigationOptions = {
  ...nuxNavigationOptions,
  headerLeft: () => <View />,
}

export const emptyHeader: NativeStackNavigationOptions = {
  headerTitle: ' ',
  headerShown: true,
  // Prevents double back button on Android
  headerBackVisible: false,
  headerTitleStyle: [styles.headerTitle, styles.screenHeader],
  headerShadowVisible: false,
  headerTitleAlign: 'center',
  headerStyle: {
    backgroundColor: colors.white,
  },
}

export const drawerHeader: NativeStackNavigationOptions = {
  ...emptyHeader,
}

export const headerWithBackButton: NativeStackNavigationOptions = {
  ...emptyHeader,
  headerLeft: ({ canGoBack }) => (canGoBack ? <BackButton /> : null),
}

export const headerWithCancelButton: NativeStackNavigationOptions = {
  ...emptyHeader,
  headerLeft: () => <CancelButton />,
}

export const headerWithBackEditButtons: NativeStackNavigationOptions = {
  ...emptyHeader,
  headerLeft: () =>
    PixelRatio.getFontScale() > 1 ? (
      <CancelButton buttonType="icon" />
    ) : (
      <CancelButton buttonType="text" />
    ),
  headerRight: () => <BackButton />,
}

interface Props {
  title: string | React.ReactNode
  token: Currency
  switchTitleAndSubtitle?: boolean
  displayCrypto?: boolean
}

export function HeaderTitleWithBalance({
  title,
  token,
  switchTitleAndSubtitle = false,
  displayCrypto = false,
}: Props) {
  const tokenInfo = useTokenInfoByCurrency(token)

  const subTitle =
    tokenInfo?.balance != undefined ? (
      <Trans i18nKey="balanceAvailable">
        {displayCrypto ? (
          tokenInfo && (
            <LegacyTokenDisplay
              amount={tokenInfo.balance}
              tokenAddress={tokenInfo.address}
              showLocalAmount={false}
              hideSign={false}
            />
          )
        ) : (
          <CurrencyDisplay
            style={switchTitleAndSubtitle ? styles.headerTitle : styles.headerSubTitle}
            amount={{
              value: tokenInfo.balance,
              currencyCode: token,
            }}
          />
        )}
      </Trans>
    ) : (
      // TODO: a null balance doesn't necessarily mean it's loading
      i18n.t('loading')
    )

  return (
    <HeaderTitleWithSubtitle
      title={switchTitleAndSubtitle ? subTitle : title}
      subTitle={switchTitleAndSubtitle ? title : subTitle}
    />
  )
}

export function HeaderTitleWithTokenBalance({
  title,
  showLocalAmount,
  tokenInfo,
}: {
  title: string | React.ReactNode
  tokenInfo: TokenBalance | undefined
  showLocalAmount: boolean
}) {
  const subTitle = tokenInfo ? (
    <Trans i18nKey="balanceAvailable">
      <TokenDisplay
        amount={tokenInfo.balance}
        tokenId={tokenInfo.tokenId}
        showLocalAmount={showLocalAmount}
        style={styles.headerSubTitle}
      />
    </Trans>
  ) : (
    '-'
  )

  return <HeaderTitleWithSubtitle title={title} subTitle={subTitle} />
}

export function HeaderTitleWithSubtitle({
  title,
  subTitle,
  testID,
}: {
  title: string | React.ReactNode
  subTitle?: string | React.ReactNode
  testID?: string
}) {
  return (
    <View style={styles.header} testID={testID}>
      {title && (
        <Text
          testID="HeaderTitle"
          style={styles.headerTitle}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {title}
        </Text>
      )}
      {subTitle && (
        <Text
          testID="HeaderSubTitle"
          style={styles.headerSubTitle}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {subTitle}
        </Text>
      )}
    </View>
  )
}

export const tabHeader: NativeStackNavigationOptions = {
  ...emptyHeader,
  headerRight: () => (
    <View style={[styles.topElementsContainer, { marginRight: Spacing.Tiny4 }]}>
      <QrScanButton testID="WalletHome/QRScanButton" />
      <NotificationBell testID="WalletHome/NotificationBell" />
    </View>
  ),
  headerLeft: () => (
    <View style={[styles.topElementsContainer, { marginLeft: Spacing.Tiny4 }]}>
      <AccountCircleButton testID="WalletHome/AccountCircle" />
    </View>
  ),
}

export const headerWithCloseButton: NativeStackNavigationOptions = {
  ...emptyHeader,
  headerLeft: () => (
    // The negative margin is to fix an issue with margin added via the stack navigator
    // https://github.com/react-navigation/react-navigation/issues/11295
    <View style={[styles.topElementsContainer, { marginLeft: -Spacing.Small12 }]}>
      <CloseButton testID="CloseButton" />
    </View>
  ),
}

HeaderTitleWithBalance.defaultProps = {
  token: Currency.Dollar,
}
