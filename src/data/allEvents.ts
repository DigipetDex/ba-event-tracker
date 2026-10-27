// 전체 이벤트 목록 및 일정 정보
export interface EventSummary {
  uid: string;
  name: string;
  period: string;
  runType?: string;
}

export const ALL_EVENTS: EventSummary[] = [
  {
    "uid": "863",
    "name": "특수작전: 로어추적 편",
    "period": "이벤트 일정 정보",
    "runType": ""
  },
  {
    "uid": "862",
    "name": "It’s our Engine! ~183호를 탈출하라!~",
    "period": "2027.01.12 ~ 2027.01.26",
    "runType": "first"
  },
  {
    "uid": "861",
    "name": "DIVE into OCEAN!",
    "period": "2026.12.15 ~ 2026.12.29",
    "runType": "first"
  },
  {
    "uid": "860",
    "name": "출항! 만마선 ~마코토 의장님의 화려한 피서~",
    "period": "2026.11.17 ~ 2026.12.01",
    "runType": "first"
  },
  {
    "uid": "859",
    "name": "람과천청",
    "period": "2026.10.13 ~ 2026.10.27",
    "runType": "first"
  },
  {
    "uid": "858",
    "name": "특수작전: 로어추적 편",
    "period": "2026.09.15 ~ 2026.09.29",
    "runType": "first"
  },
  {
    "uid": "857",
    "name": "특수작전: 로어추적 편",
    "period": "2026.08.18 ~ 2026.09.01",
    "runType": "first"
  },
  {
    "uid": "856",
    "name": "키보토스・미확인 미스테리 ~미지의 생물, 츠치노코를 찾아서~",
    "period": "2026.07.21 ~ 2026.08.04",
    "runType": "first"
  },
  {
    "uid": "855",
    "name": "게임개발부 청소 대작전!",
    "period": "2026.06.30 ~ 2026.07.14",
    "runType": "first"
  },
  {
    "uid": "854",
    "name": "강철대륙 공략전",
    "period": "이벤트 일정 정보",
    "runType": "first"
  },
  {
    "uid": "853",
    "name": "불인의 길 ~패션쇼 경호 임무!의 서~",
    "period": "2026.04.28 ~ 2026.05.12",
    "runType": "first"
  },
  {
    "uid": "852",
    "name": "겨울 하늘의 르네상스 ~문화 및 교류에 관한 실천적 테제~",
    "period": "2026.04.07 ~ 2026.04.21",
    "runType": "first"
  },
  {
    "uid": "851",
    "name": "마법소녀 헤비캘리버 ~에라의 야망과 정의의 자격~",
    "period": "2026.03.10 ~ 2026.03.24",
    "runType": "first"
  },
  {
    "uid": "850",
    "name": "누구를 위한 예술인가 ~위작과 미학의 행방~",
    "period": "2026.02.10 ~ 2026.03.03",
    "runType": "first"
  },
  {
    "uid": "849",
    "name": "우리는 오컬트 연구회! ~학원의 불가사의와 고대 주문~",
    "period": "2027.01.26 ~ 2027.02.09",
    "runType": "rerun"
  },
  {
    "uid": "848",
    "name": "여름 하늘의 프로미스",
    "period": "2026.12.29 ~ 2027.01.12",
    "runType": "rerun"
  },
  {
    "uid": "847",
    "name": "백에서 피어난 한 송이 ~정정당당하게, 수상 승부~",
    "period": "2025.11.18 ~ 2025.12.02",
    "runType": "first"
  },
  {
    "uid": "846",
    "name": "하이랜더 철도 폭주 사건 ~그리고 기차는 없었다~",
    "period": "2025.09.23 ~ 2025.10.07",
    "runType": "first"
  },
  {
    "uid": "845",
    "name": "Pray-Ball! ~노려라! 만루 홈런~",
    "period": "2025.08.26 ~ 2025.09.09",
    "runType": "first"
  },
  {
    "uid": "844",
    "name": "팬데믹 해저드 ~기적의 팬케이크~",
    "period": "2026.07.02 ~ 2026.07.16",
    "runType": "first"
  },
  {
    "uid": "843",
    "name": "Code: BOX 밀레니엄에 다가오는 그림자 ~한 가지의 물음과 두 가지 대답~",
    "period": "2025.07.08 ~ 2025.07.22",
    "runType": "first"
  },
  {
    "uid": "842",
    "name": "비밀의 미드나잇 파티 ~종이 울리는 술래잡기~",
    "period": "2025.06.10 ~ 2025.06.24",
    "runType": "first"
  },
  {
    "uid": "841",
    "name": "Serenade Promenade",
    "period": "2025.04.15 ~ 2025.04.29",
    "runType": "first"
  },
  {
    "uid": "840",
    "name": "오욕내강",
    "period": "2025.03.18 ~ 2025.04.01",
    "runType": "first"
  },
  {
    "uid": "839",
    "name": "월화몽소",
    "period": "이벤트 일정 정보",
    "runType": "permanent"
  },
  {
    "uid": "838",
    "name": "Sheside outside",
    "period": "2025.01.23 ~ 2025.02.08",
    "runType": "first"
  },
  {
    "uid": "837",
    "name": "Say-Bing!",
    "period": "이벤트 일정 정보",
    "runType": "permanent"
  },
  {
    "uid": "836",
    "name": "-ive aLIVE!",
    "period": "2024.10.22 ~ 2024.11.05",
    "runType": "first"
  },
  {
    "uid": "835",
    "name": "와글와글하며 오손도손하게",
    "period": "2024.09.24 ~ 2024.10.08",
    "runType": "first"
  },
  {
    "uid": "834",
    "name": "0068 오페라로부터 사랑을 담아서!",
    "period": "2024.08.20 ~ 2024.09.03",
    "runType": "first"
  },
  {
    "uid": "833",
    "name": "빛으로 나아가는 그녀들의 소야곡",
    "period": "2024.01.24 ~ 2024.02.07",
    "runType": "first"
  },
  {
    "uid": "832",
    "name": "전뇌신춘행진곡",
    "period": "2023.12.27 ~ 2024.01.10",
    "runType": "first"
  },
  {
    "uid": "831",
    "name": "어떤 과학의 청춘기록",
    "period": "2023.10.24 ~ 2023.11.08",
    "runType": "first"
  },
  {
    "uid": "830",
    "name": "Trip-Trap-Train",
    "period": "2023.09.27 ~ 2023.10.11",
    "runType": "first"
  },
  {
    "uid": "829",
    "name": "학원 동인 이야기 ~두 명이 도달한 최종회~",
    "period": "이벤트 일정 정보",
    "runType": "permanent"
  },
  {
    "uid": "828",
    "name": "숨겨진 유산을 찾아서 ~트리니티 과외 활동~",
    "period": "2024.01.30 ~ 2024.02.15",
    "runType": "first"
  },
  {
    "uid": "827",
    "name": "여름 특수 작전! 사라진 새우를 향한 토끼의 추적",
    "period": "2023.12.26 ~ 2024.01.09",
    "runType": "first"
  },
  {
    "uid": "826",
    "name": "용무동주 ~마음에 그리는 것은, 하나의 미래~",
    "period": "2023.11.28 ~ 2023.12.12",
    "runType": "first"
  },
  {
    "uid": "825",
    "name": "순백의 예고장 ~허식의 저택과 미학이 머무는 곳~",
    "period": "2023.10.31 ~ 2023.11.14",
    "runType": "first"
  },
  {
    "uid": "824",
    "name": "복구 작업: D.U. 시라토리구",
    "period": "2023.09.09 ~ 2023.09.19",
    "runType": "first"
  },
  {
    "uid": "823",
    "name": "프레나파테스 결전",
    "period": "2023.09.05 ~ 2023.09.19",
    "runType": "first"
  },
  {
    "uid": "822",
    "name": "아트라하시스의 방주 점령전",
    "period": "2023.08.22 ~ 2023.09.05",
    "runType": "first"
  },
  {
    "uid": "821",
    "name": "거짓된 성소 공략전",
    "period": "2023.07.25 ~ 2023.08.22",
    "runType": "first"
  },
  {
    "uid": "820",
    "name": "새해의 아페리티프 ~신년 한판 승부~",
    "period": "2023.06.27 ~ 2023.07.11",
    "runType": "first"
  },
  {
    "uid": "819",
    "name": "성당의 메리 크리스마스 ~구호기사단의 선물~",
    "period": "2023.06.13 ~ 2023.06.27",
    "runType": "first"
  },
  {
    "uid": "818",
    "name": "Get Set, Go! ~키보토스 황륜대제~",
    "period": "2022.10.26 ~ 2022.11.09",
    "runType": "first"
  },
  {
    "uid": "817",
    "name": "ON YOUR MARK ＠ MILLENNIUM",
    "period": "이벤트 일정 정보",
    "runType": "permanent"
  },
  {
    "uid": "816",
    "name": "방과 후 디저트 이야기 ~달콤한 비밀과 총격전~",
    "period": "2023.02.28 ~ 2023.03.14",
    "runType": "first"
  },
  {
    "uid": "815",
    "name": "출장! 백야당 바다의 집 프랜차이즈 계획",
    "period": "2023.01.31 ~ 2023.02.14",
    "runType": "first"
  },
  {
    "uid": "814",
    "name": "아비도스 리조트 복구 대책위원회",
    "period": "2023.01.17 ~ 2023.01.31",
    "runType": "first"
  },
  {
    "uid": "813",
    "name": "불인의 마음",
    "period": "2022.11.29 ~ 2022.12.13",
    "runType": "first"
  },
  {
    "uid": "812",
    "name": "덜렁대는 수녀님과 고서관의 마술사",
    "period": "2022.10.04 ~ 2022.10.18",
    "runType": "first"
  },
  {
    "uid": "811",
    "name": "코사카 와카모의 침묵과 축연",
    "period": "2022.09.06 ~ 2022.09.20",
    "runType": "first"
  },
  {
    "uid": "810",
    "name": "샬레의 해피♡발렌타인 순찰",
    "period": "2022.09.06 ~ 2022.09.20",
    "runType": "first"
  },
  {
    "uid": "809",
    "name": "신춘광상곡 제68번",
    "period": "2022.08.09 ~ 2022.08.23",
    "runType": "first"
  },
  {
    "uid": "808",
    "name": "227호 온천장 운영일지!",
    "period": "2022.07.12 ~ 2022.07.26",
    "runType": "first"
  },
  {
    "uid": "807",
    "name": "하츠네 미쿠의 스페셜 라이브",
    "period": "2022.06.14 ~ 2022.06.28",
    "runType": "first"
  },
  {
    "uid": "806",
    "name": "선상의 바니 체이서",
    "period": "2022.05.03 ~ 2022.05.17",
    "runType": "first"
  },
  {
    "uid": "805",
    "name": "네버랜드에서의 술래잡기",
    "period": "2022.04.19 ~ 2022.05.03",
    "runType": "first"
  },
  {
    "uid": "804",
    "name": "히나 선도부장님의 여름방학!",
    "period": "2022.03.22 ~ 2022.04.05",
    "runType": "first"
  },
  {
    "uid": "803",
    "name": "여름 하늘의 위시리스트",
    "period": "2022.02.22 ~ 2022.03.08",
    "runType": "first"
  },
  {
    "uid": "802",
    "name": "혁명의 이반 쿠팔라",
    "period": "2022.01.11 ~ 2022.01.25",
    "runType": "first"
  },
  {
    "uid": "801",
    "name": "벚꽃만발 축제대소동!",
    "period": "2021.11.29 ~ 2021.12.14",
    "runType": "first"
  },
  {
    "uid": "701",
    "name": "특수 작전 데카그라마톤 편",
    "period": "2024.06.11 ~ 2024.06.25",
    "runType": "first"
  }
];
