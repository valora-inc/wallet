import Button from '@celo/react-components/components/Button'
import Card from '@celo/react-components/components/Card'
import Touchable from '@celo/react-components/components/Touchable'
import colors, { Colors } from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Shadow, Spacing } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import React, { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Image,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { openUrl } from 'src/app/actions'
import { dappsListApiUrlSelector } from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import BottomSheet from 'src/components/BottomSheet'
import Dialog from 'src/components/Dialog'
import CustomHeader from 'src/components/header/CustomHeader'
import LinkArrow from 'src/icons/LinkArrow'
import Help from 'src/icons/navigator/Help'
import QuitIcon from 'src/icons/QuitIcon'
import { dappListLogo } from 'src/images/Images'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { isDeepLink } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'DAppExplorerScreen'

const SECTION_HEADER_MARGIN_TOP = 32

interface CategoryWithDapps {
  id: string
  name: string
  fontColor: string
  backgroundColor: string
  dapps: Dapp[]
}

interface Dapp {
  id: string
  categoryId: string
  iconUrl: string
  name: string
  description: string
  dappUrl: string
  isFeatured: boolean
}

interface DappProps {
  dapp: Dapp
  onPressDapp: (dapp: Dapp) => void
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
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false)
  const [dappSelected, setDappSelected] = useState<Dapp>()
  const dispatch = useDispatch()

  const shortLanguage = i18n.language.split('-')[0]

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

  const onCloseBottomSheet = () => {
    setBottomSheetVisible(false)
  }

  const onPressHelp = () => {
    setHelpDialogVisible(true)
  }

  const onCloseDialog = () => {
    setHelpDialogVisible(false)
  }

  const openDapp = (dapp: Dapp) => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_open, {
      categoryId: dapp.categoryId,
      dappId: dapp.id,
      dappName: dapp.name,
      section: dapp.isFeatured ? 'featured' : 'all',
      horizontalPosition: 0,
    })
    dispatch(openUrl(dapp.dappUrl, true, true))
  }

  const onPressNavigationButton = () => {
    if (!dappSelected) {
      // Should never happen
      Logger.error(TAG, 'Internal error. There was no dapp selected')
      return
    }
    openDapp(dappSelected)
    setBottomSheetVisible(false)
  }

  const onPressDapp = (dapp: Dapp) => {
    if (!isDeepLink(dapp.dappUrl)) {
      setDappSelected(dapp)
      setBottomSheetVisible(true)
    } else {
      openDapp(dapp)
    }
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader
        left={<BackButton />}
        title={t('dappsScreen.title')}
        right={
          <TopBarIconButton
            icon={<Help />}
            onPress={onPressHelp}
            style={styles.helpIconContainer}
          />
        }
      />
      <BottomSheet isVisible={isBottomSheetVisible} onBackgroundPress={onCloseBottomSheet}>
        <View>
          <TopBarIconButton
            icon={<QuitIcon />}
            style={styles.bottomSheetCloseButton}
            onPress={onCloseBottomSheet}
          />
          <View style={styles.centerContainer}>
            <Text style={styles.bottomSheetTitleText}>
              {t('dappsScreenBottomSheet.title', { dappName: dappSelected?.name })}
            </Text>
            <Text style={styles.bottomSheetMessageText}>{t('dappsScreenBottomSheet.message')}</Text>
            <Button
              style={styles.bottomSheetButton}
              onPress={onPressNavigationButton}
              text={t('dappsScreenBottomSheet.button', { dappName: dappSelected?.name })}
              testID="ConfirmDappButton"
            />
          </View>
        </View>
      </BottomSheet>

      <Dialog
        title={t('dappsScreenHelpDialog.title')}
        isVisible={isHelpDialogVisible}
        secondaryActionText={t('dappsScreenHelpDialog.dismiss')}
        secondaryActionPress={onCloseDialog}
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
          <SectionList
            ListHeaderComponent={
              <>
                <DescriptionView message={t('dappsScreen.message')} />
                {result.featured && (
                  <>
                    <Text style={styles.sectionTitle}>{t('dappsScreen.featuredDapp')}</Text>
                    <FeaturedDapp dapp={result.featured} onPressDapp={onPressDapp} />
                    <Text style={styles.sectionTitle}>{t('dappsScreen.allDapps')}</Text>
                  </>
                )}
              </>
            }
            style={styles.sectionList}
            sections={parseResultIntoSections(result.categories)}
            renderItem={({ item: dapp }) => <Dapp dapp={dapp} onPressDapp={onPressDapp} />}
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
  const onPress = () => onPressDapp(dapp)

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

function Dapp({ dapp, onPressDapp }: DappProps) {
  const onPress = () => onPressDapp(dapp)

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
  helpIconContainer: {
    padding: variables.contentPadding,
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
  categoryTextContainer: {
    borderRadius: 100,
  },
  // Padding values honor figma designs
  categoryText: {
    ...fontStyles.regular,
    fontSize: 12.5,
    borderRadius: 100,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  bottomSheetTitleText: {
    ...fontStyles.h2,
    textAlign: 'center',
    paddingVertical: Spacing.Regular16,
  },
  bottomSheetMessageText: {
    ...fontStyles.regular,
    textAlign: 'center',
    flex: 1,
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
  bottomSheetCloseButton: {
    alignSelf: 'flex-end',
  },
  bottomSheetButton: {
    marginVertical: Spacing.Regular16,
  },
  sectionList: {
    flex: 1,
    padding: Spacing.Regular16,
  },
  sectionTitle: {
    ...fontStyles.label,
    color: colors.gray4,
    marginTop: 32,
  },
})

export default DAppsExplorerScreen
