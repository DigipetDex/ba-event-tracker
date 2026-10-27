import React from 'react';
import { SlidersHorizontal, Coins } from 'lucide-react';
import type { Currency } from '../types';

interface BonusAndInventoryProps {
  currencies: Currency[];
  bonusPercents: Record<string, number>;
  ownedCurrencies: Record<string, number>;
  onUpdateBonus: (currencyId: string, percent: number) => void;
  onUpdateOwned: (currencyId: string, amount: number) => void;
}

export const BonusAndInventory: React.FC<BonusAndInventoryProps> = ({
  currencies,
  bonusPercents,
  ownedCurrencies,
  onUpdateBonus,
  onUpdateOwned,
}) => {
  const quickBonuses = [0, 25, 50, 75, 100, 120];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="text-blue-600" size={18} />
        <h2 className="text-base font-bold text-slate-800">
          2단계 & 4단계: 보너스 배율 및 현재 보유 재화 설정
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {currencies.map((currency) => {
          const currentBonus = bonusPercents[currency.id] || 0;
          const currentOwned = ownedCurrencies[currency.id] || 0;

          return (
            <div key={currency.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <img src={currency.imageUrl} alt="" className="w-6 h-6 object-contain" />
                  <span className="font-bold text-sm text-slate-800">{currency.name}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  +{currentBonus}% 보너스
                </span>
              </div>

              {/* 2. 보너스 배율 설정 */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                  <span className="font-medium">보너스 학생 배율:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={currentBonus}
                      onChange={(e) => onUpdateBonus(currency.id, Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-14 px-1.5 py-0.5 text-right font-bold text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                </div>

                {/* 빠른 보너스 선택 버튼 */}
                <div className="flex flex-wrap gap-1">
                  {quickBonuses.map((val) => (
                    <button
                      key={val}
                      onClick={() => onUpdateBonus(currency.id, val)}
                      className={`text-[11px] px-2 py-0.5 rounded font-medium transition ${
                        currentBonus === val
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {val === 0 ? '기본' : `+${val}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. 현재 보유중인 재화 입력 */}
              <div className="pt-2 border-t border-slate-200/60">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                  <span className="font-medium flex items-center gap-1">
                    <Coins size={13} className="text-amber-500" /> 현재 보유 개수:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currentOwned === 0 ? '' : currentOwned}
                    onChange={(e) => onUpdateOwned(currency.id, Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  />
                  <span className="text-xs text-slate-500 shrink-0 font-medium">개</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
