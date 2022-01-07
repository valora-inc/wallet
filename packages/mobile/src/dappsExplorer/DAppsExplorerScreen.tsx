import Card from '@celo/react-components/components/Card'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Shadow } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { dappsListApiUrlSelector } from 'src/app/selectors'
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
    <ScrollView style={styles.scrollContainer}>
      {categoriesWithItems.map(renderCategoryWithItems)}
    </ScrollView>
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
    <Card style={styles.itemCard} rounded={true} shadow={Shadow.Soft}>
      <Image source={{ uri: item.iconUrl }} style={styles.dappIcon} />
      <View style={styles.itemTextContainer}>
        <Text style={styles.titleText}>{item.name}</Text>
        <Text style={styles.subtitleText}>{item.description}</Text>
      </View>
      <Image source={require('src/images/link-arrow.png')} style={styles.linkArrow} />
    </Card>
  )
  // return (<Text style={styles.text} key={`item-${item.id}`}>{item.name}</Text>)
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: variables.contentPadding,
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
    marginTop: 32,
  },
  itemTextContainer: {
    flex: 1,
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
})

export default DAppsExplorerScreen
