import React from 'react';
import { Minus, Plus, RotateCcw, Zap, CheckCircle2 } from 'lucide-react';
import type { Currency, Stage } from '../types';

interface SweepTrackerCardProps {
  currency: Currency;
  stage?: Stage;
  totalRequiredCurrency: number; // 살 아이템들의 총 재화
  ownedCurrency: number; // 현재 보유 재화
  netRequiredCurrency: number; // 보유량 차감 후 순 필요량
  bonusPercent: number; // 보너스율 (%)
  effectiveDropPerRun: number; // 1판당 실제 드롭량 (기본 + 보너스)
  totalSweepsNeeded: number; // 순 필요 재화 기준 총 필요 소탕 수
  clearedSweeps: number; // 이미 돈 소탕 횟수 (5번 기능)
  onUpdateClearedSweeps: (count: number) => void;
}

export const SweepTrackerCard: React.FC<SweepTrackerCardProps> = ({
  currency,
  stage,
  totalRequiredCurrency,
  ownedCurrency,
  netRequiredCurrency,
  bonusPercent,
  effectiveDropPerRun,
  totalSweepsNeeded,
  clearedSweeps,
  onUpdateClearedSweeps,
}) => {
  // 남은 소탕 횟수 = 총 필요 소탕 - 완료한 소탕
  const remainingSweeps = Math.max(0, totalSweepsNeeded - clearedSweeps);
  const progressPercent = totalSweepsNeeded > 0 
    ? Math.min(100, Math.round((clearedSweeps / totalSweepsNeeded) * 100)) 
    : (netRequiredCurrency === 0 ? 100 : 0);
  
  const isCompleted = totalSweepsNeeded > 0 && remainingSweeps === 0;
  const apPerRun = stage?.apCost || 20;
  const remainingAp = remainingSweeps * apPerRun;

  const handleDelta = (delta: number) => {
    const next = Math.max(0, clearedSweeps + delta);
    onUpdateClearedSweeps(next);
  };

  // 재화별 테마 색상 클래스
  const colorMap: Record<string, { bg: string; text: string; badge: string; border: string; ring: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', border: 'border-blue-200', ring: 'ring-blue-400' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', border: 'border-amber-200', ring: 'ring-amber-400' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800', border: 'border-rose-200', ring: 'ring-rose-400' },
  };

  const theme = colorMap[currency.color] || colorMap.blue;

  return (
    <div className={`rounded-2xl border ${theme.border} bg-white shadow-sm p-5 transition-all hover:shadow-md`}>
      {/* 카드 상단: 재화 이름 & 스테이지 정보 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {currency.imageUrl && (
            <img
              src={currency.imageUrl}
              alt=""
              className="w-6 h-6 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${theme.badge}`}>
            {currency.name}
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            {stage ? stage.name : '전용 스테이지'}
          </span>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          판당 드롭: <span className="font-semibold text-slate-700">{effectiveDropPerRun.toFixed(1)}개</span>
          <span className="text-slate-400 ml-1">(+{bonusPercent}%)</span>
        </div>
      </div>

      {/* 핵심 5번 기능: 남은 소탕 횟수 대시보드 */}
      <div className={`rounded-xl p-4 mb-4 ${theme.bg} border ${theme.border} text-center relative overflow-hidden`}>
        {isCompleted && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-semibold">
            <CheckCircle2 size={14} /> 목표 달성!
          </div>
        )}
        <div className="text-xs font-medium text-slate-500 mb-1">
          남은 필요 소탕 횟수
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className={`text-4xl font-extrabold tracking-tight ${isCompleted ? 'text-emerald-600' : theme.text}`}>
            {remainingSweeps}
          </span>
          <span className="text-lg font-bold text-slate-600">회</span>
        </div>
        
        <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
          <Zap size={13} className="text-amber-500" />
          남은 소탕 필요 AP: <span className="font-semibold text-slate-700">{remainingAp} AP</span>
        </div>

        {/* 진행률 바 */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>진행률 ({clearedSweeps} / {totalSweepsNeeded}회)</span>
            <span className="font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5번 핵심 컨트롤러: 내가 돈 소탕 횟수 추가/감소 버튼 & 입력기 */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700">소탕 진척도 입력</span>
          <button
            onClick={() => onUpdateClearedSweeps(0)}
            className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5 transition"
            title="소탕 횟수 리셋"
          >
            <RotateCcw size={11} /> 리셋
          </button>
        </div>

        {/* 직접 횟수 입력 및 증감 버튼 */}
        <div className="flex items-center justify-center gap-2 mb-2.5">
          <button
            onClick={() => handleDelta(-1)}
            disabled={clearedSweeps <= 0}
            className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition shadow-xs"
            title="1회 취소"
          >
            <Minus size={16} />
          </button>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-medium">완료:</span>
            <input
              type="number"
              min="0"
              value={clearedSweeps === 0 ? '' : clearedSweeps}
              placeholder="0"
              onChange={(e) => onUpdateClearedSweeps(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 px-2 py-1 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-inner"
            />
            <span className="text-xs text-slate-500 font-medium">회</span>
          </div>

          <button
            onClick={() => handleDelta(1)}
            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs"
            title="1회 소탕 완료 추가"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* 자주 쓰는 빠른 소탕 완료 버튼 (+1, +5, +10) */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => handleDelta(1)}
            className="py-1 px-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition"
          >
            +1회 소탕
          </button>
          <button
            onClick={() => handleDelta(5)}
            className="py-1 px-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition"
          >
            +5회 소탕
          </button>
          <button
            onClick={() => handleDelta(10)}
            className="py-1 px-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition"
          >
            +10회 소탕
          </button>
        </div>
      </div>

      {/* 하단 세부 계산 내역 */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
        <div>
          구매 필요량: <span className="font-semibold text-slate-700">{totalRequiredCurrency.toLocaleString()}</span>
        </div>
        <div>
          현재 보유: <span className="font-semibold text-slate-700">{ownedCurrency.toLocaleString()}</span>
        </div>
        <div>
          순 필요량: <span className="font-semibold text-slate-700">{netRequiredCurrency.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
