export interface Currency {
  id: string; // 80841, 80842, 80843 등
  name: string;
  color: string;
  imageUrl: string;
}

export interface BonusStudent {
  studentUid: string;
  name: string;
  role?: string;
  imageUrl: string;
  bonuses: {
    currencyId: string;
    percentage: number; // 0.25 = 25%
  }[];
}

export interface ShopItem {
  id: string;
  name: string;
  description?: string;
  rarity?: number | null;
  category?: string;
  currencyId: string;
  unitPrice: number;
  maxQuantity: number | null;
  imageUrl: string;
}

export interface StageDrop {
  resourceUid: string;
  name: string;
  amount: number;
  imageUrl: string;
  isEventCurrency: boolean;
  description?: string;
}

export interface Stage {
  id: string;
  number: number;
  name: string;
  apCost: number;
  primaryCurrencyId?: string | null;
  baseDropAmount?: number;
  drops: StageDrop[];
}

export interface EventData {
  id: string;
  name: string;
  period?: string;
  startAt?: string | null;
  endAt?: string | null;
  currencies: Currency[];
  stages: Stage[];
  shopItems: ShopItem[];
  bonusStudents: BonusStudent[];
}

export interface UserEventProgress {
  // 아이템별 구매 희망 수량 (itemId -> 수량)
  itemPurchases: Record<string, number>;
  // 체크한 보유 보너스 학생 UIDs
  ownedStudentUids: string[];
  // 재화별 현재 보너스 퍼센트
  bonusPercents: Record<string, number>;
  // 재화별 현재 보유량 (currencyId -> 보유 개수)
  ownedCurrencies: Record<string, number>;
  // 스테이지별 이미 완료한 소탕 횟수 (stageNumber 또는 stageId -> 횟수)
  clearedSweeps: Record<string, number>;
  // 스테이지 활성화(ON/OFF) 여부 (stageNumber -> boolean)
  activeStages: Record<number, boolean>;
  // 소탕으로 얻어 보유량에 가산한 재화 (stageNumber -> currencyId -> 수량). 리셋 시 되돌리고 추천 소탕 계산에서 제외
  sweepGains?: Record<string, Record<string, number>>;
}
