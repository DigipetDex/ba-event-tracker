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

  return { sweeps, unfarmable };
}
