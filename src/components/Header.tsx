import React from 'react';
import { RotateCcw, ShieldCheck, RefreshCw, Database } from 'lucide-react';

interface HeaderProps {
  eventName: string;
  onResetAll: () => void;
  currentTab: 'event' | 'students' | 'lobby';
  onSelectTab: (tab: 'event' | 'students' | 'lobby') => void;
  isSyncing?: boolean;
  studentCount?: number;
  onSync?: () => void;
  onOpenBackupModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  eventName,
  onResetAll,
  currentTab,
  onSelectTab,
  isSyncing,
  studentCount,
  onSync,
  onOpenBackupModal,
}) => {
  return (
    <header className="bg-[#18181b] border-b border-[#27272a] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
              BA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-zinc-100 tracking-tight">
                  블루 아카이브 플래너
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-xs sm:max-w-sm">
                {currentTab === 'event'
                  ? eventName
                  : currentTab === 'students'
                  ? '모집한 학생 관리'
                  : 'PC 클라이언트 로비 캐릭터 선택기'}
              </p>
            </div>
          </div>

          {/* 메인 메뉴 탭: 이벤트 상점 계산기 / 모집한 학생 / 로비 캐릭터 선택기 */}
          <nav className="flex items-center bg-[#121214] p-1 rounded-xl border border-[#2a2a34]">
            <button
              type="button"
              onClick={() => onSelectTab('event')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentTab === 'event'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              이벤트 상점 계산기
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('students')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentTab === 'students'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              모집한 학생
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('lobby')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentTab === 'lobby'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              로비 캐릭터 선택기
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {/* 실시간 데이터 갱신 버튼 */}
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-[#202028] hover:bg-[#2a2a36] text-zinc-300 hover:text-white font-medium transition border border-[#343444] cursor-pointer disabled:opacity-50 shadow-xs"
            title="SchaleDB로부터 최신 학생 데이터 실시간 갱신"
          >
            <RefreshCw
              size={12}
              className={`transition ${isSyncing ? 'animate-spin text-blue-400' : 'text-blue-400'}`}
            />
            <span className="hidden sm:inline">
              {isSyncing ? '동기화 중...' : studentCount ? `학생 ${studentCount}명` : '데이터 갱신'}
            </span>
          </button>

          {/* 데이터 백업/복원 버튼 */}
          <button
            type="button"
            onClick={onOpenBackupModal}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-[#202028] hover:bg-[#2a2a36] text-zinc-300 hover:text-white font-medium transition border border-[#343444] cursor-pointer shadow-xs"
            title="서버(localhost) ↔ 로컬 파일(file://) 데이터 백업 및 복원"
          >
            <Database size={12} className="text-amber-400" />
            <span className="hidden sm:inline">데이터 백업/복원</span>
          </button>

          <span className="text-xs text-zinc-400 hidden lg:flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-500" /> 로컬 자동 저장
          </span>
          {currentTab === 'event' && (
            <button
              onClick={onResetAll}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition border border-zinc-700/60 cursor-pointer"
            >
              <RotateCcw size={12} /> 초기화
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
