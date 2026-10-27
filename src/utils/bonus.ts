// 학생 보너스 드롭 수량 (올림, 부동소수점 오차 방지)
export function bonusDropAmount(amount: number, percent: number): number {
  return Math.ceil(+((amount * percent) / 100).toFixed(6));
}
