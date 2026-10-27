import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { Currency, ShopItem } from '../types';
import { ITEM_DESCRIPTIONS } from '../data/itemDescriptions';

interface ShopSelectorProps {
  currencies: Currency[];
  shopItems: ShopItem[];
  itemPurchases: Record<string, number>;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onSelectAllForCurrency: (currencyId: string, select: boolean) => void;
  requiredCurrencyTotals: Record<string, number>; // 재화별 총 필요 수량
}

export const ShopSelector: React.FC<ShopSelectorProps> = ({
  currencies,
  shopItems,
  itemPurchases,
  onUpdateQuantity,
  onSelectAllForCurrency,
  requiredCurrencyTotals,
}) => {
  // 실제 상점 품목이 존재하는 재화들만 상점 탭으로 표시
  const availableCurrencies = currencies.filter((c) =>
    shopItems.some((item) => item.currencyId === c.id)
  );

  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>('');

  const activeCurrencyId =
    (availableCurrencies.some((c) => c.id === selectedCurrencyId) ? selectedCurrencyId : '') ||
    availableCurrencies[0]?.id ||
    currencies[0]?.id ||
    '';

  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const filteredItems = shopItems.filter((item) => item.currencyId === activeCurrencyId);
  const currentCurrency = currencies.find((c) => c.id === activeCurrencyId);

  return (
    <section id="event-shop" className="bg-[#18181b] rounded-2xl border border-[#27272a] p-4 sm:p-5 shadow-xs scroll-mt-20">
      {/* 헤더 & 선택 재화 총 필요량 요약 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-3 border-b border-[#27272a]">
        <div>
          <h2 className="text-base font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <ShoppingCart size={17} className="text-blue-400" /> 이벤트 상점 계산기
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">교환할 아이템의 수량을 선택하면 필요 재화가 자동 계산됩니다</p>
        </div>

        {/* 상점 선택 품목 구매에 필요한 총 이벤트 아이템 개수 */}
        <div className="flex flex-wrap items-center gap-2 bg-[#202025] px-3 py-2 rounded-xl border border-[#2e2e36]">
          <span className="text-[11px] font-bold text-zinc-400 mr-1">선택 구매 필요 총량:</span>
          {availableCurrencies.map((curr) => {
            const total = requiredCurrencyTotals[curr.id] || 0;
            const isCurrent = curr.id === activeCurrencyId;
            return (
              <div
                key={curr.id}
                onClick={() => setSelectedCurrencyId(curr.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs cursor-pointer transition ${
                  isCurrent
                    ? 'bg-zinc-800 border border-zinc-500 text-white font-bold'
                    : 'bg-[#161619] border border-[#2c2c34] text-zinc-300 hover:border-zinc-500'
                }`}
                title="클릭하여 해당 상점 탭으로 이동"
              >
                <img src={curr.imageUrl} alt="" className="w-4 h-4 object-contain" />
                <span className="text-zinc-400 font-normal">{curr.name}:</span>
                <span className={total > 0 ? 'text-white font-extrabold' : 'text-zinc-500'}>
                  {total.toLocaleString()}개
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 재화 탭 (언더라인 탭) */}
      <div className="flex items-center gap-6 border-b border-[#27272a] mb-4 overflow-x-auto">
        {availableCurrencies.map((currency) => {
          const isSelected = activeCurrencyId === currency.id;
          const totalCostForThis = requiredCurrencyTotals[currency.id] || 0;

          return (
            <button
              key={currency.id}
              onClick={() => setSelectedCurrencyId(currency.id)}
              className={`pb-2.5 flex items-center gap-2 text-xs font-bold transition-all relative whitespace-nowrap ${
                isSelected
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <img
                src={currency.imageUrl}
                alt=""
                className="w-4 h-4 object-contain"
              />
              <span>{currency.name}</span>
              {totalCostForThis > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 font-semibold border border-zinc-700 whitespace-nowrap leading-none">
                  {totalCostForThis.toLocaleString()}개
                </span>
              )}

              {/* 활성 언더라인 인디케이터 (화이트) */}
              {isSelected && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* 8열 아이템 그리드 (유즈트렌드 동일 규격: 4개 1세트 품목들이 2세트씩 한 줄에 깔끔하게 정렬됨) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-6">
        {filteredItems.map((item) => {
          const purchasedQty = itemPurchases[item.id] || 0;
          const maxQty = item.maxQuantity ?? 999;
          const hasMax = item.maxQuantity !== null;
          const descInfo = ITEM_DESCRIPTIONS[item.id];
          const itemDesc = item.description || descInfo?.description || '';
          const isHovered = hoveredItemId === item.id;
          const isSelected = purchasedQty > 0;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId(null)}
              title={`${item.name}${itemDesc ? `\n\n${itemDesc}` : ''}`}
              className={`bg-[#1c1c20] border rounded-xl p-2 transition-all flex flex-col items-center justify-between shadow-xs relative group cursor-pointer ${
                isSelected
                  ? 'border-blue-500/80 bg-[#1e2029] ring-1 ring-blue-500/50'
                  : 'border-[#2c2c34] hover:border-zinc-500'
              }`}
            >
              {/* 상단: 아이템 아이콘 */}
              <div className="w-14 h-14 rounded-xl bg-[#24242c] border border-[#343440] p-1 flex items-center justify-center relative mb-1.5 shadow-inner">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-contain pointer-events-none"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                {/* 마우스 호버 시 100% 완전 불투명 툴팁 */}
                {isHovered && (
                  <div
                    className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg border border-zinc-500 text-left pointer-events-none"
                    style={{
                      backgroundColor: '#161619',
                      opacity: 1,
                      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="font-extrabold text-xs text-white mb-1.5 flex items-center justify-between gap-1 border-b border-zinc-700/80 pb-1">
                      <span>{item.name}</span>
                      <span className="text-[10px] text-zinc-300 font-bold bg-[#222228] px-1.5 py-0.5 rounded">
                        {hasMax ? `최대 ${item.maxQuantity}개` : '무제한'}
                      </span>
                    </div>
                    {itemDesc ? (
                      <p className="text-[11px] text-zinc-200 leading-relaxed whitespace-pre-line font-normal">
                        {itemDesc}
                      </p>
                    ) : (
                      <p className="text-[10px] text-zinc-400 font-normal">상점 교환 아이템</p>
                    )}
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#161619]"
                    />
                  </div>
                )}
              </div>

              {/* 가격 및 한정 수량 표시 (유즈트렌드 스타일: 재화아이콘 가격 × 수량) */}
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-white mb-1">
                <img src={currentCurrency?.imageUrl} alt="" className="w-3.5 h-3.5 object-contain" />
                <span>{item.unitPrice}</span>
                <span className="text-zinc-500 font-medium">×</span>
                <span className="text-zinc-400 font-semibold">{hasMax ? item.maxQuantity : '∞'}</span>
              </div>

              {/* 아이템 이름 */}
              <div
                className="text-[11px] font-medium text-zinc-200 text-center truncate w-full mb-1.5 px-0.5 leading-tight"
                title={item.name}
              >
                {item.name}
              </div>

              {/* 구매 수량 표시 헤더 */}
              <div className="w-full flex items-center justify-between text-[10px] font-semibold text-zinc-400 mb-1 px-0.5">
                <span>구매 수량</span>
                <span className={isSelected ? 'text-blue-400 font-black' : 'text-zinc-500'}>
                  {purchasedQty} / {hasMax ? item.maxQuantity : '∞'}
                </span>
              </div>

              {/* 하단 입력 컨트롤러: [-] [숫자 입력창] [+] [M] */}
              <div className="flex items-stretch w-full bg-[#101014] rounded-lg border border-[#363644] overflow-hidden text-xs h-7">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, Math.max(0, purchasedQty - 1))}
                  className="w-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition font-black cursor-pointer shrink-0 border-r border-[#2d2d38]"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max={maxQty}
                  value={purchasedQty}
                  onChange={(e) => {
                    const val = Math.min(maxQty, Math.max(0, parseInt(e.target.value) || 0));
                    onUpdateQuantity(item.id, val);
                  }}
                  className={`flex-1 min-w-0 px-0.5 text-center font-black text-xs bg-transparent focus:outline-none ${
                    isSelected ? 'text-white' : 'text-zinc-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, Math.min(maxQty, purchasedQty + 1))}
                  className="w-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition font-black cursor-pointer shrink-0 border-l border-[#2d2d38]"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, isSelected && purchasedQty === maxQty ? 0 : maxQty)}
                  className={`px-1.5 flex items-center justify-center text-[10px] font-black transition border-l border-[#2d2d38] cursor-pointer shrink-0 ${
                    isSelected && purchasedQty === maxQty
                      ? 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={isSelected && purchasedQty === maxQty ? "0개로 초기화" : "최대 수량 선택 (풀매수)"}
                >
                  {isSelected && purchasedQty === maxQty ? '0' : 'M'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 우측 하단 버튼 */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#27272a] text-xs">
        <div className="text-zinc-400 text-xs">
          현재 탭 필요량: <strong className="text-white font-bold">{(requiredCurrencyTotals[activeCurrencyId] || 0).toLocaleString()}</strong> 개
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectAllForCurrency(activeCurrencyId, true)}
            className="px-3 py-1 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold transition text-xs shadow-xs cursor-pointer"
          >
            현재 탭 풀매수
          </button>
          <button
            onClick={() => onSelectAllForCurrency(activeCurrencyId, false)}
            className="px-3 py-1 rounded-lg bg-[#27272a] hover:bg-[#323238] text-zinc-300 font-semibold transition text-xs border border-zinc-700/60 cursor-pointer"
          >
            초기화
          </button>
        </div>
      </div>
    </section>
  );
};
