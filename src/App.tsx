import { useState, useEffect } from 'react';
import { hasEventData, LIVE_EVENT_UID, resolveInitialEventUid } from './data/liveEvent';
import { bonusDropAmount } from './utils/bonus';
import { planSweeps } from './utils/sweepPlan';
import allEventsMapRaw from './data/allEventsMap.json';
import type { EventData, UserEventProgress } from './types';
import { Header } from './components/Header';
import { StageSweepPlanCard } from './components/StageSweepPlanCard';
import { BonusStudentSelector } from './components/BonusStudentSelector';
import { ShopSelector } from './components/ShopSelector';
import { EventSelectorCard } from './components/EventSelectorCard';
import { StudentManager, type StudentProfile } from './components/StudentManager';
import { LobbySelector } from './components/LobbySelector';
import { DataBackupModal } from './components/DataBackupModal';
import { getInitialStudents, syncStudentsFromRemote } from './services/studentSync';
import { Coins, CheckCircle2 } from 'lucide-react';

const ALL_EVENTS_MAP = allEventsMapRaw as unknown as Record<string, EventData>;
// 저장된/선택 UID에 데이터가 없을 때 쓰는 기본 이벤트 (진행 중 이벤트)
const FALLBACK_EVENT = ALL_EVENTS_MAP[LIVE_EVENT_UID];

// 보유 학생 목록 기반 재화별 최대 보너스율 계산 (스트라이커 상위 4명 + 스페셜 상위 2명 = 최대 6명 파티)
function calculateAutoBonuses(
  event: EventData,
  ownedStudentUids: string[]
): Record<string, number> {
  const bonusesByCurrency: Record<string, { strikers: number[]; specials: number[] }> = {};
  event.currencies.forEach((c) => {
    bonusesByCurrency[c.id] = { strikers: [], specials: [] };
  });

  event.bonusStudents.forEach((student) => {
    if (ownedStudentUids.includes(student.studentUid)) {
      const isSpecial = student.role?.toLowerCase() === 'special';
      student.bonuses.forEach((b) => {
        if (bonusesByCurrency[b.currencyId]) {
          if (isSpecial) {
            bonusesByCurrency[b.currencyId].specials.push(b.percentage);
          } else {
            bonusesByCurrency[b.currencyId].strikers.push(b.percentage);
          }
        }
      });
    }
  });

  const result: Record<string, number> = {};
  Object.keys(bonusesByCurrency).forEach((currId) => {
    const topStrikers = bonusesByCurrency[currId].strikers.sort((a, b) => b - a).slice(0, 4);
    const strikerSum = topStrikers.reduce((acc, val) => acc + val, 0);

    const topSpecials = bonusesByCurrency[currId].specials.sort((a, b) => b - a).slice(0, 2);
    const specialSum = topSpecials.reduce((acc, val) => acc + val, 0);

    result[currId] = Math.round((strikerSum + specialSum) * 100);
  });

  return result;
}

// 이벤트 전체 학생 기준 이론상 최대 보너스율
function calculateMaxPossibleBonuses(event: EventData): Record<string, number> {
  const allStudentUids = event.bonusStudents.map((s) => s.studentUid);
  return calculateAutoBonuses(event, allStudentUids);
}

