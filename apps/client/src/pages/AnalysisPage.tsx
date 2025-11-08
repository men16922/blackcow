import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyzeProduct } from '../services/api';

interface AnalysisResult {
  brs: number;
  riskLevel: string;
  reasonCodes: string[];
  analyses: {
    price: {
      score: number;
      median: number;
      mad: number;
      isOutlier: boolean;
    };
    seller: {
      score: number;
      trustScore: number;
    };
    review: {
      score: number;
      patterns: {
        hasReviewSurge: boolean;
        hasRepetition: boolean;
        lacksDiversity: boolean;
      };
      sentiment: {
        positive: number;
        neutral: number;
        negative: number;
      };
      abusingKeywords: string[];
    };
  };
  recommendations: Array<{
    url: string;
    title: string;
    price: number;
    brs: number;
  }>;
  analyzedAt: string;
  processingTime: number;
}

function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = location.state?.url;

  useEffect(() => {
    if (!url) {
      navigate('/');
      return;
    }

    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const data = await analyzeProduct(url);
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [url, navigate]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'text-success';
      case 'MEDIUM':
        return 'text-warning';
      case 'HIGH':
        return 'text-danger';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">상품 분석 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-danger text-lg">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600"
            >
              다시 시도하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="mb-6 text-primary hover:underline">
          ← 돌아가기
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">BRS 점수</h1>
            <div className={`text-6xl font-bold ${getRiskColor(result.riskLevel)}`}>
              {result.brs}
            </div>
            <p className="text-xl text-gray-600 mt-2">위험도: {result.riskLevel}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">가격 분석</h3>
              <p className="text-2xl font-bold text-primary">{result.analyses.price.score}점</p>
              <p className="text-sm text-gray-600 mt-1">
                {result.analyses.price.isOutlier ? '가격 이상치 감지' : '정상 가격 범위'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">판매자 신뢰도</h3>
              <p className="text-2xl font-bold text-primary">{result.analyses.seller.score}점</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">리뷰 분석</h3>
              <p className="text-2xl font-bold text-primary">{result.analyses.review.score}점</p>
            </div>
          </div>

          {result.reasonCodes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">위험 요소</h3>
              <div className="flex flex-wrap gap-2">
                {result.reasonCodes.map(code => (
                  <span
                    key={code}
                    className="px-3 py-1 bg-red-100 text-danger rounded-full text-sm"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {result.recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">추천 대안 상품</h2>
            <div className="space-y-4">
              {result.recommendations.map((rec, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold mb-2">{rec.title}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">{rec.price.toLocaleString()}원</span>
                    <span className="text-success font-semibold">BRS {rec.brs}점</span>
                  </div>
                  <a
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm mt-2 inline-block"
                  >
                    상품 보기 →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalysisPage;
