import React, { useEffect, useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Image,
  SectionList,
  SectionListData,
  SectionListProps,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ActiveDapp, DappSection } from 'src/app/reducers'
import { dappsListApiUrlSelector } from 'src/app/selectors'
import { Dapp } from 'src/app/types'
import Card from 'src/components/Card'
import Dialog from 'src/components/Dialog'
import Touchable from 'src/components/Touchable'
import useOpenDapp from 'src/dappsExplorer/useOpenDapp'
import LinkArrow from 'src/icons/LinkArrow'
import Help from 'src/icons/navigator/Help'
import { dappListLogo } from 'src/images/Images'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { styles as headerStyles } from 'src/navigator/Headers'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Shadow, Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

// @ts-ignore
const AnimatedSectionList = Animated.createAnimatedComponent<SectionListProps<ItemT, SectionT>>(
  SectionList
)

const TAG = 'DAppExplorerScreen'

const SECTION_HEADER_MARGIN_TOP = 32

interface CategoryWithDapps {
  id: string
  name: string
  fontColor: string
  backgroundColor: string
  dapps: Dapp[]
}

interface DappProps {
  dapp: Dapp
  onPressDapp: (dapp: ActiveDapp) => void
}

interface SectionData {
  data: Dapp[]
  category: CategoryWithDapps
}

function mapDappFields(dapp: any, address: string, isFeatured: boolean): Dapp {
  return {
    id: dapp.id,
    categoryId: dapp.categoryId,
    name: dapp.name,
    iconUrl: dapp.logoUrl,
    description: dapp.description,
    dappUrl: dapp.url.replace('{{address}}', address ?? ''),
    isFeatured,
  }
}