// 특정 이벤트의 기본 프로그레스 상태 생성 (모집한 학생 목록 기반 자동 반영)
function getDefaultProgressForEvent(ev: EventData, recruitedStudentIds?: number[]): UserEventProgress {
  let recruitedIds = recruitedStudentIds;
  if (!recruitedIds) {
    try {
      const saved = localStorage.getItem('ba_recruited_students');
      if (saved) recruitedIds = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }

  const recruitedSet = new Set((recruitedIds || []).map(String));
  // 모집한 학생이 등록되어 있으면 해당 학생들만 기본 반영, 없으면 이벤트 전체 학생 기본 반영
  const defaultOwnedStudents = (recruitedIds && recruitedIds.length > 0)
    ? ev.bonusStudents.filter((s) => recruitedSet.has(s.studentUid)).map((s) => s.studentUid)
    : ev.bonusStudents.map((s) => s.studentUid);

  const initialBonuses = calculateAutoBonuses(ev, defaultOwnedStudents);

  const initialPurchases: Record<string, number> = {};
  ev.shopItems.forEach((item, index) => {
    if (index < 20 && item.maxQuantity !== null) {
      initialPurchases[item.id] = item.maxQuantity;
    }
  });

  const initialActiveStages: Record<number, boolean> = {};
  const maxStageNum = Math.max(...ev.stages.map((s) => s.number), 0);
  ev.stages.forEach((st) => {
    initialActiveStages[st.number] = st.number >= Math.max(1, maxStageNum - 3);
  });

  const initialClearedSweeps: Record<number, number> = {};
  ev.stages.forEach((st) => {
    initialClearedSweeps[st.number] = 0;
  });

  const initialOwnedCurrencies: Record<string, number> = {};
  ev.currencies.forEach((c) => {
    initialOwnedCurrencies[c.id] = 0;
  });

  return {
    itemPurchases: initialPurchases,
    ownedStudentUids: defaultOwnedStudents,
    bonusPercents: initialBonuses,
    ownedCurrencies: initialOwnedCurrencies,
    clearedSweeps: initialClearedSweeps,
    activeStages: initialActiveStages,
  };
}

// 로컬스토리지에서 특정 이벤트의 프로그레스 복원 (없으면 기본값)
function loadProgressForEvent(ev: EventData, recruitedStudentIds?: number[]): UserEventProgress {
  try {
    const key = `ba_event_tracker_progress_${ev.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      const defaults = getDefaultProgressForEvent(ev, recruitedStudentIds);
      return {
        ...defaults,
        ...parsed,
        ownedCurrencies: {
          ...defaults.ownedCurrencies,
          ...(parsed.ownedCurrencies || {}),
        },
      };
    }
  } catch (e) {
    console.error('Failed to load progress for event', ev.id, e);
  }
  return getDefaultProgressForEvent(ev, recruitedStudentIds);
}

export function App() {
  // 현재 메인 탭 ('event' | 'students' | 'lobby')
  const [currentTab, setCurrentTab] = useState<'event' | 'students' | 'lobby'>('event');

  // 전체 학생 목록 (SchaleDB 실시간 동기화 지원, 오프라인 시 로컬 캐시/내장 데이터 사용)
  const [students, setStudents] = useState<StudentProfile[]>(getInitialStudents);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  // 실시간 학생 데이터 수동/자동 갱신 함수
  const handleSyncData = async () => {
    try {
      setIsSyncing(true);
      const res = await syncStudentsFromRemote();
      if (res.updated) {
        setStudents(res.students);
        setSyncToast(`SchaleDB 최신 데이터 동기화 완료! (학생 ${res.count}명)`);
      } else {
        setSyncToast(`최신 데이터 유지 중 (학생 ${res.count}명)`);
      }
      setTimeout(() => setSyncToast(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // 브라우저 최초 마운트 시 백그라운드 자동 동기화 실행
  useEffect(() => {
    syncStudentsFromRemote().then((res) => {
      if (res.updated) {
        setStudents(res.students);
      }
    });
  }, []);

  // 전체 모집(보유) 학생 ID 목록 (StudentManager와 공유)
  const [recruitedStudentIds, setRecruitedStudentIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('ba_recruited_students');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // 전체 메모리얼 획득 학생 ID 목록 (StudentManager 및 LobbySelector와 공유)
  const [memorialStudentIds, setMemorialStudentIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('ba_memorial_students');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // 메모리얼 학생 목록 로컬스토리지 자동 저장
  useEffect(() => {
    try {
      localStorage.setItem('ba_memorial_students', JSON.stringify(memorialStudentIds));
    } catch (e) {
      console.error('Failed to save memorial students', e);
    }
  }, [memorialStudentIds]);

  // 선택된 이벤트 UID (로컬스토리지 복원, 진행 이벤트가 바뀌면 자동 전환)
  const [selectedEventUid, setSelectedEventUid] = useState<string>(resolveInitialEventUid);

  // 이벤트 전체 데이터 (내장된 전체 이벤트 맵에서 즉시 로드)
  const [eventData, setEventData] = useState<EventData>(() => {
    const savedUid = selectedEventUid;
    return ALL_EVENTS_MAP[savedUid] || FALLBACK_EVENT;
  });


  // 현재 이벤트 진행 상태
  const [progress, setProgress] = useState<UserEventProgress>(() => {
    const savedUid = selectedEventUid;
    const initialEv = ALL_EVENTS_MAP[savedUid] || FALLBACK_EVENT;
    return loadProgressForEvent(initialEv);
  });

  // '모집한 학생' 목록이 기본값으로 학생 보너스에 실시간 자동 반영
  useEffect(() => {
    if (!eventData?.bonusStudents) return;
    const recruitedUidStrings = new Set(recruitedStudentIds.map(String));
    const matchedUids = eventData.bonusStudents
      .filter((s) => recruitedUidStrings.has(s.studentUid))
      .map((s) => s.studentUid);

    setProgress((prev) => {
      // 이미 일치하면 불필요한 상태 갱신 방지
      const prevSet = new Set(prev.ownedStudentUids);
      if (
        matchedUids.length === prev.ownedStudentUids.length &&
        matchedUids.every((uid) => prevSet.has(uid))
      ) {
        return prev;
      }
      const autoBonuses = calculateAutoBonuses(eventData, matchedUids);
      return {
        ...prev,
        ownedStudentUids: matchedUids,
        bonusPercents: autoBonuses,
      };
    });
  }, [recruitedStudentIds, eventData]);

  // 프로그레스 자동 저장
  useEffect(() => {
    if (eventData?.id) {
      const key = `ba_event_tracker_progress_${eventData.id}`;
      try {
        localStorage.setItem(key, JSON.stringify(progress));
      } catch (e) {
        console.error('Failed to save progress', e);
      }
    }
  }, [progress, eventData?.id]);

  // 이벤트 변경 처리 함수
  const handleSelectEvent = (uid: string) => {
    if (!hasEventData(uid)) return; // 데이터 없는 이벤트는 선택 불가
    setSelectedEventUid(uid);
    try {
      localStorage.setItem('ba_selected_event_uid', uid);
    } catch (e) {
      console.error(e);
    }

    // 모든 이벤트 데이터는 번들에 내장 (hasEventData 통과 시 항상 존재)
    const data = ALL_EVENTS_MAP[uid];
    setEventData(data);
    setProgress(loadProgressForEvent(data, recruitedStudentIds));
  };

  const event = eventData;
  const maxPossibleBonuses = calculateMaxPossibleBonuses(event);

  // 학생 토글 (학생 보너스 카드에서 클릭 시)
  const handleToggleStudent = (studentUid: string) => {
    const numId = parseInt(studentUid, 10);
    setProgress((prev) => {
      const exists = prev.ownedStudentUids.includes(studentUid);
      const nextOwned = exists
        ? prev.ownedStudentUids.filter((id) => id !== studentUid)
        : [...prev.ownedStudentUids, studentUid];

      const autoBonuses = calculateAutoBonuses(event, nextOwned);
      return {
        ...prev,
        ownedStudentUids: nextOwned,
        bonusPercents: autoBonuses,
      };
    });

    // 모집한 학생(StudentManager) 목록에도 동기화
    if (!isNaN(numId)) {
      setRecruitedStudentIds((prev) =>
        prev.includes(numId) ? prev.filter((id) => id !== numId) : [...prev, numId]
      );
    }
  };

  // '모집한 학생' 목록을 현재 이벤트의 학생 보너스에 일괄 반영
  const handleApplyRecruitedStudents = () => {
    const recruitedUidStrings = new Set(recruitedStudentIds.map(String));
    const matchedUids = event.bonusStudents
      .filter((s) => recruitedUidStrings.has(s.studentUid))
      .map((s) => s.studentUid);

    setProgress((prev) => {
      const autoBonuses = calculateAutoBonuses(event, matchedUids);
      return {
        ...prev,
        ownedStudentUids: matchedUids,
        bonusPercents: autoBonuses,
      };
    });
  };

  // 학생 전체 선택 / 해제
  const handleSelectAllStudents = (select: boolean) => {
    setProgress((prev) => {
      const nextOwned = select ? event.bonusStudents.map((s) => s.studentUid) : [];
      const autoBonuses = calculateAutoBonuses(event, nextOwned);
      return {
        ...prev,
        ownedStudentUids: nextOwned,
        bonusPercents: autoBonuses,
      };
    });
  };

  // 상점 아이템 수량 변경
  const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
    setProgress((prev) => ({
      ...prev,
      itemPurchases: {
        ...prev.itemPurchases,
        [itemId]: quantity,
      },
    }));
  };

  // 재화 상점 전체 선택 / 초기화
  const handleSelectAllForCurrency = (currencyId: string, select: boolean) => {
    setProgress((prev) => {
      const nextPurchases = { ...prev.itemPurchases };
      const items = event.shopItems.filter((i) => i.currencyId === currencyId);
      items.forEach((item) => {
        nextPurchases[item.id] = select ? (item.maxQuantity ?? 0) : 0;
      });
      return {
        ...prev,
        itemPurchases: nextPurchases,
      };
    });
  };

  // 보유 재화 업데이트
  const handleUpdateOwned = (currencyId: string, amount: number) => {
    setProgress((prev) => ({
      ...prev,
      ownedCurrencies: {
        ...prev.ownedCurrencies,
        [currencyId]: amount,
      },
    }));
  };

  // 스테이지 활성화 토글 (ON/OFF)
  const handleToggleStageActive = (stageNumber: number, active: boolean) => {
    setProgress((prev) => ({
      ...prev,
      activeStages: {
        ...prev.activeStages,
        [stageNumber]: active,
      },
    }));
  };

  // 핵심 소탕 차감 함수: 이번에 돈 횟수만큼 누적 차감
  const handleApplyDeduction = (stageNumber: number, count: number) => {
    setProgress((prev) => {
      const current = prev.clearedSweeps[stageNumber] || 0;
      const stage = event.stages.find((st) => st.number === stageNumber);

      // 소탕 1회당 드롭(+학생 보너스)을 보유량에 가산
      const gains: Record<string, number> = { ...(prev.sweepGains?.[stageNumber] || {}) };
      const owned = { ...prev.ownedCurrencies };
      stage?.drops.forEach((d) => {
        if (!event.currencies.some((c) => c.id === d.resourceUid)) return;
        const perRun =
          d.amount + (d.isEventCurrency ? bonusDropAmount(d.amount, prev.bonusPercents[d.resourceUid] || 0) : 0);
        owned[d.resourceUid] = (owned[d.resourceUid] || 0) + perRun * count;
        gains[d.resourceUid] = (gains[d.resourceUid] || 0) + perRun * count;
      });

      return {
        ...prev,
        ownedCurrencies: owned,
        sweepGains: { ...prev.sweepGains, [stageNumber]: gains },
        clearedSweeps: {
          ...prev.clearedSweeps,
          [stageNumber]: current + count,
        },
      };
    });
  };

  // 특정 스테이지 차감 횟수 초기화
  const handleResetDeduction = (stageNumber: number) => {
    setProgress((prev) => {
      // 이 스테이지 소탕으로 가산했던 보유량 되돌리기
      const owned = { ...prev.ownedCurrencies };
      Object.entries(prev.sweepGains?.[stageNumber] || {}).forEach(([cid, amt]) => {
        owned[cid] = Math.max(0, (owned[cid] || 0) - amt);
      });
      return {
      ...prev,
      ownedCurrencies: owned,
      sweepGains: { ...prev.sweepGains, [stageNumber]: {} },
      clearedSweeps: {
        ...prev.clearedSweeps,
        [stageNumber]: 0,
      },
    };
    });
  };

  // 복각 이벤트: 원본 이벤트의 상점 구매 계획을 이름 기준으로 복사 (복각은 상점 ID/가격이 달라짐)
  const originalEventUid = event.id.endsWith('_rerun') ? event.id.replace(/_rerun$/, '') : null;
  const handleCopyOriginalPlan = () => {
    if (!originalEventUid) return;
    const original = ALL_EVENTS_MAP[originalEventUid];
    let originalPurchases: Record<string, number> | null = null;
    try {
      const saved = localStorage.getItem(`ba_event_tracker_progress_${originalEventUid}`);
      if (saved) originalPurchases = JSON.parse(saved).itemPurchases || null;
    } catch (e) {
      console.error(e);
    }
    if (!original || !originalPurchases) {
      alert('원본 이벤트에 저장된 구매 계획이 없습니다.');
      return;
    }
    // 같은 이름이 여러 개면 등장 순서대로 대응
    const queues: Record<string, number[]> = {};
    original.shopItems.forEach((it) => {
      (queues[it.name] ||= []).push(originalPurchases![it.id] || 0);
    });
    const next: Record<string, number> = {};
    let matched = 0;
    event.shopItems.forEach((it) => {
      const q = queues[it.name]?.shift();
      if (q === undefined) return;
      matched++;
      next[it.id] = it.maxQuantity !== null ? Math.min(q, it.maxQuantity) : q;
    });
    if (!confirm(`원본 이벤트 구매 계획에서 ${matched}/${event.shopItems.length}개 품목을 복사할까요? (현재 구매 계획은 덮어씁니다)`)) return;
    setProgress((prev) => ({ ...prev, itemPurchases: next }));
  };

  // 전체 초기화
  const handleResetAll = () => {
    if (confirm(`'${event.name}' 이벤트의 모든 구매 목록, 보너스, 소탕 진행 상태를 초기화할까요?`)) {
      setProgress(getDefaultProgressForEvent(event, recruitedStudentIds));
    }
  };

  // --- 필요 재화 및 스테이지별 추천 소탕 수 계산 (완전 동적 계산) ---
  const currencyTotalRequirements: Record<string, number> = {};
  const currencyNetRequirements: Record<string, number> = {};
  event.currencies.forEach((curr) => {
    const totalRequired = event.shopItems
      .filter((item) => item.currencyId === curr.id)
      .reduce((sum, item) => sum + (progress.itemPurchases[item.id] || 0) * item.unitPrice, 0);
    // 소탕으로 가산된 보유량은 제외한 기준 보유량 (소탕 차감과 이중 계산 방지)
    const sweptGain = Object.values(progress.sweepGains || {}).reduce((sum, g) => sum + (g[curr.id] || 0), 0);
    const owned = Math.max(0, (progress.ownedCurrencies[curr.id] || 0) - sweptGain);
    currencyTotalRequirements[curr.id] = totalRequired;
    currencyNetRequirements[curr.id] = Math.max(0, totalRequired - owned);
  });

  // 스테이지별 추천 소탕 횟수 산출 (한 스테이지가 여러 재화를 함께 주는 것까지 고려)
  // 활성화된 스테이지 후보 (모두 꺼져있으면 전체 스테이지 대상)
  const activeCandidates = event.stages.filter((st) => progress.activeStages[st.number] !== false);
  const sweepPool = activeCandidates.length > 0 ? activeCandidates : event.stages;
  const sweepPlan = planSweeps(
    sweepPool.map((st) => {
      const yields: Record<string, number> = {};
      st.drops.forEach((d) => {
        if (!event.currencies.some((c) => c.id === d.resourceUid) || d.amount <= 0) return;
        const bonus = d.isEventCurrency ? bonusDropAmount(d.amount, progress.bonusPercents[d.resourceUid] || 0) : 0;
        yields[d.resourceUid] = (yields[d.resourceUid] || 0) + d.amount + bonus;
      });
      return { number: st.number, apCost: st.apCost, yields };
    }),
    currencyNetRequirements
  );
  const stageInitialRecommendedSweeps: Record<number, number> = {};
  event.stages.forEach((st) => {
    stageInitialRecommendedSweeps[st.number] = sweepPlan.sweeps[st.number] || 0;
  });
  // 필요량이 남았지만 활성 스테이지에서 드롭되지 않는 재화 (미니게임 등 다른 경로로 획득)
  const unfarmableCurrencyIds = new Set(sweepPlan.unfarmable);

  // 전체 통계 집계 (무채색 통일)
  let totalRemainingSweepsAll = 0;
  let totalRemainingApAll = 0;

  const maxStageNum = Math.max(...event.stages.map((s) => s.number), 0);
  event.stages.forEach((st) => {
    const isActive = progress.activeStages[st.number] ?? (st.number >= Math.max(1, maxStageNum - 3));
    const initialRecommended = stageInitialRecommendedSweeps[st.number] || 0;
    const deducted = progress.clearedSweeps[st.number] || 0;
    const remaining = Math.max(0, initialRecommended - deducted);

    if (isActive && initialRecommended > 0) {
      totalRemainingSweepsAll += remaining;
      totalRemainingApAll += remaining * st.apCost;
    }
  });

  // 이벤트 전체 재화 목록 (보유 재화 카드용: 상점 교환 재화 + 가챠/추첨 재화 전체 표시)
  const displayCurrencies = event.currencies;

  return (
    <div className="min-h-screen bg-[#121214] text-zinc-100 pb-20 selection:bg-zinc-700 selection:text-white">
      <Header
        eventName={event.name}
        onResetAll={handleResetAll}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isSyncing={isSyncing}
        studentCount={students.length}
        onSync={handleSyncData}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* 데이터 백업/복원 모달 (서버 ↔ HTML 파일 연동) */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={() => {
          setIsBackupModalOpen(false);
          // 복원된 데이터 로컬스토리지에서 즉시 다시 불러오기
          try {
            const rec = localStorage.getItem('ba_recruited_students');
            if (rec) setRecruitedStudentIds(JSON.parse(rec));
            const mem = localStorage.getItem('ba_memorial_students');
            if (mem) setMemorialStudentIds(JSON.parse(mem));
            setStudents(getInitialStudents());
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {/* 실시간 동기화 완료 알림 토스트 */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xl border border-blue-400 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} />
          <span>{syncToast}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {currentTab === 'students' ? (
          /* 몰루로그 스타일 모집한 학생 관리 화면 */
          <StudentManager
            students={students}
            recruitedIds={recruitedStudentIds}
            onToggleRecruited={(id) => {
              setRecruitedStudentIds((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
              );
            }}
            onSetRecruitedIds={setRecruitedStudentIds}
            memorialIds={memorialStudentIds}
            onToggleMemorial={(id) => {
              setMemorialStudentIds((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
              );
            }}
            onSetMemorialIds={setMemorialStudentIds}
          />
        ) : currentTab === 'lobby' ? (
          /* PC 클라이언트 로비 캐릭터 선택기 (utnapisht.im/tools/lobby 기능 통합) */
          <LobbySelector
            students={students}
            recruitedIds={recruitedStudentIds}
            memorialIds={memorialStudentIds}
          />
        ) : (
          /* 이벤트 상점 및 소탕 플래너 화면 */
          <>
            {/* 이벤트 선택 및 일정/설명 안내 카드 (남은 소탕 및 필요 AP 통합) */}
            <EventSelectorCard
              currentEventUid={event.id}
              onSelectEvent={handleSelectEvent}
              totalRemainingSweeps={totalRemainingSweepsAll}
              totalRemainingAp={totalRemainingApAll}
              currencies={event.currencies}
            />

            {/* 현재 보유 중인 재화 섹션 */}
            <section className="bg-[#18181b] rounded-2xl border border-[#27272a] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#27272a]">
                <div>
                  <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Coins size={16} className="text-zinc-300" /> 현재 보유 중인 이벤트 재화
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    현재 인게임에서 보유하고 있는 개수를 입력하면 필요한 소탕 횟수가 자동으로 차감 계산됩니다
                  </p>
                </div>
              </div>

              {/* 재화 보유량 그리드 */}
              <div
                className={`grid gap-3 ${
                  displayCurrencies.length >= 4
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                    : displayCurrencies.length === 3
                    ? 'grid-cols-1 sm:grid-cols-3'
                    : displayCurrencies.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1'
                }`}
              >
                {displayCurrencies.map((curr) => {
                  const currentVal = progress.ownedCurrencies[curr.id] || 0;
                  const neededTotal = currencyTotalRequirements[curr.id] || 0;

                  return (
                    <div
                      key={curr.id}
                      className="bg-[#1f1f24] border border-[#2d2d36] rounded-xl p-3 flex flex-col justify-between gap-2.5 shadow-xs"
                    >
                      {/* 상단: 재화 아이콘 + 이름 (줄바꿈 허용으로 짤림 방지) + 필요 수량 */}
                      <div className="flex items-start gap-2.5">
                        <img
                          src={curr.imageUrl}
                          alt={curr.name}
                          className="w-10 h-10 object-contain bg-[#17171a] p-1 rounded-lg border border-[#2c2c36] shrink-0 mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className="text-xs font-bold text-white leading-snug break-keep"
                            title={curr.name}
                          >
                            {curr.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-1 whitespace-nowrap">
                            {neededTotal > 0 ? (
                              <>
                                구매 필요: <span className="font-semibold text-zinc-200">{neededTotal.toLocaleString()}개</span>
                              </>
                            ) : (
                              <span className="text-zinc-500">추첨/이벤트 재화</span>
                            )}
                          </div>
                          {unfarmableCurrencyIds.has(curr.id) && (
                            <div
                              className="text-[10px] text-amber-400 mt-1 leading-snug"
                              title="활성화된 스테이지에서 드롭되지 않아 소탕 계획에 포함되지 않습니다"
                            >
                              스테이지 미드롭 · 미니게임 등으로 {(currencyNetRequirements[curr.id] || 0).toLocaleString()}개 더 필요
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 하단: 보유 개수 입력창 바 */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#2a2a34]/70 text-xs text-zinc-400">
                        <span className="font-medium whitespace-nowrap">현재 보유량:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="99999"
                            placeholder="0"
                            value={currentVal === 0 ? '' : currentVal}
                            onChange={(e) => {
                              const val = e.target.value.slice(0, 5);
                              handleUpdateOwned(curr.id, Math.min(99999, Math.max(0, parseInt(val) || 0)));
                            }}
                            className="w-16 px-2 py-1 text-right font-black text-xs bg-[#121214] text-white border border-[#3b3b48] rounded-lg focus:outline-none focus:border-blue-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="whitespace-nowrap">개</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 1. 스테이지 소탕 계획 */}
            <section className="bg-[#18181b] rounded-2xl border border-[#27272a] p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#27272a]">
                <div>
                  <h2 className="text-base font-bold text-zinc-100 tracking-tight">스테이지 소탕 계획</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    완료한 소탕 횟수를 입력하고 <strong>[소탕 차감]</strong>을 누르면 필요 소탕 횟수가 줄어듭니다
                  </p>
                </div>
                <div className="text-xs text-zinc-400">
                  스테이지 수: <strong className="text-white">{event.stages.length}</strong>개
                </div>
              </div>

              {/* 전 스테이지 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {event.stages.map((st) => {
                  const isActive = progress.activeStages[st.number] ?? (st.number >= Math.max(1, maxStageNum - 3));
                  const initialRecommended = stageInitialRecommendedSweeps[st.number] || 0;
                  const deducted = progress.clearedSweeps[st.number] || 0;
                  const remaining = Math.max(0, initialRecommended - deducted);

                  return (
                    <StageSweepPlanCard
                      key={st.number}
                      stage={st}
                      bonusPercents={progress.bonusPercents}
                      isActive={isActive}
                      onToggleActive={(active) => handleToggleStageActive(st.number, active)}
                      remainingSweeps={remaining}
                      initialCalculatedSweeps={initialRecommended}
                      deductedSweeps={deducted}
                      onApplyDeduction={(count) => handleApplyDeduction(st.number, count)}
                      onResetDeduction={() => handleResetDeduction(st.number)}
                    />
                  );
                })}
              </div>
            </section>

            {/* 2. 학생 보너스 */}
            <BonusStudentSelector
              currencies={event.currencies}
              bonusStudents={event.bonusStudents}
              ownedStudentUids={progress.ownedStudentUids}
              onToggleStudent={handleToggleStudent}
              onSelectAllStudents={handleSelectAllStudents}
              onApplyRecruitedStudents={handleApplyRecruitedStudents}
              bonusPercents={progress.bonusPercents}
              maxBonusesByCurrency={maxPossibleBonuses}
            />

            {/* 3. 상점 아이템 */}
            {originalEventUid && (
              <div className="flex justify-end -mb-2">
                <button
                  type="button"
                  onClick={handleCopyOriginalPlan}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#22222a] hover:bg-[#2c2c36] text-zinc-300 border border-[#2d2d38] transition cursor-pointer"
                >
                  원본 이벤트 구매 계획 불러오기
                </button>
              </div>
            )}
            <ShopSelector
              currencies={event.currencies}
              shopItems={event.shopItems}
              itemPurchases={progress.itemPurchases}
              onUpdateQuantity={handleUpdateItemQuantity}
              onSelectAllForCurrency={handleSelectAllForCurrency}
              requiredCurrencyTotals={currencyTotalRequirements}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
