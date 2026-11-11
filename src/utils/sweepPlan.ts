// 여러 재화를 동시에 주는 스테이지를 고려한 소탕 계획 (AP 최소화 근사: greedy + 축소 패스)

export interface SweepStage {
  number: number;
  apCost: number;
  yields: Record<string, number>; // currencyId -> 1회 소탕 획득량 (보너스 포함)
}

export interface SweepPlan {
  sweeps: Record<number, number>; // stageNumber -> 소탕 횟수
  unfarmable: string[]; // 필요량이 남았지만 후보 스테이지에서 드롭되지 않는 재화
}

export function planSweeps(stages: SweepStage[], need: Record<string, number>): SweepPlan {
  const sweeps: Record<number, number> = {};
  const targets = Object.keys(need).filter((cid) => need[cid] > 0);
  const unfarmable = targets.filter((cid) => !stages.some((st) => (st.yields[cid] || 0) > 0));
  const farmable = targets.filter((cid) => !unfarmable.includes(cid));

  // 1) greedy: 남은 필요량 기준 AP당 유효 획득량이 가장 큰 스테이지를 골라, 한 재화가 채워질 때까지 소탕
  const rem: Record<string, number> = {};
  farmable.forEach((cid) => (rem[cid] = need[cid]));
  for (let guard = 0; guard < 1000; guard++) {
    const open = farmable.filter((cid) => rem[cid] > 0);
    if (open.length === 0) break;

    let best: SweepStage | null = null;
    let bestValue = 0;
    for (const st of stages) {
      const useful = open.reduce((sum, cid) => sum + Math.min(st.yields[cid] || 0, rem[cid]), 0);
      const value = useful / (st.apCost || 20);
      if (value > bestValue) {
        bestValue = value;
        best = st;
      }
    }
    if (!best) break;

    const runs = Math.max(
      1,
      Math.min(
        ...open
          .filter((cid) => (best!.yields[cid] || 0) > 0)
          .map((cid) => Math.ceil(rem[cid] / best!.yields[cid]))
      )
    );
    sweeps[best.number] = (sweeps[best.number] || 0) + runs;
    farmable.forEach((cid) => (rem[cid] -= runs * (best!.yields[cid] || 0)));
  }

  // 2) 축소 패스: AP 비싼 스테이지부터, 필요량을 계속 만족하는 한 1회씩 줄이기
  const covered = () =>
    farmable.every(
      (cid) => stages.reduce((sum, st) => sum + (sweeps[st.number] || 0) * (st.yields[cid] || 0), 0) >= need[cid]
    );
  [...stages]
    .sort((a, b) => b.apCost - a.apCost)
    .forEach((st) => {
      while ((sweeps[st.number] || 0) > 0) {
        sweeps[st.number] -= 1;
        if (!covered()) {
          sweeps[st.number] += 1;
          break;
        }
      }
    });

  return { sweeps: optimizeSweeps(stages, farmable, need, sweeps), unfarmable };
}

const apOf = (st: SweepStage) => st.apCost || 20;
const totalAp = (stages: SweepStage[], sweeps: Record<number, number>) =>
  stages.reduce((sum, st) => sum + (sweeps[st.number] || 0) * apOf(st), 0);

// 정수 최적화: 총 AP 최소 (branch & bound). greedy 결과를 초기 상한으로 사용, 노드 제한 초과 시 현재 최선 반환
function optimizeSweeps(
  stages: SweepStage[],
  targets: string[],
  need: Record<string, number>,
  seed: Record<number, number>
): Record<number, number> {
  if (targets.length === 0) return seed;

  // 대상 재화를 하나라도 주는 스테이지만, 최고 효율(AP/획득량) 순
  const ratio = (st: SweepStage) => Math.min(...targets.filter((c) => (st.yields[c] || 0) > 0).map((c) => apOf(st) / st.yields[c]));
  const cand = stages
    .filter((st) => targets.some((c) => (st.yields[c] || 0) > 0))
    .sort((a, b) => ratio(a) - ratio(b));
  const n = cand.length;

  // minRatio[i][k]: i번째 이후 스테이지 중 재화 k의 최소 AP/획득량 (하한 계산용)
  const minRatio: number[][] = Array.from({ length: n + 1 }, () => targets.map(() => Infinity));
  for (let i = n - 1; i >= 0; i--) {
    targets.forEach((c, k) => {
      const y = cand[i].yields[c] || 0;
      minRatio[i][k] = Math.min(minRatio[i + 1][k], y > 0 ? apOf(cand[i]) / y : Infinity);
    });
  }

  let bestAp = totalAp(stages, seed);
  let best: Record<number, number> = { ...seed };
  const cur: number[] = new Array(n).fill(0);
  let nodes = 0;
  const NODE_LIMIT = 2_000_000;

  const dfs = (i: number, rem: number[], ap: number) => {
    if (++nodes > NODE_LIMIT) return;
    let lb = 0;
    for (let k = 0; k < rem.length; k++) {
      if (rem[k] <= 0) continue;
      if (!isFinite(minRatio[i][k])) return;
      lb = Math.max(lb, rem[k] * minRatio[i][k]);
    }
    if (ap + lb >= bestAp) return; // 정수 AP이므로 같은 값은 갱신 불필요
    if (lb === 0) {
      bestAp = ap;
      best = {};
      cand.forEach((st, j) => (cur[j] > 0 ? (best[st.number] = cur[j]) : 0));
      return;
    }
    const st = cand[i];
    const maxRuns = Math.max(0, ...targets.map((c, k) => ((st.yields[c] || 0) > 0 && rem[k] > 0 ? Math.ceil(rem[k] / st.yields[c]) : 0)));
    if (i === n - 1) {
      // 마지막 스테이지: 필요한 최소 횟수로 확정
      cur[i] = maxRuns;
      const next = rem.map((r, k) => r - maxRuns * (st.yields[targets[k]] || 0));
      if (next.every((r) => r <= 0)) dfs(n, next, ap + maxRuns * apOf(st));
      cur[i] = 0;
      return;
    }
    for (let x = maxRuns; x >= 0; x--) {
      cur[i] = x;
      dfs(i + 1, rem.map((r, k) => r - x * (st.yields[targets[k]] || 0)), ap + x * apOf(st));
    }
    cur[i] = 0;
  };

  dfs(0, targets.map((c) => need[c]), 0);
  return best;
}
