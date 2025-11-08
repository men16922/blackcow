export interface AnalysisResult {
  brs: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  reasonCodes: string[]
  analyses: {
    price: PriceAnalysis
    seller: SellerAnalysis
    review: ReviewAnalysis
  }
  recommendations: Alternative[]
  analyzedAt: string
  processingTime: number
}

export interface PriceAnalysis {
  score: number
  median: number
  mad: number
  isOutlier: boolean
}

export interface SellerAnalysis {
  score: number
  trustScore: number
}

export interface ReviewAnalysis {
  score: number
  patterns: {
    hasReviewSurge: boolean
    hasRepetition: boolean
    lacksDiversity: boolean
  }
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
  abusingKeywords: string[]
}

export interface Alternative {
  url: string
  title: string
  price: number
  platform: string
  brs: number
  seller: {
    name: string
    trustScore: number
  }
}

export interface Product {
  url: string
  title: string
  price: number
  platform: string
  seller: {
    name: string
    rating?: number
  }
  reviews: Review[]
  images: string[]
}

export interface Review {
  id: string
  rating: number
  content: string
  author: string
  date: string
  verified: boolean
}
