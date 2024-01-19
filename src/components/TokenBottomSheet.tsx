import { debounce } from 'lodash'
import React, { RefObject, useCallback, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextStyle, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { SendEvents, TokenBottomSheetEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import SearchInput from 'src/components/SearchInput'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalanceItem } from 'src/tokens/TokenBalanceItem'
import { TokenBalance } from 'src/tokens/slice'

export enum TokenPickerOrigin {
  Send = 'Send',
  SendConfirmation = 'SendConfirmation',
  Exchange = 'Exchange',
  Swap = 'Swap',
}

export const DEBOUCE_WAIT_TIME = 200

interface Props<T extends TokenBalance> {
  forwardedRef: RefObject<BottomSheetRefType>
  origin: TokenPickerOrigin
  onTokenSelected: (token: T) => void
  title: string
  titleStyle?: TextStyle
  searchEnabled?: boolean
  snapPoints?: (string | number)[]
  tokens: T[]
  TokenOptionComponent?: React.ComponentType<TokenOptionProps>
  showPriceUsdUnavailableWarning?: boolean
}

export interface TokenOptionProps {
  tokenInfo: TokenBalance
  onPress: () => void
  index: number
  showPriceUsdUnavailableWarning?: boolean
}

/**
 * @deprecated new bottom sheets should use TokenBalanceItemOption
 */
export function TokenOption({ tokenInfo, onPress, index }: TokenOptionProps) {
  return (
    <>
      {index > 0 && <View style={styles.separator} />}
      <Touchable onPress={onPress} testID={`${tokenInfo.symbol}Touchable`}>
        <View style={styles.tokenOptionContainer}>
          <FastImage source={{ uri: tokenInfo.imageUrl }} style={styles.tokenImage} />
          <View style={styles.tokenNameContainer}>
            <Text style={styles.localBalance}>{tokenInfo.symbol}</Text>
            <Text style={styles.currencyBalance}>{tokenInfo.name}</Text>
          </View>
          <View style={styles.tokenBalanceContainer}>
            <TokenDisplay
              style={styles.localBalance}
              amount={tokenInfo.balance}
              tokenId={tokenInfo.tokenId}
              showLocalAmount={true}
              testID={`Local${tokenInfo.symbol}Balance`}
            />
            <TokenDisplay
              style={styles.currencyBalance}
              amount={tokenInfo.balance}
              tokenId={tokenInfo.tokenId}
              showLocalAmount={false}
              testID={`${tokenInfo.symbol}Balance`}
            />
          </View>
        </View>
      </Touchable>
    </>
  )
}

export function TokenBalanceItemOption({
  tokenInfo,
  onPress,
  showPriceUsdUnavailableWarning,
}: TokenOptionProps) {
  const { t } = useTranslation()
  return (
    <TokenBalanceItem
      token={tokenInfo}
      balanceUsdErrorFallback={t('tokenDetails.priceUnavailable') ?? undefined}
      onPress={onPress}
      containerStyle={styles.tokenBalanceItemContainer}
      showPriceUsdUnavailableWarning={showPriceUsdUnavailableWarning}
    />
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
        <InfoIcon color={Colors.infoDark} />
      </View>
      <Text style={styles.noResultsText}>
        <Trans i18nKey="tokenBottomSheet.noTokenInResult" tOptions={{ searchTerm }}>
          <Text style={styles.noResultsText} />
        </Trans>
      </Text>
    </View>
  )
}

function TokenBottomSheet<T extends TokenBalance>({
  forwardedRef,
  snapPoints,
  origin,
  onTokenSelected,
  tokens,
  searchEnabled,
  title,
  titleStyle,
  TokenOptionComponent = TokenOption,
  showPriceUsdUnavailableWarning,
}: Props<T>) {
  const [searchTerm, setSearchTerm] = useState('')

  const { t } = useTranslation()

  const onTokenPressed = (token: T) => () => {
    ValoraAnalytics.track(SendEvents.token_selected, {
      origin,
      tokenAddress: token.address,
      tokenId: token.tokenId,
      networkId: token.networkId,
    })
    onTokenSelected(token)
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
      titleStyle={titleStyle}
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
            // Duplicate keys could happen with token.address
            <React.Fragment key={`token-${tokenInfo.tokenId ?? index}`}>
              <TokenOptionComponent
                tokenInfo={tokenInfo}
                onPress={onTokenPressed(tokenInfo)}
                index={index}
                showPriceUsdUnavailableWarning={showPriceUsdUnavailableWarning}
              />
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
  tokenBalanceItemContainer: {
    marginHorizontal: 0,
  },
})

export default TokenBottomSheet
