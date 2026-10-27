import React, { useState, useMemo } from 'react';
import { Search, Star, Users, Check, Filter, RotateCcw, Sparkles } from 'lucide-react';
import allStudentsRaw from '../data/allStudents.json';

export interface StudentProfile {
  id: number;
  name: string;
  starGrade: number;
  bulletType: string; // 폭발, 관통, 신비, 진동, 복합
  armorType: string; // 경장, 중장, 특수, 탄력, 복합
  squadType: string; // 스트라이커, 스페셜
  position: string; // FRONT, MIDDLE, BACK
  role: string; // 딜러, 탱커, 힐러, 서포터, T.S.
  school: string;
  order: number;
  isReleased: boolean;
  iconUrl: string;
}

const ALL_STUDENTS = allStudentsRaw as StudentProfile[];

const BULLET_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  폭발: { bg: 'bg-red-950/40', text: 'text-red-400', border: 'border-red-500/40' },
  관통: { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-500/40' },
  신비: { bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-500/40' },
  진동: { bg: 'bg-purple-950/40', text: 'text-purple-400', border: 'border-purple-500/40' },
  복합: { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-500/40' },
};

const ARMOR_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  경장: { bg: 'bg-red-950/40', text: 'text-red-400', border: 'border-red-500/40' },
  중장: { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-500/40' },
  특수: { bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-500/40' },
  탄력: { bg: 'bg-purple-950/40', text: 'text-purple-400', border: 'border-purple-500/40' },
  복합: { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-500/40' },
};

interface StudentManagerProps {
  students?: StudentProfile[];
  recruitedIds?: number[];
  onToggleRecruited?: (id: number) => void;
  onSetRecruitedIds?: (ids: number[]) => void;
  memorialIds?: number[];
  onToggleMemorial?: (id: number) => void;
  onSetMemorialIds?: (ids: number[]) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students: propStudents,
  recruitedIds: externalRecruitedIds,
  onToggleRecruited: externalToggleRecruited,
  onSetRecruitedIds: externalSetRecruitedIds,
  memorialIds: externalMemorialIds,
  onToggleMemorial: externalToggleMemorial,
  onSetMemorialIds: externalSetMemorialIds,
}) => {
  const currentStudents = propStudents || ALL_STUDENTS;

  // 사용자가 모집(보유)한 학생 ID 목록 (로컬 스토리지에 영구 보관)
  const [internalRecruitedIds, setInternalRecruitedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('ba_recruited_students');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return currentStudents.filter((s) => s.starGrade <= 2).map((s) => s.id);
  });

  const recruitedIds = externalRecruitedIds ?? internalRecruitedIds;

  // 사용자가 메모리얼을 해금/획득한 학생 ID 목록 (로컬 스토리지에 영구 보관)
  const [internalMemorialIds, setInternalMemorialIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('ba_memorial_students');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const memorialIds = externalMemorialIds ?? internalMemorialIds;

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBullet, setSelectedBullet] = useState<string | null>(null);
  const [selectedArmor, setSelectedArmor] = useState<string | null>(null);
  const [selectedSquad, setSelectedSquad] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'name' | 'star'>('newest');
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const [recruitedOnlyFilter, setRecruitedOnlyFilter] = useState<'all' | 'recruited' | 'unrecruited'>('all');
  const [memorialFilter, setMemorialFilter] = useState<'all' | 'memorial' | 'no_memorial'>('all');

  // 학생 클릭 시 모집 토글
  const handleToggleRecruited = (id: number) => {
    if (externalToggleRecruited) {
      externalToggleRecruited(id);
    } else {
      setInternalRecruitedIds((prev) => {
        const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
        try {
          localStorage.setItem('ba_recruited_students', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
    }
  };

  // 메모리얼 획득 토글
  const handleToggleMemorial = (id: number) => {
    if (externalToggleMemorial) {
      externalToggleMemorial(id);
    } else {
      setInternalMemorialIds((prev) => {
        const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
        try {
          localStorage.setItem('ba_memorial_students', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
    }
  };

  // 일괄 선택 / 해제
  const handleSelectAll = (select: boolean) => {
    const nextIds = select ? currentStudents.map((s) => s.id) : [];
    if (externalSetRecruitedIds) {
      externalSetRecruitedIds(nextIds);
    } else {
      setInternalRecruitedIds(nextIds);
      try {
        localStorage.setItem('ba_recruited_students', JSON.stringify(nextIds));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 메모리얼 일괄 획득 / 해제
  const handleSelectAllMemorials = (select: boolean) => {
    const nextIds = select ? [...recruitedIds] : [];
    if (externalSetMemorialIds) {
      externalSetMemorialIds(nextIds);
    } else {
      setInternalMemorialIds(nextIds);
      try {
        localStorage.setItem('ba_memorial_students', JSON.stringify(nextIds));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 필터링 및 정렬
  const filteredStudents = useMemo(() => {
    return currentStudents.filter((student) => {
      // 1. 검색어 필터
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (!student.name.toLowerCase().includes(q)) return false;
      }
      // 2. 공격 타입
      if (selectedBullet && student.bulletType !== selectedBullet) return false;
      // 3. 방어 타입
      if (selectedArmor && student.armorType !== selectedArmor) return false;
      // 4. 부대 타입 (스트라이커/스페셜)
      if (selectedSquad && student.squadType !== selectedSquad) return false;
      // 5. 포지션 (FRONT, MIDDLE, BACK)
      if (selectedPosition && student.position !== selectedPosition) return false;
      // 6. 역할 (딜러, 탱커, 힐러, 서포터, T.S.)
      if (selectedRole && student.role !== selectedRole) return false;
      // 7. 모집 상태 필터
      const isRecruited = recruitedIds.includes(student.id);
      if (recruitedOnlyFilter === 'recruited' && !isRecruited) return false;
      if (recruitedOnlyFilter === 'unrecruited' && isRecruited) return false;
      // 8. 메모리얼 획득 필터
      const hasMemorial = memorialIds.includes(student.id);
      if (memorialFilter === 'memorial' && !hasMemorial) return false;
      if (memorialFilter === 'no_memorial' && hasMemorial) return false;

      return true;
    }).sort((a, b) => {
      if (sortOption === 'newest') return b.order - a.order || b.id - a.id;
      if (sortOption === 'oldest') return a.order - b.order || a.id - b.id;
      if (sortOption === 'name') return a.name.localeCompare(b.name, 'ko');
      if (sortOption === 'star') return b.starGrade - a.starGrade || b.order - a.order;
      return 0;
    });
  }, [
    searchQuery,
    selectedBullet,
    selectedArmor,
    selectedSquad,
    selectedPosition,
    selectedRole,
    recruitedOnlyFilter,
    memorialFilter,
    sortOption,
    recruitedIds,
    memorialIds,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBullet(null);
    setSelectedArmor(null);
    setSelectedSquad(null);
    setSelectedPosition(null);
    setSelectedRole(null);
    setRecruitedOnlyFilter('all');
    setMemorialFilter('all');
    setSortOption('newest');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* 좌측 사이드바: 필터 및 정렬 패널 (몰루로그 좌측 UI 디자인 재현) */}
      <aside className="lg:col-span-1 bg-[#18181b] border border-[#27272a] rounded-2xl p-4.5 space-y-5 shadow-xs sticky top-20">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-zinc-300" />
            <h3 className="text-sm font-bold text-white">필터 및 정렬</h3>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw size={11} /> 초기화
          </button>
        </div>

        {/* 표시 현황 */}
        <div className="text-xs text-zinc-400">
          총 <strong className="text-white">{currentStudents.length}명</strong> 중{' '}
          <strong className="text-blue-400">{filteredStudents.length}명</strong> 표시 중
        </div>

        {/* 이름 검색창 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">이름으로 찾기</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="학생 이름 (예: 미카, 호시노)"
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-[#121214] text-white border border-[#32323c] rounded-lg focus:outline-none focus:border-blue-500 placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* 모집 상태 필터 (전체 / 보유 학생만 / 미보유) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">모집 상태</label>
          <div className="grid grid-cols-3 gap-1 bg-[#121214] p-1 rounded-lg border border-[#2a2a34]">
            {(
              [
                { id: 'all', label: '전체' },
                { id: 'recruited', label: '모집됨' },
                { id: 'unrecruited', label: '미모집' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRecruitedOnlyFilter(opt.id)}
                className={`py-1 text-[11px] font-bold rounded cursor-pointer transition ${
                  recruitedOnlyFilter === opt.id
                    ? 'bg-[#27272f] text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 메모리얼 해금 상태 필터 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
            <Sparkles size={12} className="text-pink-400" />
            <span>메모리얼 상태</span>
          </label>
          <div className="grid grid-cols-3 gap-1 bg-[#121214] p-1 rounded-lg border border-[#2a2a34]">
            {(
              [
                { id: 'all', label: '전체' },
                { id: 'memorial', label: '획득' },
                { id: 'no_memorial', label: '미획득' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMemorialFilter(opt.id)}
                className={`py-1 text-[11px] font-bold rounded cursor-pointer transition ${
                  memorialFilter === opt.id
                    ? 'bg-[#27272f] text-pink-300 font-black shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 공격 타입 버튼 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">공격 타입</label>
          <div className="flex flex-wrap gap-1">
            {['폭발', '관통', '신비', '진동', '복합'].map((type) => {
              const active = selectedBullet === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedBullet(active ? null : type)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition border cursor-pointer ${
                    active
                      ? `${BULLET_COLORS[type].bg} ${BULLET_COLORS[type].text} ${BULLET_COLORS[type].border}`
                      : 'bg-[#151518] text-zinc-400 border-[#2a2a34] hover:border-zinc-600'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* 방어 타입 버튼 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">방어 타입</label>
          <div className="flex flex-wrap gap-1">
            {['경장', '중장', '특수', '탄력', '복합'].map((type) => {
              const active = selectedArmor === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedArmor(active ? null : type)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition border cursor-pointer ${
                    active
                      ? `${ARMOR_COLORS[type].bg} ${ARMOR_COLORS[type].text} ${ARMOR_COLORS[type].border}`
                      : 'bg-[#151518] text-zinc-400 border-[#2a2a34] hover:border-zinc-600'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* 부대 타입 (스트라이커 / 스페셜) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">부대</label>
          <div className="flex gap-1">
            {['스트라이커', '스페셜'].map((sq) => {
              const active = selectedSquad === sq;
              return (
                <button
                  key={sq}
                  type="button"
                  onClick={() => setSelectedSquad(active ? null : sq)}
                  className={`flex-1 py-1 rounded text-xs font-bold transition border cursor-pointer ${
                    active
                      ? 'bg-zinc-700 text-white border-zinc-500'
                      : 'bg-[#151518] text-zinc-400 border-[#2a2a34] hover:border-zinc-600'
                  }`}
                >
                  {sq}
                </button>
              );
            })}
          </div>
        </div>

        {/* 포지션 (FRONT, MIDDLE, BACK) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">포지션</label>
          <div className="flex gap-1">
            {['FRONT', 'MIDDLE', 'BACK'].map((pos) => {
              const active = selectedPosition === pos;
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setSelectedPosition(active ? null : pos)}
                  className={`flex-1 py-1 rounded text-[11px] font-bold transition border cursor-pointer ${
                    active
                      ? 'bg-zinc-700 text-white border-zinc-500'
                      : 'bg-[#151518] text-zinc-400 border-[#2a2a34] hover:border-zinc-600'
                  }`}
                >
                  {pos}
                </button>
              );
            })}
          </div>
        </div>

        {/* 역할 (딜러, 탱커, 힐러, 서포터, T.S.) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">역할군</label>
          <div className="flex flex-wrap gap-1">
            {['딜러', '탱커', '힐러', '서포터', 'T.S.'].map((r) => {
              const active = selectedRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(active ? null : r)}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition border cursor-pointer ${
                    active
                      ? 'bg-blue-900/40 text-blue-300 border-blue-500/50'
                      : 'bg-[#151518] text-zinc-400 border-[#2a2a34] hover:border-zinc-600'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* 정렬 순서 */}
        <div className="space-y-1.5 pt-2 border-t border-[#27272a]">
          <label className="text-xs font-semibold text-zinc-300">정렬 기준</label>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {[
              { id: 'newest', label: '최신순' },
              { id: 'oldest', label: '과거순' },
              { id: 'name', label: '이름순' },
              { id: 'star', label: '★ 성급순' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSortOption(s.id as any)}
                className={`py-1 rounded text-xs font-semibold transition border cursor-pointer ${
                  sortOption === s.id
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-[#151518] text-zinc-400 border-[#2a2a34] hover:border-zinc-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* 우측 메인: 학생 그리드 및 상단 컨트롤러 */}
      <section className="lg:col-span-3 space-y-4">
        {/* 상단 컨트롤 바: 타이틀 & 간략히/자세히 토글 & 전체선택/초기화 */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Users size={20} className="text-blue-400" />
              <h2 className="text-lg font-black text-white tracking-tight">모집한 학생 목록</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30">
                보유 {recruitedIds.length} / 전체 {ALL_STUDENTS.length}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-600/20 text-pink-300 font-bold border border-pink-500/30 flex items-center gap-1">
                <Sparkles size={11} className="text-pink-400" />
                메모리얼 {memorialIds.length}명
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              학생 카드를 클릭하여 <strong>모집 상태</strong>를 토글하고, 우측 상단 <strong>[★ 메모리얼]</strong> 버튼으로 메모리얼 획득 여부를 설정할 수 있습니다
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
            {/* 간략히 / 자세히 토글 */}
            <div className="flex bg-[#121214] p-0.5 rounded-lg border border-[#2e2e38] text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('simple')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  viewMode === 'simple'
                    ? 'bg-zinc-700 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                간략히
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  viewMode === 'detailed'
                    ? 'bg-zinc-700 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                자세히
              </button>
            </div>

            {/* 모집 전체 선택 / 해제 */}
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition border border-zinc-700 cursor-pointer"
            >
              모집 전체 선택
            </button>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-medium transition border border-zinc-700 cursor-pointer"
            >
              모집 전체 해제
            </button>

            {/* 메모리얼 일괄 획득 */}
            <button
              type="button"
              onClick={() => handleSelectAllMemorials(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-950/40 hover:bg-pink-900/50 text-pink-300 border border-pink-500/40 text-xs font-bold transition cursor-pointer shadow-xs"
              title="현재 모집(보유) 중인 모든 학생의 메모리얼을 획득 상태로 설정합니다"
            >
              <Sparkles size={12} />
              보유 학생 메모리얼 일괄 획득
            </button>
          </div>
        </div>

        {/* 학생 카드 목록 그리드 (몰루로그 모집한 학생 화면의 동일 비율 및 디자인) */}
        {filteredStudents.length === 0 ? (
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-12 text-center text-zinc-500 text-sm">
            조건에 맞는 학생이 없습니다. 필터를 재설정해보세요.
          </div>
        ) : (
          <div
            className={`grid gap-2.5 sm:gap-3 ${
              viewMode === 'simple'
                ? 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8'
                : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
            }`}
          >
            {filteredStudents.map((student) => {
              const isRecruited = recruitedIds.includes(student.id);
              const hasMemorial = memorialIds.includes(student.id);

              return (
                <div
                  key={student.id}
                  onClick={() => handleToggleRecruited(student.id)}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all select-none border flex flex-col ${
                    isRecruited
                      ? 'border-white/80 shadow-md ring-1 ring-white/50 bg-[#1c1c22]'
                      : 'border-[#27272f] hover:border-zinc-500 bg-[#141417]'
                  }`}
                >
                  {/* 학생 이미지 영역 (1:1 비율) */}
                  <div className="relative aspect-square w-full overflow-hidden bg-[#202026]">
                    <img
                      src={student.iconUrl}
                      alt={student.name}
                      loading="lazy"
                      className={`w-full h-full object-cover transition duration-150 ${
                        isRecruited
                          ? 'grayscale-0 opacity-100 group-hover:scale-105'
                          : 'grayscale opacity-35 contrast-125 group-hover:opacity-50'
                      }`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://schale.gg/images/student/icon/10000.webp';
                      }}
                    />

                    {/* 성급 뱃지 (★3) - 몰루로그 하단 오렌지색 별표 디자인 */}
                    <div className="absolute bottom-1 left-1.5 flex items-center gap-0.5 bg-black/75 px-1.5 py-0.5 rounded text-[10px] font-black text-amber-400 backdrop-blur-xs border border-amber-500/30">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span>{student.starGrade}</span>
                    </div>

                    {/* 좌측 상단 '메모리얼' 토글 버튼 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMemorial(student.id);
                      }}
                      className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-black transition flex items-center gap-0.5 backdrop-blur-xs border cursor-pointer ${
                        hasMemorial
                          ? 'bg-pink-600/90 text-white border-pink-400 shadow-sm'
                          : 'bg-black/70 text-zinc-400 border-zinc-700 hover:text-pink-300 hover:border-pink-500/50'
                      }`}
                      title={hasMemorial ? '메모리얼 해금됨 (클릭하여 해제)' : '메모리얼 미해금 (클릭하여 획득 체크)'}
                    >
                      <Sparkles size={9} className={hasMemorial ? 'text-pink-200 fill-pink-200' : 'text-zinc-400'} />
                      <span>{hasMemorial ? 'L2D' : 'L2D'}</span>
                    </button>

                    {/* 우측 상단 '모집' 뱃지 (보유 시) */}
                    {isRecruited ? (
                      <div className="absolute top-1 right-1 bg-black/85 backdrop-blur-xs text-[9px] font-extrabold text-white px-1.5 py-0.5 rounded border border-white/30 flex items-center gap-0.5">
                        <Check size={9} className="text-emerald-400 stroke-[3]" /> 모집
                      </div>
                    ) : (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-[9px] text-zinc-400 px-1 py-0.5 rounded">
                        미보유
                      </div>
                    )}
                  </div>

                  {/* 하단 정보 영역: 이름 & 상세 모드 시 공격/방어 타입 */}
                  <div className="p-1.5 text-center flex flex-col justify-center min-h-[38px] bg-[#18181d]">
                    <div
                      className={`text-xs font-bold truncate leading-tight ${
                        isRecruited ? 'text-zinc-100' : 'text-zinc-500'
                      }`}
                      title={student.name}
                    >
                      {student.name}
                    </div>

                    {/* 자세히 모드일 때 추가 태그 */}
                    {viewMode === 'detailed' && (
                      <div className="flex items-center justify-center gap-1 mt-1 text-[9px] font-bold">
                        <span className={`px-1 py-0.2 rounded ${BULLET_COLORS[student.bulletType]?.text || 'text-zinc-400'}`}>
                          {student.bulletType}
                        </span>
                        <span className="text-zinc-600">/</span>
                        <span className={`px-1 py-0.2 rounded ${ARMOR_COLORS[student.armorType]?.text || 'text-zinc-400'}`}>
                          {student.armorType}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentManager;
