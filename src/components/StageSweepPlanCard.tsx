import React, { useState } from 'react';
import { Zap, RotateCcw, Check } from 'lucide-react';
import type { Stage } from '../types';

interface StageSweepPlanCardProps {
  stage: Stage;
  bonusPercents?: Record<string, number>; // 재화별 학생 보너스 % (이벤트 재화 드롭에 Bonus 타일 추가)
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
  remainingSweeps: number; // 현재 남은 소탕 횟수 (예: 200 -> 차감 후 160)
  initialCalculatedSweeps: number; // 초기 계산된 총 필요 횟수
  deductedSweeps: number; // 지금까지 차감한 누적 횟수 (예: 40)
  onApplyDeduction: (count: number) => void; // 이번에 돈 횟수 차감 적용 함수
  onResetDeduction: () => void;
}

import { ITEM_DESCRIPTIONS } from '../data/itemDescriptions';
import { bonusDropAmount } from '../utils/bonus';

export const StageSweepPlanCard: React.FC<StageSweepPlanCardProps> = ({
  stage,
  bonusPercents = {},
  isActive,
  onToggleActive,
  remainingSweeps,
  initialCalculatedSweeps,
  deductedSweeps,
  onApplyDeduction,
  onResetDeduction,
}) => {
  // 이번에 인게임에서 돈 횟수를 입력받는 로컬 상태
  const [inputCount, setInputCount] = useState<number>(0);
  const [hoveredDropId, setHoveredDropId] = useState<string | null>(null);

  // '소탕' 버튼 클릭 시: 남은 횟수에서 차감하고 입력창은 0으로 리셋!
  const handleApply = () => {
    if (inputCount > 0) {
      onApplyDeduction(inputCount);
      setInputCount(0); // 0으로 즉시 리셋
    }
  };

  const isCompleted = initialCalculatedSweeps > 0 && remainingSweeps === 0;

  return (
    <div
      className={`rounded-xl border transition-all flex flex-col justify-between shadow-xs ${
        isActive
          ? 'bg-[#1b1b1f] border-[#2c2c34] p-2.5'
          : 'bg-[#141416] border-[#1f1f23] p-2'
      }`}
    >
      <div>
        {/* 상단 1줄: [스테이지 번호] [소모 AP] [남은 소탕 횟수] ... [스위치] */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {/* 스테이지 번호 */}
            <span className="w-5 h-5 rounded bg-[#25252e] border border-[#383846] flex items-center justify-center font-black text-[11px] text-white">
              {stage.number}
            </span>

            {/* 소모 AP (몰루로그 스타일 그린 텍스트) */}
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-0.5">
              <Zap size={10} fill="currentColor" /> {stage.apCost}
            </span>

            {/* 추천/남은 소탕 횟수 뱃지 */}
            {isActive && initialCalculatedSweeps > 0 && (
              <span
                className={`text-[11px] font-bold px-2 py-0.2 rounded-full border ${
                  isCompleted
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700 line-through'
                    : 'bg-blue-600 text-white border-blue-400/50 shadow-xs'
                }`}
              >
                {remainingSweeps}회 소탕
              </span>
            )}
          </div>

          {/* 토글 스위치 (몰루로그 실물 사이즈) */}
          <button
            type="button"
            onClick={() => onToggleActive(!isActive)}
            className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
              isActive ? 'bg-blue-600' : 'bg-[#2d2d34]'
            }`}
            title={isActive ? '활성화됨' : '비활성화됨'}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full shadow transform transition-transform ${
                isActive ? 'translate-x-3.5 bg-white' : 'translate-x-0 bg-zinc-400'
              }`}
            />
          </button>
        </div>

        {/* 중간: 드롭 아이템 뱃지들 (w-10 h-10, 호버 시 화면 위에 확실하게 뜨는 툴팁) */}
        <div className="flex items-center gap-1.5 py-0.5">
          {[
            ...stage.drops.map((drop, idx) => ({
              drop,
              amount: drop.amount,
              isBonus: false,
              key: `${stage.number}-${idx}`,
            })),
            // 보너스 타일은 보상풀 맨 뒤에 추가
            ...stage.drops.flatMap((drop, idx) => {
              const bonusAmount = drop.isEventCurrency
                ? bonusDropAmount(drop.amount, bonusPercents[drop.resourceUid] || 0)
                : 0;
              return bonusAmount > 0
                ? [{ drop, amount: bonusAmount, isBonus: true, key: `${stage.number}-${idx}-bonus` }]
                : [];
            }),
          ].map(({ drop, amount, isBonus, key: dropKey }, idx) => {
            const descInfo = ITEM_DESCRIPTIONS[drop.resourceUid];
            const dropTitle = descInfo?.name || drop.name;
            const dropDesc = drop.description || descInfo?.description || '';
            const isHovered = hoveredDropId === dropKey;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredDropId(dropKey)}
                onMouseLeave={() => setHoveredDropId(null)}
                className="w-10 h-10 rounded-lg bg-[#202026] border border-[#2d2d38] p-0.5 flex items-center justify-center relative shrink-0 shadow-inner group cursor-pointer"
                title={`${dropTitle}${dropDesc ? `\n\n${dropDesc}` : ''}`}
              >
                {isBonus && (
                  <span className="absolute top-0 left-0 right-0 text-center text-[7px] leading-3 font-black text-white bg-pink-500 rounded-sm pointer-events-none z-10">
                    Bonus
                  </span>
                )}
                <img
                  src={drop.imageUrl}
                  alt={drop.name}
                  className="w-full h-full object-contain pointer-events-none"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="absolute bottom-0 right-1 text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                  {amount}
                </span>

                {/* 마우스 호버 시 상세 툴팁 (완전 불투명 배경 & 선명한 가독성) */}
                {isHovered && (
                  <div
                    className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-[#141416] border border-zinc-500 text-left shadow-2xl pointer-events-none opacity-100"
                    style={{
                      backgroundColor: '#161619',
                      opacity: 1,
                      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="font-extrabold text-xs text-white mb-1.5 flex items-center justify-between gap-1 border-b border-zinc-700/80 pb-1">
                      <span>{dropTitle}</span>
                      <span className="text-[10px] text-zinc-300 font-bold bg-[#222228] px-1.5 py-0.5 rounded">
                        {amount}개 {isBonus ? '보너스 드롭' : '드롭'}
                      </span>
                    </div>
                    {dropDesc ? (
                      <p className="text-[11px] text-zinc-200 leading-relaxed whitespace-pre-line font-normal">
                        {dropDesc}
                      </p>
                    ) : (
                      <p className="text-[10px] text-zinc-400 font-normal">스테이지 드롭 보상</p>
                    )}
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#161619]"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단: 활성화된 스테이지에만 나타나는 컴팩트 소탕 컨트롤러 (비활성화 시 자리 차지 완전 제거!) */}
      {isActive && (
        <div className="pt-1.5 mt-1.5 border-t border-[#26262e]">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1 font-medium">
            <span>추가 소탕</span>
            {deductedSweeps > 0 && (
              <div className="flex items-center gap-1.5 text-[9px]">
                <span>누적: {deductedSweeps}회</span>
                <button
                  type="button"
                  onClick={onResetDeduction}
                  className="text-zinc-400 hover:text-white flex items-center gap-0.5 cursor-pointer underline"
                  title="차감 초기화"
                >
                  <RotateCcw size={8} /> 리셋
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* 몰루로그 스타일 [-] [인풋] [+] 바 */}
            <div className="flex items-stretch flex-1 bg-[#121215] rounded border border-[#30303a] overflow-hidden">
              <button
                type="button"
                onClick={() => setInputCount((prev) => Math.max(0, prev - 1))}
                className="w-6 py-0.5 text-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition font-black text-xs cursor-pointer shrink-0"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={inputCount === 0 ? '' : inputCount}
                onChange={(e) => setInputCount(Math.max(0, parseInt(e.target.value) || 0))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApply();
                }}
                className="flex-1 min-w-0 py-0.5 text-center bg-transparent text-white font-extrabold text-xs focus:outline-none border-x border-[#30303a]"
              />
              <button
                type="button"
                onClick={() => setInputCount((prev) => prev + 1)}
                className="w-6 py-0.5 text-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition font-black text-xs cursor-pointer shrink-0"
              >
                +
              </button>
            </div>

            {/* 빠른 입력 버튼 */}
            <div className="flex items-center gap-1 shrink-0">
              {[10, 20].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setInputCount((prev) => prev + val)}
                  className="px-1.5 py-0.5 rounded bg-[#22222a] hover:bg-[#2c2c36] text-[10px] font-semibold text-zinc-300 transition border border-[#2d2d38] cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>

            {/* 소탕 버튼 */}
            <button
              type="button"
              onClick={handleApply}
              disabled={inputCount <= 0}
              className="px-2.5 py-0.5 bg-white hover:bg-zinc-200 disabled:bg-[#25252e] disabled:text-zinc-600 text-black font-extrabold text-[11px] rounded transition shrink-0 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              <Check size={11} strokeWidth={3} /> 소탕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
