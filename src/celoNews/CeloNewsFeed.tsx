import React, { useEffect, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, StyleSheet, Text, View } from 'react-native'
import { CeloNewsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { celoNewsConfigSelector } from 'src/app/selectors'
import CeloNewsFeedItem from 'src/celoNews/CeloNewsFeedItem'
import { CeloNewsArticle, CeloNewsArticles } from 'src/celoNews/types'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import EmptyView from 'src/components/EmptyView'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'exchange/CeloNewsFeed'

const LOADING_SKELETON_DATA = Array.from({ length: 5 }).map(
  // This bypasses the type check, but it's fine because we're just using it for the skeleton
  (_, i) => ({ id: i }) as CeloNewsArticle
)

function renderItem({ item: article }: ListRenderItemInfo<CeloNewsArticle>) {
  return <CeloNewsFeedItem article={article} />
}

function keyExtractor(item: CeloNewsArticle) {
  return item.id.toString()
}

function ItemSeparator() {
  return <View style={styles.separator} />
}

export function useFetchArticles() {
  return useAsync(async () => {
    Logger.info(TAG, 'Fetching articles...')
    try {
      const response = await fetchWithTimeout(`${networkConfig.cloudFunctionsUrl}/getCeloNewsFeed`)
      Logger.info(TAG, `Articles fetched (statusCode=${response.status})`)
      // status in the range 200-299
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      return data as CeloNewsArticles
    } catch (error) {
      Logger.error(TAG, 'Failed to fetch articles', error)
      throw error
    }
  }, [])
}

export default function CeloNewsFeed() {
  const { t } = useTranslation()

  const asyncArticles = useFetchArticles()
  const { readMoreUrl } = useSelector(celoNewsConfigSelector)
  const isLoading = asyncArticles.status === 'loading'

  useEffect(() => {
    ValoraAnalytics.track(CeloNewsEvents.celo_news_screen_open)
  }, [])

  function onPressReadMore() {
    const url = readMoreUrl
    if (!url) {
      // This shouldn't happen since the button is only visible if the URL is set
      return
    }
    ValoraAnalytics.track(CeloNewsEvents.celo_news_bottom_read_more_tap, { url })
    navigate(Screens.WebViewScreen, { uri: url })
  }

  function onPressRetry() {
    ValoraAnalytics.track(CeloNewsEvents.celo_news_retry_tap)
    void asyncArticles.execute()
  }

  const footer = useMemo(() => {
    switch (asyncArticles.status) {
      case 'success':
        if (!readMoreUrl) {
          return null
        }

        return (
          <>
            <ItemSeparator />
            <Button
              onPress={onPressReadMore}
              text={t('celoNews.readMoreButtonText')}
              size={BtnSizes.FULL}
              type={BtnTypes.SECONDARY}
              style={styles.readMoreButton}
            />
          </>
        )
      case 'error':
        return (
          <EmptyView text={t('celoNews.loadingError')}>
            <Button
              onPress={onPressRetry}
              text={t('celoNews.retryButtonText')}
              size={BtnSizes.FULL}
              type={BtnTypes.SECONDARY}
            />
          </EmptyView>
        )
    }
  }, [asyncArticles.status, readMoreUrl])

  return (
    <FlatList
      data={isLoading ? LOADING_SKELETON_DATA : asyncArticles.result?.articles}
      renderItem={isLoading ? CeloNewsFeedItem.Skeleton : renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparator}
      ListHeaderComponent={
        asyncArticles.status !== 'error' ? (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('celoNews.headerTitle')}</Text>
            <Text style={styles.headerDescription}>{t('celoNews.headerDescription')}</Text>
          </View>
        ) : undefined
      }
      ListFooterComponent={footer}
    />
  )
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: colors.gray2,
  },
  header: {
    marginVertical: Spacing.Regular16,
    marginHorizontal: Spacing.Thick24,
  },
  headerTitle: {
    ...typeScale.labelMedium,
  },
  headerDescription: {
    ...typeScale.bodySmall,
    color: colors.gray5,
    marginTop: Spacing.Smallest8,
  },
  readMoreButton: {
    marginVertical: 32,
    marginHorizontal: Spacing.Thick24,
  },
})
