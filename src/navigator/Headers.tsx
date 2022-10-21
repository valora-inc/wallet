import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import * as React from 'react'
import { Trans } from 'react-i18next'
import { Dimensions, PixelRatio, Platform, StyleSheet, Text, View } from 'react-native'
import BackButton from 'src/components/BackButton'
import CancelButton from 'src/components/CancelButton'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import TokenDisplay from 'src/components/TokenDisplay'
import i18n from 'src/i18n'
import Times from 'src/icons/Times'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { useBalance } from 'src/stableToken/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { useTokenInfo, useTokenInfoBySymbol } from 'src/tokens/hooks'
import { Currency } from 'src/utils/currencies'

export const noHeader: NativeStackNavigationOptions = {
  headerShown: false,
}

export const noHeaderGestureDisabled: NativeStackNavigationOptions = {
  headerShown: false,
  gestureEnabled: false,
}

export const styles = StyleSheet.create({
  headerTitle: {
    ...fontStyles.navigationHeader,
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
})

export const nuxNavigationOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerTransparent: true,
  headerBackVisible: false,
  headerLeft: ({ canGoBack }) => (canGoBack ? <BackButton /> : <View />),
  headerRight: () => <View />,
  headerTitle: () => <DisconnectBanner />,
  headerStyle: {
    backgroundColor: 'transparent',
  },
}

export const nuxNavigationOptionsNoBackButton: NativeStackNavigationOptions = {
  ...nuxNavigationOptions,
  headerLeft: () => <View />,
}

export const emptyHeader: NativeStackNavigationOptions = {
  headerTitle: ' ',
  headerShown: true,
  headerBackVisible: false,
  headerTitleStyle: [styles.headerTitle, styles.screenHeader],
  headerShadowVisible: false, // applied here
  // headerTitleContainerStyle: {
  //   alignItems: 'center',
  // },
  headerTitleAlign: 'center',
  // cardStyle: { backgroundColor: colors.light },
  headerStyle: {
    backgroundColor: colors.light,
    // shadowRadius: 0,
    // shadowOffset: {
    //   height: 0,
    //   width: 0,
    // },
    ...Platform.select({
      android: {
        elevation: 0,
        backgroundColor: 'transparent',
      },
      ios: {
        borderBottomWidth: 0,
        borderBottomColor: 'transparent',
      },
    }),
  },
}

export const drawerHeader: NativeStackNavigationOptions = {
  ...emptyHeader,
}

export const headerWithBackButton: NativeStackNavigationOptions = {
  ...emptyHeader,
  headerLeft: ({ canGoBack }) => (canGoBack ? <BackButton /> : null),
  animation: 'slide_from_right',
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
  // headerRightContainerStyle: { paddingRight: variables.contentPadding + 6 },
}

export const headerWithCloseButton: NativeStackNavigationOptions = {
  ...emptyHeader,
  headerLeft: () => <TopBarIconButton icon={<Times />} onPress={navigateBack} />,
  // headerLeftContainerStyle: { paddingLeft: 20 },
}

interface Props {
  title: string | JSX.Element
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
  const balance = useBalance(token)
  const tokenInfo = useTokenInfoBySymbol(token == Currency.Celo ? 'CELO' : token)

  const subTitle =
    balance != null ? (
      <Trans i18nKey="balanceAvailable">
        {displayCrypto ? (
          tokenInfo && (
            <TokenDisplay
              amount={balance}
              tokenAddress={tokenInfo.address}
              showLocalAmount={false}
              hideSign={false}
            />
          )
        ) : (
          <CurrencyDisplay
            style={switchTitleAndSubtitle ? styles.headerTitle : styles.headerSubTitle}
            amount={{
              value: balance,
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

interface TokenBalanceProps {
  title: string | JSX.Element
  token: string
}

export function HeaderTitleWithTokenBalance({ title, token }: TokenBalanceProps) {
  const tokenInfo = useTokenInfo(token)

  const subTitle = tokenInfo ? (
    <Trans i18nKey="balanceAvailable">
      <TokenDisplay
        style={styles.headerSubTitle}
        tokenAddress={token}
        amount={tokenInfo.balance}
        showLocalAmount={!!tokenInfo?.usdPrice}
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
  title: string | JSX.Element
  subTitle?: string | JSX.Element
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

HeaderTitleWithBalance.defaultProps = {
  token: Currency.Dollar,
}
