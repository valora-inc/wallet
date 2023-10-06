import { debounce } from 'lodash'
import React, { RefObject, useCallback, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SendEvents, TokenBottomSheetEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import LegacyTokenDisplay from 'src/components/LegacyTokenDisplay'
import SearchInput from 'src/components/SearchInput'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalanceWithAddress } from 'src/tokens/slice'

export enum TokenPickerOrigin {
  Send = 'Send',
  SendConfirmation = 'SendConfirmation',
  Exchange = 'Exchange',
  Swap = 'Swap',
}

export const DEBOUCE_WAIT_TIME = 200

interface Props {
  forwardedRef: RefObject<BottomSheetRefType>
  origin: TokenPickerOrigin
  onTokenSelected: (tokenAddress: string) => void
  tokens: TokenBalanceWithAddress[]
  title: string
  searchEnabled?: boolean
  snapPoints?: (string | number)[]
}

function TokenOption({
  tokenInfo,
  onPress,
}: {
  tokenInfo: TokenBalanceWithAddress
  onPress: () => void
}) {
  return (
    <Touchable onPress={onPress} testID={`${tokenInfo.symbol}Touchable`}>
      <View style={styles.tokenOptionContainer}>
        <Image source={{ uri: tokenInfo.imageUrl }} style={styles.tokenImage} />
        <View style={styles.tokenNameContainer}>
          <Text style={styles.localBalance}>{tokenInfo.symbol}</Text>
          <Text style={styles.currencyBalance}>{tokenInfo.name}</Text>
        </View>
        <View style={styles.tokenBalanceContainer}>
          <LegacyTokenDisplay
            style={styles.localBalance}
            amount={tokenInfo.balance}
            tokenAddress={tokenInfo.address}
            showLocalAmount={true}
            testID={`Local${tokenInfo.symbol}Balance`}
          />
          <LegacyTokenDisplay
            style={styles.currencyBalance}
            amount={tokenInfo.balance}
            tokenAddress={tokenInfo.address}
            showLocalAmount={false}
            testID={`${tokenInfo.symbol}Balance`}
          />
        </View>
      </View>
    </Touchable>
  )
}

function NoResults({
  testID = 'TokenBottomSheet/NoResult',
  searchTerm,
}: {
  testID?: string
  searchTerm: string
}) {
  return (
    <View testID={testID} style={styles.noResultsContainer}>
      <View style={styles.iconContainer}>
        <InfoIcon color={Colors.onboardingBlue} />
      </View>
      <Text style={styles.noResultsText}>
        <Trans i18nKey="tokenBottomSheet.noTokenInResult" tOptions={{ searchTerm }}>
          <Text style={styles.noResultsText} />
        </Trans>
      </Text>
    </View>
  )
}

function TokenBottomSheet({
  forwardedRef,
  snapPoints,
  origin,
  onTokenSelected,
  tokens,
  searchEnabled,
  title,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('')

  const { t } = useTranslation()

  const onTokenPressed = (tokenAddress: string) => () => {
    ValoraAnalytics.track(SendEvents.token_selected, {
      origin,
      tokenAddress,
    })
    onTokenSelected(tokenAddress)
    setSearchTerm('')
  }

  const sendAnalytics = useCallback(
    debounce((searchInput: string) => {
      ValoraAnalytics.track(TokenBottomSheetEvents.search_token, {
        origin,
        searchInput,
      })
    }, DEBOUCE_WAIT_TIME),
    []
  )

  const tokenList = useMemo(
    () =>
      tokens.filter((tokenInfo) => {
        if (searchTerm.length === 0) {
          return true
        }
        return (
          tokenInfo.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tokenInfo.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }),
    [searchTerm, tokens]
  )

  const handleClose = () => {
    setSearchTerm('')
  }

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      snapPoints={snapPoints}
      title={title}
      stickyTitle={searchEnabled}
      stickyHeaderComponent={
        searchEnabled && (
          <SearchInput
            placeholder={t('tokenBottomSheet.searchAssets') ?? undefined}
            value={searchTerm}
            onChangeText={(text) => {
              setSearchTerm(text)
              sendAnalytics(text)
            }}
            style={styles.searchInput}
            returnKeyType={'search'}
            // disable autoCorrect and spellCheck since the search terms here
            // are token names which autoCorrect would get in the way of. This
            // combination also hides the keyboard suggestions bar from the top
            // of the iOS keyboard, preserving screen real estate.
            autoCorrect={false}
            spellCheck={false}
          />
        )
      }
      onClose={handleClose}
      testId="TokenBottomSheet"
    >
      {tokenList.length == 0 ? (
        searchEnabled ? (
          <NoResults searchTerm={searchTerm} />
        ) : null
      ) : (
        tokenList.map((tokenInfo, index) => {
          return (
            <React.Fragment key={`token-${tokenInfo.address}`}>
              {index > 0 && <View style={styles.separator} />}
              <TokenOption tokenInfo={tokenInfo} onPress={onTokenPressed(tokenInfo.address)} />
            </React.Fragment>
          )
        })
      )}
    </BottomSheet>
  )
}

TokenBottomSheet.navigationOptions = {}

const styles = StyleSheet.create({
  tokenOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.Regular16,
  },
  tokenImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.Small12,
  },
  tokenNameContainer: {
    flex: 3,
    alignItems: 'flex-start',
    flexShrink: 1,
  },
  tokenBalanceContainer: {
    flex: 2,
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  localBalance: {
    flexShrink: 1,
    ...fontStyles.regular,
  },
  currencyBalance: {
    flexShrink: 1,
    ...fontStyles.small,
    color: colors.gray4,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: colors.gray2,
  },
  searchInput: {
    marginTop: Spacing.Regular16,
  },
  iconContainer: {
    marginRight: Spacing.Small12,
  },
  noResultsText: {
    ...fontStyles.regular500,
    flex: 1,
  },
  noResultsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.Regular16,
  },
})

export default TokenBottomSheet
