import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      navigate('/analysis', { state: { url } });
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">🛡️ 쇼핑 흑우 감별사</h1>
        <p className="text-xl text-gray-600 mb-12">AI 기반 온라인 쇼핑 사기 탐지 서비스</p>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="상품 URL을 입력하세요 (쿠팡, 네이버쇼핑, 11번가)"
              className="flex-1 px-6 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <button
              type="submit"
              className="px-8 py-4 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-blue-600 transition-colors"
            >
              분석하기
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">상품 크롤링</h3>
            <p className="text-gray-600">쿠팡, 네이버쇼핑, 11번가 지원</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2">가격 분석</h3>
            <p className="text-gray-600">이상치 탐지 및 가격 비교</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">리뷰 분석</h3>
            <p className="text-gray-600">AI 기반 감정 분석 및 어뷰징 탐지</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
