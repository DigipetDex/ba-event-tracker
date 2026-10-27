import { EVENT_INDEX, type EventSummary } from './eventIndex';
import allEventsMap from './allEventsMap.json';

// 스테이지/상점 상세 데이터가 내장된 이벤트인지
export function hasEventData(uid: string): boolean {
  return Object.prototype.hasOwnProperty.call(allEventsMap, uid);
}

type Run = NonNullable<EventSummary['runs']>[number];

// 이벤트의 모든 회차(최초 + 복각). runs 없으면 startAt/endAt 단일 회차로 취급
function getRuns(ev: EventSummary): Run[] {
  if (ev.runs && ev.runs.length > 0) return ev.runs;
  return ev.startAt && ev.endAt ? [{ type: 'first', startAt: ev.startAt, endAt: ev.endAt }] : [];
}

// 현재 시각에 진행 중인 회차 (없으면 undefined)
export function getActiveRun(ev: EventSummary, now = Date.now()): Run | undefined {
  return getRuns(ev).find((r) => Date.parse(r.startAt) <= now && now < Date.parse(r.endAt));
}

export function isEventLive(ev: EventSummary, now = Date.now()): boolean {
  return !!getActiveRun(ev, now);
}

// 현재 진행 중인 이벤트 UID: 진행 회차의 시작이 가장 늦은 이벤트, 없으면 이미 시작한 최신 이벤트
export function getLiveEventUid(now = Date.now()): string {
  let best: { uid: string; start: number } | undefined;
  for (const ev of EVENT_INDEX) {
    if (!hasEventData(ev.uid)) continue;
    const run = getActiveRun(ev, now);
    if (run && (!best || Date.parse(run.startAt) > best.start)) {
      best = { uid: ev.uid, start: Date.parse(run.startAt) };
    }
  }
  if (best) return best.uid;
  const withData = EVENT_INDEX.filter((ev) => hasEventData(ev.uid));
  const started = withData.filter((ev) => ev.startAt && Date.parse(ev.startAt) <= now);
  return (started[0] ?? withData[0] ?? EVENT_INDEX[0]).uid;
}

export const LIVE_EVENT_UID = getLiveEventUid();

// 초기 선택 UID: 진행 이벤트가 바뀌었으면(새 이벤트/복각 시작) 자동으로 그쪽 선택, 아니면 저장된 선택 유지
export function resolveInitialEventUid(): string {
  try {
    const lastLive = localStorage.getItem('ba_last_live_uid');
    if (lastLive !== LIVE_EVENT_UID) {
      localStorage.setItem('ba_last_live_uid', LIVE_EVENT_UID);
      localStorage.setItem('ba_selected_event_uid', LIVE_EVENT_UID);
      return LIVE_EVENT_UID;
    }
    const saved = localStorage.getItem('ba_selected_event_uid');
    return saved && hasEventData(saved) ? saved : LIVE_EVENT_UID;
  } catch {
    return LIVE_EVENT_UID;
  }
}
