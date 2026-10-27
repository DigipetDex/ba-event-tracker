import React from 'react';
import { Users } from 'lucide-react';
import type { BonusStudent, Currency } from '../types';

interface BonusStudentSelectorProps {
  currencies: Currency[];
  bonusStudents: BonusStudent[];
  ownedStudentUids: string[];
  onToggleStudent: (studentUid: string) => void;
  onSelectAllStudents: (select: boolean) => void;
  onApplyRecruitedStudents?: () => void;
  bonusPercents: Record<string, number>;
  maxBonusesByCurrency: Record<string, number>;
}

export const BonusStudentSelector: React.FC<BonusStudentSelectorProps> = ({
  currencies,
  bonusStudents,
  ownedStudentUids,
  onToggleStudent,
  onSelectAllStudents,
  onApplyRecruitedStudents,
  bonusPercents,
  maxBonusesByCurrency,
}) => {
  return (
    <section id="bonus-students" className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 shadow-xs mb-6 scroll-mt-20">
      {/* 헤더: 학생 보너스 */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#27272a]">
        <div>
          <h2 className="text-base font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            학생 보너스
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">보너스 계산에 사용할 학생을 선택하세요 (재화 획득량 증가)</p>
        </div>
      </div>

      {/* 몰루로그 스타일 학생 카드 그리드 */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mb-4">
        {bonusStudents.map((student) => {
          const isOwned = ownedStudentUids.includes(student.studentUid);

          return (
            <div
              key={student.studentUid}
              onClick={() => onToggleStudent(student.studentUid)}
              className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all select-none border ${
                isOwned
                  ? 'border-white/80 shadow-xs ring-1 ring-white/40'
                  : 'border-[#27272a] hover:border-zinc-600'
              }`}
            >
              {/* 학생 포트레이트 이미지 */}
              <img
                src={student.imageUrl}
                alt={student.name}
                className={`w-full h-full object-cover transition duration-150 ${
                  isOwned
                    ? 'grayscale-0 opacity-100 group-hover:scale-105'
                    : 'grayscale opacity-30 contrast-125 group-hover:opacity-45'
                }`}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://assets.mollulog.net/assets/images/students/-1';
                }}
              />

              {/* 우측 상단 '모집' 뱃지 (보유 시) */}
              {isOwned && (
                <div className="absolute top-1 right-1 bg-black/80 backdrop-blur-xs text-[9px] font-bold text-zinc-100 px-1 py-0.2 rounded border border-white/20">
                  모집
                </div>
              )}

              {/* 하단 텍스트 오버레이 */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-3 pb-1 px-1">
                <div className="text-[10px] font-bold text-white text-center truncate leading-tight">
                  {student.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 바: 재화별 적용% / 최대% 요약 & 액션 버튼 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-[#27272a]">
        {/* 재화별 적용/최대 보너스 카드 */}
        <div className="flex flex-wrap items-center gap-2.5">
          {currencies.map((curr) => {
            const applied = bonusPercents[curr.id] || 0;
            const max = maxBonusesByCurrency[curr.id] || 100;

            return (
              <div
                key={curr.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#222226] border border-[#2d2d34]"
              >
                <img
                  src={curr.imageUrl}
                  alt={curr.name}
                  className="w-7 h-7 object-contain"
                />
                <div className="text-xs">
                  <div className="text-zinc-200 font-bold">
                    적용 : <span className="text-white font-extrabold">{applied}%</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    최대 : {max}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 우측 하단 버튼 (몰루로그 스타일: [모집한 학생 반영] [모두 선택] [초기화]) */}
        <div className="flex items-center gap-2 self-end md:self-center">
          {onApplyRecruitedStudents && (
            <button
              onClick={onApplyRecruitedStudents}
              className="px-3.5 py-1.5 rounded-lg bg-[#27272f] hover:bg-[#34343f] text-blue-400 border border-blue-500/40 text-xs font-bold transition shadow-xs cursor-pointer"
              title="내가 '모집한 학생' 목록에 등록한 학생들을 보너스에 즉시 자동 적용합니다"
            >
              모집한 학생 반영
            </button>
          )}
          <button
            onClick={() => onSelectAllStudents(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            모두 선택
          </button>
          <button
            onClick={() => onSelectAllStudents(false)}
            className="px-3.5 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#323238] text-zinc-300 text-xs font-semibold transition border border-zinc-700/60 cursor-pointer"
          >
            초기화
          </button>
        </div>
      </div>
    </section>
  );
};
