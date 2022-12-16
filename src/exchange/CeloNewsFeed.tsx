import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, StyleSheet, Text, View } from 'react-native'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CeloNewsFeedItem from 'src/exchange/CeloNewsFeedItem'
import { CeloNewsArticle, CeloNewsArticles } from 'src/exchange/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const FAKE_DATA: CeloNewsArticles = {
  articles: [
    {
      articleImage:
        'https://flockler.com/thumbs/sites/23703/1-1-msqbpg075ue_544hfbrg-c84fbd8f-da18-4f80-a508-e24d58c33414_s600x0_q80_noupscale.jpeg',
      author: 'Celo Foundation',
      createdAt: '2022-11-07T14:01:38.000Z',
      id: 109261928,
      link: 'https://blog.celo.org/announcing-kuneco-changes-new-celo-block-party-8ce6113dff93?source=rss-18e0dc50a66e------2',
      title: 'Announcing Kuneco Changes & New Celo Block Party',
      type: 'rss',
    },
    {
      articleImage:
        'https://flockler.com/thumbs/sites/23703/1-per9cntvkjyxodl2jbiakw-264269bc-287b-4adb-af44-35bfb8fab48d_s600x0_q80_noupscale.jpeg',
      author: 'Celo Foundation',
      createdAt: '2022-11-02T13:01:59.000Z',
      id: 109261927,
      link: 'https://blog.celo.org/celo-deutsche-telekoms-partnership-strengthens-with-the-global-launch-of-t-challenge-bd102f07b572?source=rss-18e0dc50a66e------2',
      title:
        'Celo & Deutsche Telekom’s Partnership Strengthens with the Global Launch of T Challenge',
      type: 'rss',
    },
    {
      articleImage:
        'https://flockler.com/thumbs/sites/23703/1-33divbsrhss3-chrwflksw-8c2e1020-34ec-4270-9732-442fff285cbe_s600x0_q80_noupscale.jpeg',
      author: 'Celo Foundation',
      createdAt: '2022-10-07T13:01:56.000Z',
      id: 109261926,
      link: 'https://blog.celo.org/celo-camp-batch-6-teams-announced-with-new-founders-support-from-coinbase-cloud-e3c52087021b?source=rss-18e0dc50a66e------2',
      title: 'Celo Camp Batch 6 Teams Announced with New Founders Support from Coinbase Cloud',
      type: 'rss',
    },
    {
      articleImage:
        'https://flockler.com/thumbs/sites/23703/1-ds05i80nbu6hjhmdweiwug-717640c2-be6d-40fe-8c41-d5e764c25e98_s600x0_q80_noupscale.jpeg',
      author: 'Celo Foundation',
      createdAt: '2022-10-05T19:20:04.000Z',
      id: 109261924,
      link: 'https://blog.celo.org/celo-pilot-tests-whether-quadratic-funding-can-be-used-to-encourage-donations-to-build-financial-160cf143d953?source=rss-18e0dc50a66e------2',
      title:
        'Celo Pilot Tests Whether Quadratic Funding Can Be Used to Encourage Donations to Build Financial…',
      type: 'rss',
    },
    {
      articleImage:
        'https://flockler.com/thumbs/sites/23703/1-cempnstpr_0i8gs0rw3nsa-8bd9d009-b232-4be4-a8ab-c81a1f9ee3e9_s600x0_q80_noupscale.jpeg',
      author: 'Celo Foundation',
      createdAt: '2022-09-19T18:57:53.000Z',
      id: 109261923,
      link: 'https://blog.celo.org/a-celo-nft-backed-rewards-pilot-a-success-in-san-francisco-5d02815d180a?source=rss-18e0dc50a66e------2',
      title: 'A Celo NFT-backed Rewards Pilot a Success In San Francisco',
      type: 'rss',
    },
  ],
  nextPageId: '109261921',
}

interface Props {}

function renderItem({ item: article }: ListRenderItemInfo<CeloNewsArticle>) {
  return (
    <CeloNewsFeedItem
      article={article}
      // testID={`ChooseLanguage/${language.code}`}
    />
  )
}

function keyExtractor(item: CeloNewsArticle) {
  return item.id.toString()
}

function ItemSeparator() {
  return <View style={styles.separator} />
}

export default function (props: Props) {
  const { t } = useTranslation()

  function onPressReadMore() {
    // TODO: use a remote config for this URL
    navigate(Screens.WebViewScreen, { uri: 'https://blog.celo.org' })
  }

  return (
    <FlatList
      data={FAKE_DATA.articles}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparator}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('celoNews.headerTitle')}</Text>
          <Text style={styles.headerDescription}>{t('celoNews.headerDescription')}</Text>
        </View>
      }
      ListFooterComponent={
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
      }
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
})
