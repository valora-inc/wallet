import Button from '@celo/react-components/components/Button'
import Card from '@celo/react-components/components/Card'
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
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { openUrl } from 'src/app/actions'
import { dappsListApiUrlSelector } from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import BottomSheet from 'src/components/BottomSheet'
import Dialog from 'src/components/Dialog'
import CustomHeader from 'src/components/header/CustomHeader'
import DappsExplorerLogo from 'src/icons/DappsExplorerLogo'
import LinkArrow from 'src/icons/LinkArrow'
import Help from 'src/icons/navigator/Help'
import QuitIcon from 'src/icons/QuitIcon'
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
}

interface DappProps {
  dapp: Dapp
  onPressDapp: (dapp: Dapp) => void
}

interface SectionData {
  data: Dapp[]
  category: CategoryWithDapps
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
    result: CategoryWithDapps[] | undefined
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
          categoriesById[app.categoryId].dapps.push({
            id: app.id,
            categoryId: app.categoryId,
            name: app.name,
            iconUrl: app.logoUrl,
            description: app.description,
            dappUrl: app.url.replace('{{address}}', address ?? ''),
          })
        })

        return Object.values(categoriesById)
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

  const onPressNavigationButton = () => {
    if (!dappSelected) {
      // Should never happen
      Logger.error(TAG, 'Internal error. There was no dapp selected')
      return
    }
    dispatch(openUrl(dappSelected.dappUrl, true, true))
    setBottomSheetVisible(false)
  }

  const onPressDapp = (dapp: Dapp) => {
    if (!isDeepLink(dapp.dappUrl)) {
      setDappSelected(dapp)
      setBottomSheetVisible(true)
    } else {
      dispatch(openUrl(dapp.dappUrl, true, true))
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
            />
          </View>
        </View>
      </BottomSheet>

      <Dialog
        title={t('dappsScreenHelpDialog.title')}
        isVisible={isHelpDialogVisible}
        secondaryActionText={t('dappsScreenHelpDialog.dismiss')}
        secondaryActionPress={() => setHelpDialogVisible(false)}
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
            ListHeaderComponent={<DescriptionView message={t('dappsScreen.message')} />}
            style={styles.sectionList}
            sections={parseResultIntoSections(result)}
            renderItem={({ item: category }) => <Dapp dapp={category} onPressDapp={onPressDapp} />}
            keyExtractor={(item: Dapp) => `${item.categoryId}-${item.id}`}
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
        <DappsExplorerLogo />
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

function Dapp({ dapp, onPressDapp }: DappProps) {
  const onPress = () => onPressDapp(dapp)

  return (
    <Card style={styles.card} rounded={true} shadow={Shadow.Soft}>
      <TouchableOpacity style={styles.pressableCard} onPress={onPress}>
        <Image source={{ uri: dapp.iconUrl }} style={styles.dappIcon} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemTitleText}>{dapp.name}</Text>
          <Text style={styles.itemSubtitleText}>{dapp.description}</Text>
        </View>
        <LinkArrow style={styles.linkArrow} />
      </TouchableOpacity>
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
  descriptionText: {
    ...fontStyles.h1,
    flex: 1,
  },
  linkArrow: {
    height: 20,
    width: 20,
    marginLeft: Spacing.Regular16,
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
})

export default DAppsExplorerScreen