export function DAppsExplorerScreen() {
  const { t, i18n } = useTranslation()
  const dappsListUrl = useSelector(dappsListApiUrlSelector)
  const address = useSelector(walletAddressSelector)
  const [isHelpDialogVisible, setHelpDialogVisible] = useState(false)
  const insets = useSafeAreaInsets()
  const scrollPosition = useRef(new Animated.Value(0)).current
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollPosition } } }])

  const { onSelectDapp, ConfirmOpenDappBottomSheet } = useOpenDapp()

  const shortLanguage = i18n.language.split('-')[0]

  useEffect(() => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_screen_open)
  }, [])

  const {
    loading,
    error,
    result,
  }: {
    loading: boolean
    error: Error | undefined
    result: { categories: CategoryWithDapps[]; featured: Dapp | undefined } | undefined
  } = useAsync(
    async () => {
      if (!dappsListUrl) {
        throw new Error('Dapps list url is not defined')
      }

      const response = await fetch(`${dappsListUrl}?language=${shortLanguage}&address=${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      const result = await response.json()
      try {
        const categoriesById: { [id: string]: CategoryWithDapps } = {}
        result.categories.forEach((cat: any) => {
          categoriesById[cat.id] = {
            id: cat.id,
            name: cat.name,
            fontColor: cat.fontColor,
            backgroundColor: cat.backgroundColor,
            dapps: [],
          }
        })
        result.applications.forEach((app: any) => {
          categoriesById[app.categoryId].dapps.push(mapDappFields(app, address ?? '', false))
        })

        const featured = result.featured
          ? mapDappFields(result.featured, address ?? '', true)
          : undefined
        if (featured) {
          ValoraAnalytics.track(DappExplorerEvents.dapp_impression, {
            categoryId: featured.categoryId,
            dappId: featured.id,
            dappName: featured.name,
            section: DappSection.Featured,
          })
        }

        return {
          categories: Object.values(categoriesById),
          featured,
        }
      } catch (error) {
        Logger.error(
          TAG,
          `There was an error while parsing response: ${JSON.stringify(result)}`,
          error as Error
        )
        throw Error(`There was an error while parsing response: ${(error as Error)?.message}`)
      }
    },
    [shortLanguage],
    {
      onSuccess: (result) => {
        Logger.debug(TAG, `fetch onSuccess: ${JSON.stringify(result)}`)
      },
      onError: (error) => {
        Logger.error(TAG, 'fetch onError', error as Error)
      },
    }
  )

  const onPressHelp = () => {
    setHelpDialogVisible(true)
  }

  const onCloseDialog = () => {
    setHelpDialogVisible(false)
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
      <DrawerTopBar
        middleElement={<Text style={headerStyles.headerTitle}>{t('dappsScreen.title')}</Text>}
        rightElement={<TopBarIconButton icon={<Help />} onPress={onPressHelp} />}
        scrollPosition={scrollPosition}
      />
      {ConfirmOpenDappBottomSheet}

      <Dialog
        title={t('dappsScreenHelpDialog.title')}
        isVisible={isHelpDialogVisible}
        actionText={t('dappsScreenHelpDialog.dismiss')}
        actionPress={onCloseDialog}
        isActionHighlighted={false}
        onBackgroundPress={onCloseDialog}
      >
        {t('dappsScreenHelpDialog.message')}
      </Dialog>
      <>
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator
              style={styles.loadingIcon}
              size="large"
              color={colors.greenBrand}
              testID="DAppExplorerScreen/loading"
            />
          </View>
        )}
        {!loading && error && (
          <View style={styles.centerContainer}>
            <Text style={fontStyles.regular}>{t('dappsScreen.errorMessage')}</Text>
          </View>
        )}
        {!loading && !error && result && (
          <AnimatedSectionList
            ListHeaderComponent={
              <>
                <DescriptionView message={t('dappsScreen.message')} />
                {result.featured && (
                  <>
                    <Text style={styles.sectionTitle}>{t('dappsScreen.featuredDapp')}</Text>
                    <FeaturedDapp dapp={result.featured} onPressDapp={onSelectDapp} />
                    <Text style={styles.sectionTitle}>{t('dappsScreen.allDapps')}</Text>
                  </>
                )}
              </>
            }
            style={styles.sectionList}
            contentContainerStyle={{
              padding: Spacing.Regular16,
              paddingBottom: Math.max(insets.bottom, Spacing.Regular16),
            }}
            // Workaround iOS setting an incorrect automatic inset at the top
            scrollIndicatorInsets={{ top: 0.01 }}
            scrollEventThrottle={16}
            onScroll={onScroll}
            sections={parseResultIntoSections(result.categories)}
            renderItem={({ item: dapp }) => <DappCard dapp={dapp} onPressDapp={onSelectDapp} />}
            keyExtractor={(dapp: Dapp) => `${dapp.categoryId}-${dapp.id}`}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }: { section: SectionListData<any, SectionData> }) => (
              <CategoryHeader category={section.category} />
            )}
          />
        )}
      </>
    </SafeAreaView>
  )
}

function parseResultIntoSections(categoriesWithDapps: CategoryWithDapps[]): SectionData[] {
  return categoriesWithDapps.map((category) => ({
    data: category.dapps,
    category: category,
  }))
}

function DescriptionView({ message }: { message: string }) {
  return (
    <View style={styles.descriptionContainer}>
      <Text style={styles.descriptionText}>{message}</Text>
      <View style={styles.descriptionImage}>
        <Image source={dappListLogo} resizeMode="contain" />
      </View>
    </View>
  )
}

function CategoryHeader({ category }: { category: CategoryWithDapps }) {
  return (
    <View style={styles.categoryContainer}>
      <View style={[styles.categoryTextContainer, { backgroundColor: category.backgroundColor }]}>
        <Text style={[styles.categoryText, { color: category.fontColor }]}>{category.name}</Text>
      </View>
    </View>
  )
}

function FeaturedDapp({ dapp, onPressDapp }: DappProps) {
  const onPress = () => onPressDapp({ ...dapp, openedFrom: DappSection.Featured })

  return (
    <Card style={styles.card} rounded={true} shadow={Shadow.SoftLight}>
      <Touchable style={styles.pressableCard} onPress={onPress} testID="FeaturedDapp">
        <>
          <View style={styles.itemTextContainer}>
            <Text style={styles.featuredDappTitle}>{dapp.name}</Text>
            <Text style={styles.featuredDappSubtitle}>{dapp.description}</Text>
          </View>
          <Image source={{ uri: dapp.iconUrl }} style={styles.featuredDappIcon} />
        </>
      </Touchable>
    </Card>
  )
}

function DappCard({ dapp, onPressDapp }: DappProps) {
  const onPress = () => onPressDapp({ ...dapp, openedFrom: DappSection.All })

  return (
    <Card style={styles.card} rounded={true} shadow={Shadow.SoftLight}>
      <Touchable style={styles.pressableCard} onPress={onPress} testID={`Dapp/${dapp.id}`}>
        <>
          <Image source={{ uri: dapp.iconUrl }} style={styles.dappIcon} />
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemTitleText}>{dapp.name}</Text>
            <Text style={styles.itemSubtitleText}>{dapp.description}</Text>
          </View>
          <LinkArrow size={24} />
        </>
      </Touchable>
    </Card>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  categoryContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'column',
    marginTop: SECTION_HEADER_MARGIN_TOP,
  },
  itemTextContainer: {
    flex: 1,
    marginRight: Spacing.Regular16,
  },
  descriptionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    marginHorizontal: Spacing.Smallest8,
  },
  loadingIcon: {
    marginVertical: Spacing.Thick24,
    height: 108,
    width: 108,
  },
  dappIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: Spacing.Regular16,
  },
  featuredDappIcon: {
    width: 106,
    height: 106,
    borderRadius: 53,
    marginLeft: Spacing.Small12,
  },
  pressableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  card: {
    marginTop: Spacing.Regular16,
    flex: 1,
    alignItems: 'center',
  },
  // Padding values honor figma designs
  categoryTextContainer: {
    borderRadius: 100,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  categoryText: {
    ...fontStyles.sectionHeader,
    fontSize: 13,
  },
  itemTitleText: {
    ...fontStyles.small,
    color: Colors.dark,
  },
  itemSubtitleText: {
    ...fontStyles.small,
    color: Colors.gray5,
  },
  featuredDappTitle: {
    ...fontStyles.regular600,
    marginBottom: 5,
  },
  featuredDappSubtitle: {
    ...fontStyles.small,
    color: Colors.gray4,
  },
  descriptionText: {
    ...fontStyles.h1,
    flex: 1,
  },
  descriptionImage: {
    height: 106,
    width: 94,
    marginLeft: Spacing.Smallest8,
  },
  sectionList: {
    flex: 1,
  },
  sectionTitle: {
    ...fontStyles.label,
    color: colors.gray4,
    marginTop: 32,
  },
})

export default DAppsExplorerScreen
