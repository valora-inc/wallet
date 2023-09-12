import { Currency } from 'src/utils/currencies'

export interface CeloNewsConfig {
  readMoreUrl?: string
}
export interface CeloNewsArticles {
  articles: CeloNewsArticle[]
  nextPageId: string
}

export interface CeloNewsArticle {
  articleImage?: string
  author: string
  createdAt: string
  id: number
  link: string
  title: string
  type: string
}

export interface ExternalExchangeProvider {
  name: string
  link: string
  currencies: Currency[]
  supportedRegions?: string[]
}
