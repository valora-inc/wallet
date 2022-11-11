import React, { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { useDispatch } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import NewsFeedItem from 'src/exchange/NewsFeedItem'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'

const TAG = 'NewsFeed'

interface NewsItem {
  author: string
  title: string
  url: string
  id: string
  createdAt: string
  formattedDescription: string
  imgUrl?: string | null
}

// Getting rid of the regex might be worth not having images.
const imgUrlRegex = (item: NewsItem) => {
  const imgUrl = item.formattedDescription.match(/<img.*?src=["|'](.*?)["|']/g) ?? []
  if (imgUrl.length) {
    return imgUrl[0].split('"')[1]
  }
}

// Twitter titles included the author, so we remove it
const cleanTitle = (item: NewsItem) => {
  return item.title.replace(`${item.author}: `, '')
}

function NewsFeed() {
  const [shouldFetch, setShouldFetch] = useState(true)
  const [newsItems, setNewsItems] = useState([])
  const dispatch = useDispatch()
  const { t } = useTranslation()

  useAsync(
    async () => {
      if (!shouldFetch) return
      // TODO: use remote config to store the rss.app url
      const response = await fetch('https://rss.app/feeds/_HF5BmbIbBZzrNW80.json')
      if (!response.ok) {
        throw new Error(
          `Failure response fetching celo news feed ${response.status}  ${response.statusText}`
        )
      }
      const news = await response.json()
      setNewsItems(news.items)
      setShouldFetch(false)
    },
    [shouldFetch],
    {
      onError: (error) => {
        setShouldFetch(false)
        dispatch(showError(ErrorMessages.NEWS_FEED_FETCH_FAILED))
        Logger.debug(TAG, 'Error fetching news feed', error)
      },
    }
  )
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('newsFeed.title')}</Text>
      {newsItems.map((item: NewsItem) => {
        return (
          <NewsFeedItem
            author={item.author}
            key={item.id}
            title={cleanTitle(item)}
            createdAt={item.createdAt}
            url={item.url}
            imgUrl={imgUrlRegex(item) ?? null}
          />
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    padding: variables.contentPadding,
  },
  title: {
    ...fontStyles.h2,
    marginBottom: 8,
  },
})

export default NewsFeed
