import React, { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-simple-toast'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Touchable from 'src/components/Touchable'
import { mostPopularDappsSelector } from 'src/dapps/selectors'
import { ActiveDapp, Dapp, DappSection } from 'src/dapps/types'
import { DappCardContent } from 'src/dappsExplorer/DappCard'
import { useSelector } from 'src/redux/hooks'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

export function DappRankingsBottomSheet({
  forwardedRef,
  onPressDapp,
}: {
  forwardedRef: RefObject<BottomSheetRefType>
  onPressDapp: (dapp: ActiveDapp, index: number) => void
}) {
  const { t } = useTranslation()
  const mostPopularDapps = useSelector(mostPopularDappsSelector)

  const handleFavoriteDapp = (dapp: Dapp) => () => {
    Toast.showWithGravity(
      t('dappsScreen.favoritedDappToast.messageWithDappName', { dappName: dapp.name }),
      Toast.SHORT,
      Toast.BOTTOM
    )
  }

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={t('dappRankings.title')}
      description={t('dappRankings.description')}
      testId="DappRankingsBottomSheet"
    >
      {mostPopularDapps.map((dapp, index) => (
        <View
          key={dapp.name}
          style={[
            styles.popularDappCard,
            {
              borderBottomWidth: index < mostPopularDapps.length - 1 ? 1 : 0,
            },
          ]}
          testID="PopularDappCard"
        >
          <Touchable
            style={styles.popularDappCardContentContainer}
            onPress={() => onPressDapp({ ...dapp, openedFrom: DappSection.MostPopular }, index)}
            testID={`Dapp/${dapp.id}`}
          >
            <>
              <Text style={styles.ranking}>{index + 1}</Text>
              <DappCardContent
                dapp={dapp}
                onFavoriteDapp={handleFavoriteDapp(dapp)}
                favoritedFromSection={DappSection.MostPopular}
              />
            </>
          </Touchable>
        </View>
      ))}
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  ranking: {
    ...fontStyles.xsmall,
    color: Colors.gray4,
  },
  popularDappCard: {
    borderBottomColor: Colors.gray2,
    borderBottomWidth: 1,
  },
  popularDappCardContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
