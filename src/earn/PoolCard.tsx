import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Button, { BtnSizes, BtnTypes, TextSizes } from 'src/components/Button'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon from 'src/components/TokenIcon'
import { Pool } from 'src/earn/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'

export default function PoolCard({ pool, testID = 'PoolCard' }: { pool: Pool; testID?: string }) {
  const { tokens, networkId, poolTokenId, depositTokenId } = pool
  const { t } = useTranslation()
  const allTokens = useSelector((state) => tokensByIdSelector(state, [networkId]))
  const tokensInfo = useMemo(() => {
    return tokens
      .map((tokenId) => allTokens[tokenId])
      .filter((token): token is TokenBalance => !!token)
  }, [pool.tokens, allTokens])
  const poolTokenInfo = allTokens[poolTokenId]
  const depositTokenInfo = allTokens[depositTokenId]
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.titleRow}>
        {tokensInfo.map((token, index) => (
          <TokenIcon
            key={index}
            token={token}
            viewStyle={index > 0 ? { marginLeft: -8, zIndex: -index } : {}}
          />
        ))}
        <View style={styles.titleTextContainer}>
          <Text style={styles.titleTokens}>
            {tokensInfo.map((token) => token.symbol).join(' / ')}
          </Text>
          <Text style={styles.titleNetwork}>
            {t('earnFlow.poolCard.onNetwork', { networkName: NETWORK_NAMES[networkId] })}
          </Text>
        </View>
      </View>
      <View style={styles.keyValueContainer}>
        <View style={styles.keyValueRow}>
          <Text style={styles.keyText}>{t('earnFlow.poolCard.rate')}</Text>
          <Text style={styles.valueTextBold}>
            {t('earnFlow.poolCard.apy', {
              apy: new BigNumber(pool.apy).multipliedBy(100).toFixed(2),
            })}
          </Text>
        </View>
        <View style={styles.keyValueRow}>
          <Text style={styles.keyText}>{t('earnFlow.poolCard.reward')}</Text>
          <Text
            style={styles.valueText}
          >{`${new BigNumber(pool.reward).multipliedBy(100).toFixed(2)}%`}</Text>
        </View>
        <View style={styles.keyValueRow}>
          <Text style={styles.keyText}>{t('earnFlow.poolCard.tvl')}</Text>
          <Text style={styles.valueText}>{`$${new BigNumber(pool.tvl).toFormat()}`}</Text>
        </View>
      </View>
      {poolTokenInfo?.balance.gt(0) && !!depositTokenInfo ? (
        <View style={styles.withBalanceContainer}>
          <View style={styles.keyValueContainer}>
            <View style={styles.keyValueRow}>
              <Text style={styles.keyText}>{t('earnFlow.poolCard.deposited')}</Text>
              <Text>
                {`(`}
                <TokenDisplay
                  amount={poolTokenInfo.balance}
                  tokenId={depositTokenId}
                  showLocalAmount={false}
                  style={styles.valueText}
                ></TokenDisplay>
                {`) `}
                <TokenDisplay
                  amount={poolTokenInfo.balance}
                  tokenId={poolTokenId}
                  showLocalAmount={true}
                  style={styles.valueTextBold}
                ></TokenDisplay>
              </Text>
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <Button
              onPress={() => {
                navigate(Screens.EarnCollectScreen, { depositTokenId, poolTokenId })
              }}
              text={t('earnFlow.poolCard.exitPool')}
              type={BtnTypes.TERTIARY}
              textSize={TextSizes.SMALL}
              size={BtnSizes.FULL}
              style={styles.button}
            />
            <Button
              onPress={() => {
                navigate(Screens.EarnEnterAmount, { tokenId: depositTokenId })
              }}
              text={t('earnFlow.poolCard.addToPool')}
              type={BtnTypes.SECONDARY}
              textSize={TextSizes.SMALL}
              size={BtnSizes.FULL}
              style={styles.button}
            />
          </View>
        </View>
      ) : (
        <Button
          onPress={() => {
            navigate(Screens.EarnEnterAmount, { tokenId: depositTokenId })
          }}
          text={t('earnFlow.poolCard.addToPool')}
          type={BtnTypes.SECONDARY}
          textSize={TextSizes.SMALL}
          size={BtnSizes.FULL}
        />
      )}
      <Text style={styles.poweredByText}>
        {t('earnFlow.poolCard.poweredBy', { providerName: pool.provider })}
      </Text>
    </View>
  )
}
const styles = StyleSheet.create({
  card: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.Thick24,
    gap: Spacing.Thick24,
  },
  titleRow: {
    flexDirection: 'row',
  },
  titleTextContainer: {
    marginLeft: Spacing.Smallest8,
  },
  titleTokens: {
    color: Colors.black,
    ...typeScale.labelXSmall,
  },
  titleNetwork: {
    color: Colors.gray4,
    ...typeScale.bodyXSmall,
  },
  keyValueContainer: {
    gap: Spacing.Smallest8,
  },
  keyValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyText: {
    color: Colors.gray4,
    ...typeScale.bodySmall,
  },
  valueText: {
    color: Colors.black,
    ...typeScale.bodySmall,
  },
  valueTextBold: {
    color: Colors.black,
    ...typeScale.labelSemiBoldLarge,
    lineHeight: 20,
  },
  poweredByText: {
    color: Colors.gray4,
    ...typeScale.bodyXSmall,
    alignSelf: 'center',
  },
  withBalanceContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray2,
    paddingTop: Spacing.Thick24,
  },
  buttonContainer: {
    paddingTop: Spacing.Thick24,
    flexDirection: 'row',
    gap: Spacing.Smallest8,
  },
  button: {
    flexGrow: 1,
    flexBasis: 0,
  },
})
