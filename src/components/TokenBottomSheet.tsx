import { throttle } from 'lodash'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SendEvents, TokenBottomSheetEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet from 'src/components/BottomSheet'
import SearchInput from 'src/components/SearchInput'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import Times from 'src/icons/Times'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'

export enum TokenPickerOrigin {
  Send = 'Send',
  SendConfirmation = 'SendConfirmation',
  Exchange = 'Exchange',
  Swap = 'Swap',
}

interface Props {
  isVisible: boolean
  origin: TokenPickerOrigin
  onTokenSelected: (tokenAddress: string) => void
  onClose: () => void
  tokens: TokenBalance[]
  searchEnabled?: boolean
  titleText: string
}

function TokenOption({ tokenInfo, onPress }: { tokenInfo: TokenBalance; onPress: () => void }) {
  return (
    <Touchable onPress={onPress} testID={`${tokenInfo.symbol}Touchable`}>
      <View style={styles.tokenOptionContainer}>
        <Image source={{ uri: tokenInfo.imageUrl }} style={styles.tokenImage} />
        <View style={styles.tokenNameContainer}>
          <Text style={styles.localBalance}>{tokenInfo.symbol}</Text>
          <Text style={styles.currencyBalance}>{tokenInfo.name}</Text>
        </View>
        <View style={styles.tokenBalanceContainer}>
          <TokenDisplay
            style={styles.localBalance}
            amount={tokenInfo.balance}
            tokenAddress={tokenInfo.address}
            showLocalAmount={true}
            testID={`Local${tokenInfo.symbol}Balance`}
          />
          <TokenDisplay
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

// TODO: In the exchange flow or when requesting a payment, only show CELO & stable tokens.
function TokenBottomSheet({
  isVisible,
  origin,
  onTokenSelected,
  onClose,
  tokens,
  searchEnabled,
  titleText,
}: Props) {
  const [tokenList, setTokenList] = useState(tokens)
  const [searchQuery, setSearchQuery] = useState('')

  const { t } = useTranslation()

  const resetSearchState = () => {
    setSearchQuery('')
    setTokenList(tokens)
  }

  const onCloseBottomSheet = () => {
    resetSearchState()
    onClose()
  }

  const onTokenPressed = (tokenAddress: string) => () => {
    resetSearchState()
    ValoraAnalytics.track(SendEvents.token_selected, {
      origin,
      tokenAddress,
    })
    onTokenSelected(tokenAddress)
  }

  const throttleSearch = throttle((searchInput: string) => {
    const matchedTokens = tokens.filter((tokenInfo) => {
      if (searchInput.length === 0) {
        return true
      }

      return (
        tokenInfo.symbol.toLowerCase().includes(searchInput.toLowerCase()) ||
        tokenInfo.name.toLowerCase().includes(searchInput.toLowerCase())
      )
    })
    setTokenList(matchedTokens)

    ValoraAnalytics.track(TokenBottomSheetEvents.search_token, {
      origin,
      searchInput,
    })
  }, 100)

  const title = <Text style={styles.title}>{titleText}</Text>

  const searchInput = (
    <SearchInput
      placeholder={t('searchAssets')}
      value={searchQuery}
      onChangeText={(text) => {
        setSearchQuery(text)
        throttleSearch(text)
      }}
      style={styles.searchInput}
      returnKeyType={'search'}
    />
  )

  const stickyHeader = (
    <>
      <View style={styles.stickyHeader}>
        <View style={{ flex: 10 }}>{title}</View>
        <Touchable style={{ flex: 1 }} onPress={onCloseBottomSheet}>
          <Times />
        </Touchable>
      </View>
      {searchEnabled && searchInput}
    </>
  )

  const noTokensComponent = (
    <View style={styles.viewContainer}>
      <View style={styles.iconContainer}>
        <InfoIcon color={Colors.onboardingBlue} />
      </View>
      <Text style={styles.text}>{t('noTokenInResult', { searchQuery })}</Text>
    </View>
  )

  return (
    <BottomSheet
      isVisible={isVisible}
      onBackgroundPress={onCloseBottomSheet}
      stickyHeader={searchEnabled ? stickyHeader : title}
      fullHeight={searchEnabled}
    >
      <View>
        {tokenList.length == 0
          ? noTokensComponent
          : tokenList.map((tokenInfo, index) => {
              return (
                <React.Fragment key={`token-${tokenInfo.address}`}>
                  {index > 0 && <View style={styles.separator} />}
                  <TokenOption tokenInfo={tokenInfo} onPress={onTokenPressed(tokenInfo.address)} />
                </React.Fragment>
              )
            })}
      </View>
    </BottomSheet>
  )
}

TokenBottomSheet.navigationOptions = {}

const styles = StyleSheet.create({
  title: {
    ...fontStyles.h2,
  },
  tokenOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  tokenImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
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
    marginBottom: Spacing.Thick24,
  },
  iconContainer: {
    flex: 1,
  },
  searchedText: {
    color: Colors.dark,
    fontWeight: 'bold',
  },
  text: {
    ...fontStyles.regular500,
    flex: 10,
    textAlignVertical: 'center',
  },
  viewContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.Thick24,
    marginHorizontal: Spacing.Thick24,
    marginTop: Spacing.Large32,
  },
  stickyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: Spacing.Smallest8,
  },
})

export default TokenBottomSheet
