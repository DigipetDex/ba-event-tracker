import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown, Check, Search, Loader2, Globe, Tag } from 'lucide-react';
import { EVENT_INDEX, type EventSummary } from '../data/eventIndex';
import { formatRemaining, getActiveRun, getRuns, hasEventData, isEventLive } from '../data/liveEvent';

interface EventSelectorCardProps {
  currentEventUid: string;
  onSelectEvent: (uid: string) => void;
  isLoading?: boolean;
  totalRemainingSweeps?: number;
  totalRemainingAp?: number;
  currencies?: { id: string; name: string; imageUrl: string }[];
}

export const EventSelectorCard: React.FC<EventSelectorCardProps> = ({
  currentEventUid,
  onSelectEvent,
  isLoading = false,
  totalRemainingSweeps = 0,
  totalRemainingAp = 0,
  currencies = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // 남은 시간/진행 상태 갱신용 현재 시각 (1분마다)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentEvent = useMemo<EventSummary>(() => {
    return (
      EVENT_INDEX.find((e) => e.uid === currentEventUid) || {
        uid: currentEventUid,
        name: `이벤트 #${currentEventUid}`,
        period: '',
        startAt: null,
        endAt: null,
      }
    );
  }, [currentEventUid]);

  // 진행 상태: 진행 중(남은 시간) / 예정(시작까지) / 종료
  const activeRun = getActiveRun(currentEvent, now);
  const nextRun = getRuns(currentEvent)
    .filter((r) => Date.parse(r.startAt) > now)
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))[0];
  const status = activeRun
    ? { label: `진행 중 · ${formatRemaining(Date.parse(activeRun.endAt) - now)} 남음`, cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' }
    : nextRun
    ? { label: `예정 · ${formatRemaining(Date.parse(nextRun.startAt) - now)} 후 시작`, cls: 'bg-amber-500/15 text-amber-400 border-amber-500/40' }
    : { label: '종료', cls: 'bg-zinc-800 text-zinc-500 border-zinc-700' };
  // 진행 중일 때 남은 일수 기준 일 평균 필요 AP
  const remainingDays = activeRun ? Math.max(1, Math.ceil((Date.parse(activeRun.endAt) - now) / 86400000)) : 0;
  const dailyAp = remainingDays > 0 ? Math.ceil(totalRemainingAp / remainingDays) : 0;

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return EVENT_INDEX;
    return EVENT_INDEX.filter(
      (ev) =>
        ev.name.toLowerCase().includes(query) ||
        ev.uid.includes(query) ||
        ev.period.includes(query)
    );
  }, [searchQuery]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-5 sm:p-6 shadow-xs relative" ref={dropdownRef}>
      {/* 큼직한 상단 이벤트 선택 헤더 (유즈트렌드 스타일: 대형 타이틀 + 드롭다운 화살표) */}
      <div className="relative">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            if (!isOpen) setSearchQuery('');
            setIsOpen(!isOpen);
          }}
          className="w-full flex items-center justify-between text-left group transition cursor-pointer disabled:opacity-50 pb-4 border-b border-[#27272a]"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors truncate">
              {currentEvent.name}
            </h1>
            <span className="text-xs font-mono font-bold text-zinc-500 bg-[#222228] border border-[#2e2e38] px-2 py-0.5 rounded-md shrink-0">
              #{currentEvent.uid}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${status.cls}`}>
              {status.label}
            </span>
            {isLoading && (
              <span className="text-xs text-blue-400 flex items-center gap-1.5 shrink-0">
                <Loader2 size={14} className="animate-spin" /> 불러오는 중...
              </span>
            )}
          </div>

          <div className="w-9 h-9 rounded-xl bg-[#222228] border border-[#2e2e38] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-zinc-500 transition shrink-0 ml-3">
            <ChevronDown
              size={20}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`}
            />
          </div>
        </button>

        {/* 이벤트 드롭다운 팝업 (검색창 포함 & 100% 불투명 다크) */}
        {isOpen && (
          <div
            className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-zinc-600 shadow-2xl z-[9999] flex flex-col overflow-hidden"
            style={{
              backgroundColor: '#161619',
              boxShadow: '0 20px 30px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* 상단 검색창 */}
            <div className="p-3 border-b border-zinc-800 bg-[#121215]">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이벤트명 또는 번호(#859) 검색..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#1a1a1f] text-white border border-[#30303a] rounded-lg focus:outline-none focus:border-blue-500 placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* 목록 요약 헤더 */}
            <div className="px-3.5 py-2 border-b border-zinc-800/80 text-[11px] font-bold text-zinc-400 flex items-center justify-between bg-[#141418]">
              <span>한국 서버 이벤트 ({filteredEvents.length}개)</span>
              <span className="text-[10px] text-zinc-500 font-normal">최신순</span>
            </div>

            {/* 스크롤 리스트 */}
            <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-80">
              {filteredEvents.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">
                  검색 결과가 없습니다
                </div>
              ) : (
                filteredEvents.map((ev) => {
                  const isSelected = ev.uid === currentEvent.uid;
                  const isCurrentLive = isEventLive(ev);
                  const isAvailable = hasEventData(ev.uid);

                  return (
                    <button
                      key={ev.uid}
                      type="button"
                      disabled={!isAvailable}
                      title={isAvailable ? undefined : '스테이지/상점 데이터가 아직 없는 이벤트'}
                      onClick={() => {
                        onSelectEvent(ev.uid);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/40 cursor-pointer'
                          : isAvailable
                          ? 'text-zinc-300 hover:bg-[#202026] hover:text-white cursor-pointer'
                          : 'text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2 truncate font-semibold text-sm">
                          <span className="truncate">{ev.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono shrink-0">#{ev.uid}</span>
                          {isCurrentLive && (
                            <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/40 shrink-0 font-bold">
                              현재 진행
                            </span>
                          )}
                          {!isAvailable && (
                            <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700 shrink-0 font-bold">
                              데이터 없음
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {ev.period}
                        </div>
                      </div>

                      {isSelected && (
                        <Check size={16} className="text-blue-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 이벤트 상세 설명 & 일정 정보 & 기능 태그 & 남은 소탕/AP 수치 (유즈트렌드 스타일 동일 구현) */}
      <div className="pt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2 min-w-0">
          {/* 1. JP 일정 (유즈트렌드 스타일: 달력 아이콘 + JP + 전체 일시) */}
          {currentEvent.jpPeriod ? (
            <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
              <Calendar size={13} className="text-zinc-400 shrink-0" />
              <span className="font-bold text-zinc-300 w-6 shrink-0">JP</span>
              <span className="text-zinc-400">{currentEvent.jpPeriod}</span>
            </div>
          ) : null}

          {/* 2. GL 일정 (유즈트렌드 스타일: 지구본 아이콘 + GL + 전체 일시) */}
          <div className="flex items-center gap-2 text-xs text-zinc-200 font-medium">
            <Globe size={13} className="text-zinc-400 shrink-0" />
            <span className="font-bold text-zinc-200 w-6 shrink-0">GL</span>
            <span className="text-zinc-300">
              {currentEvent.glPeriod || currentEvent.period}
            </span>
          </div>

          {/* 3. 기능 태그 (유즈트렌드 스타일: 해당 이벤트의 실제 기능만 동적으로 표기) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Tag size={13} className="text-zinc-500 mr-0.5 shrink-0" />
            {(currentEvent.tags && currentEvent.tags.length > 0
              ? currentEvent.tags
              : ['스테이지', '미션', '상점']
            ).map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#27272e] hover:bg-[#30303a] text-zinc-300 border border-[#343442] transition"
              >
                {tag}
              </span>
            ))}

            {/* 재화 아이콘 목록 뱃지 */}
            {currencies.length > 0 && (
              <div className="flex items-center gap-1 ml-1.5 pl-2 border-l border-zinc-700/60">
                {currencies.map((c) => (
                  <img
                    key={c.id}
                    src={c.imageUrl}
                    alt={c.name}
                    title={c.name}
                    className="w-5 h-5 object-contain bg-[#1c1c24] p-0.5 rounded border border-[#2e2e3c]"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 남은 소탕 & 필요 AP 요약 위젯 */}
        <div className="flex items-center gap-4 bg-[#202026] px-5 py-2.5 rounded-xl border border-[#2d2d38] shrink-0 self-start lg:self-center shadow-inner">
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">총 남은 소탕</div>
            <div className="text-base sm:text-lg font-black text-white tracking-tight">
              {totalRemainingSweeps}회
            </div>
          </div>
          <div className="w-px h-7 bg-[#343442]" />
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">총 필요 AP</div>
            <div className="text-base sm:text-lg font-black text-blue-400 tracking-tight">
              {totalRemainingAp.toLocaleString()} AP
            </div>
            {dailyAp > 0 && (
              <div className="text-[10px] text-zinc-400 font-medium" title="남은 기간 동안 매일 써야 하는 AP (자연 회복 하루 약 240)">
                하루 {dailyAp.toLocaleString()} AP · {remainingDays}일
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
