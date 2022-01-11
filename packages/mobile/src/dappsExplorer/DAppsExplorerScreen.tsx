import Card from '@celo/react-components/components/Card'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Shadow } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { dappsListApiUrlSelector } from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'
import { background } from 'src/images/Images'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import Logger from 'src/utils/Logger'

const TAG = 'DAppExplorerScreen'

interface CategoryWithItems {
  id: string
  name: string
  fontColor: string
  backgroundColor: string
  items: DappItem[]
}

interface DappItem {
  id: string
  iconUrl: string
  name: string
  description: string
  dappUrl: string
}

type Props = StackScreenProps<StackParamList, Screens.DAppsExplorerScreen>
export function DAppsExplorerScreen({ navigation }: Props) {
  const { t } = useTranslation()
  const dappsListUrl = useSelector(dappsListApiUrlSelector)
  const [categoriesWithItems, setcategoriesWithItems] = useState<CategoryWithItems[]>([])

  if (!dappsListUrl) {
    return (
      <View style={styles.centerContainer} testID="DAppExplorerScreen/error">
        <Text style={styles.text}> Configuration error. </Text>
        <Text style={styles.text}> dappsListUrl is not set. </Text>
      </View>
    )
  }

  const { loading, error, result } = useAsync(
    async () => {
      const response = await fetch(dappsListUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      return response.json()
    },
    [],
    {
      onSuccess: (result) => {
        Logger.debug(TAG, `fetch onSuccess: ${JSON.stringify(result)}`)
        try {
          const categoriesById: { [id: string]: CategoryWithItems } = {}
          result.categories.forEach((cat: any) => {
            categoriesById[cat.id] = {
              id: cat.id,
              name: cat.name,
              fontColor: cat.fontColor,
              backgroundColor: cat.backgroundColor,
              items: [],
            }
          })
          result.applications.forEach((app: any) => {
            categoriesById[app.categoryId].items.push({
              id: app.id,
              name: app.name,
              iconUrl: app.logoUrl,
              description: app.description,
              dappUrl: app.url,
            })
          })
          setcategoriesWithItems(Object.values(categoriesById))
        } catch (e) {
          Logger.error(TAG, "Couldn't parse response", e as Error)
        }
      },
    }
  )

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          style={styles.loadingIcon}
          size="large"
          color={colors.greenBrand}
          testID="DAppExplorerScreen/loading"
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader
        left={<BackButton />}
        title={t('dappExplorerTitle')}
        // TODO: Add question mark with modal right={}
      />
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{t('dappScreenDescription')}</Text>
          {/* TODO: Change image */}
          <Image source={background} style={styles.descriptionImage} />
        </View>
        <>{categoriesWithItems.map(renderCategoryWithItems)}</>
      </ScrollView>
    </SafeAreaView>
  )
}

function renderCategoryWithItems(categoryWithItems: CategoryWithItems) {
  Logger.debug(TAG, `Render category ${JSON.stringify(categoryWithItems)}`)

  const textStyle = {
    ...styles.categoryText,
    color: categoryWithItems.fontColor,
    backgroundColor: categoryWithItems.backgroundColor,
  }
  return (
    <View style={styles.categoryContainer} key={`category-${categoryWithItems.id}`}>
      <Text style={textStyle}> {categoryWithItems.name} </Text>
      <>{categoryWithItems.items.map(renderItem)}</>
    </View>
  )
}

function renderItem(item: DappItem) {
  Logger.debug(TAG, `Render item ${JSON.stringify(item)}`)

  return (
    <Card style={styles.itemCard} rounded={true} shadow={Shadow.Soft} key={`item-${item.id}`}>
      <Image source={{ uri: item.iconUrl }} style={styles.dappIcon} />
      <View style={styles.itemTextContainer}>
        <Text style={styles.titleText}>{item.name}</Text>
        <Text style={styles.subtitleText}>{item.description}</Text>
      </View>
      <Image source={require('src/images/link-arrow.png')} style={styles.linkArrow} />
    </Card>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    flexDirection: 'column',
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
    marginVertical: 16,
    paddingHorizontal: variables.contentPadding,
  },
  itemTextContainer: {
    flex: 1,
  },
  descriptionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    paddingHorizontal: variables.contentPadding,
  },
  loadingIcon: {
    marginVertical: 20,
    height: 108,
    width: 108,
  },
  dappIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 16,
  },
  itemCard: {
    marginTop: 16,
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  descriptionText: {
    ...fontStyles.h1,
    flex: 1,
  },
  categoryText: {
    ...fontStyles.regular,
    fontSize: 12.5,
    borderRadius: 100,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  titleText: {
    ...fontStyles.small,
    fontWeight: '500',
    color: '#2E3338',
  },
  subtitleText: {
    ...fontStyles.small,
    fontWeight: '400',
    color: '#81868B',
  },
  text: {
    ...fontStyles.large,
    color: colors.gray3,
  },
  linkArrow: {
    height: 20,
    width: 20,
    marginLeft: 16,
  },
  descriptionImage: {
    height: 122,
    width: 98,
    marginLeft: 16,
  },
})

export default DAppsExplorerScreen
