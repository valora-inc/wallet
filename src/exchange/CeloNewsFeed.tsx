import React, { useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { CeloNewsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import EmptyView from 'src/components/EmptyView'
import CeloNewsFeedItem from 'src/exchange/CeloNewsFeedItem'
import { CeloNewsArticle, CeloNewsArticles } from 'src/exchange/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'exchange/CeloNewsFeed'

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
        throw new Error('Failed to fetch articles')
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

  function onPressReadMore() {
    // TODO: use a remote config for this URL
    const url = 'https://blog.celo.org'
    ValoraAnalytics.track(CeloNewsEvents.celo_news_bottom_read_more_tap, { url })
    navigate(Screens.WebViewScreen, { uri: url })
  }

  function onPressRetry() {
    ValoraAnalytics.track(CeloNewsEvents.celo_news_retry_tap)
    void asyncArticles.execute()
  }

  const footer = useMemo(() => {
    switch (asyncArticles.status) {
      case 'loading':
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.goldUI} testID="CeloNewsFeed/loading" />
          </View>
        )
      case 'success':
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
  }, [asyncArticles.status])

  return (
    <FlatList
      data={asyncArticles.result?.articles || []}
      renderItem={renderItem}
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
    ...fontStyles.h2,
  },
  headerDescription: {
    ...fontStyles.small,
    color: colors.gray5,
    marginTop: Spacing.Smallest8,
  },
  readMoreButton: {
    marginVertical: 32,
    marginHorizontal: Spacing.Thick24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
})
