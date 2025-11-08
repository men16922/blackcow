export const calculateBRS = (
  priceScore: number,
  sellerScore: number,
  reviewScore: number
): number => {
  return priceScore + sellerScore + reviewScore
}

export const getRiskLevel = (brs: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
  if (brs <= 30) return 'LOW'
  if (brs <= 60) return 'MEDIUM'
  return 'HIGH'
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price)
}

export const isValidURL = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const getPlatformFromURL = (url: string): string | null => {
  try {
    const hostname = new URL(url).hostname
    if (hostname.includes('coupang.com')) return 'coupang'
    if (hostname.includes('naver.com')) return 'naver'
    if (hostname.includes('11st.co.kr')) return '11st'
    return null
  } catch {
    return null
  }
}
