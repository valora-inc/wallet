import { formatDistanceToNowStrict } from 'date-fns'
import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { CeloNewsEvents } from 'src/analytics/Events'
import { CeloNewsArticle } from 'src/celoNews/types'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import Touchable from 'src/components/Touchable'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const IMAGE_SIZE = 44

interface Props {
  article: CeloNewsArticle
  testID?: string
}

export default function CeloNewsFeedItem({ article, testID }: Props) {
  function onPress() {
    const url = article.link
    AppAnalytics.track(CeloNewsEvents.celo_news_article_tap, { url })
    navigate(Screens.WebViewScreen, { uri: url })
  }

  // Be sure to update the skeleton component if this changes significantly
  return (
    <Touchable onPress={onPress} testID={testID}>
      <View style={styles.contentContainer}>
        <View style={styles.row}>
          <Text style={styles.author} numberOfLines={1}>
            {article.author}
          </Text>
          <Text style={styles.date} numberOfLines={1}>
            {formatDistanceToNowStrict(new Date(article.createdAt))}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.title}>{article.title}</Text>
          {!!article.articleImage && (
            <Image
              source={{ uri: article.articleImage }}
              style={styles.image}
              testID="CeloNewsFeedItemImage"
            />
          )}
        </View>
      </View>
    </Touchable>
  )
}

// This is a skeleton placeholder for when the feed is loading
// It's a simplified version of the real component, reusing styles where possible
CeloNewsFeedItem.Skeleton = () => (
  <SkeletonPlaceholder borderRadius={4} testID="CeloNewsFeedItemSkeleton">
    <View style={styles.contentContainer}>
      <View style={{ ...styles.author, width: 60 }} />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <View style={{ ...styles.title, flex: undefined, marginBottom: 4 }} />
          <View style={{ ...styles.title, flex: undefined, width: '60%' }} />
        </View>
        <View style={styles.image} />
      </View>
    </View>
  </SkeletonPlaceholder>
)

const styles = StyleSheet.create({
  contentContainer: {
    marginHorizontal: Spacing.Thick24,
    marginTop: Spacing.Regular16,
    marginBottom: Spacing.Thick24,
  },
  author: {
    ...typeScale.labelSemiBoldSmall,
    color: colors.warningPrimary,
    marginBottom: Spacing.Small12,
  },
  row: {
    flexDirection: 'row',
  },
  title: {
    ...typeScale.bodyMedium,
    flex: 1,
  },
  date: {
    ...typeScale.bodySmall,
    fontSize: 13,
    lineHeight: 16,
    color: colors.contentSecondary,
    marginLeft: 4,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 4,
    marginLeft: 16,
  },
})
