import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Download,
  Copy,
  Check,
  Search,
  Sparkles,
  Users,
  FolderOpen,
  Upload,
  RotateCcw,
  HelpCircle,
  Filter,
  Save,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';
import allStudentsRaw from '../data/allStudents.json';
import type { StudentProfile } from './StudentManager';

const ALL_STUDENTS = allStudentsRaw as StudentProfile[];

interface LobbySelectorProps {
  students?: StudentProfile[];
  recruitedIds: number[];
  memorialIds?: number[];
}

interface LobbySaveData {
  CharacterIds: number[];
  IsMemorials: boolean[];
  CurrCharacterId: number;
  CurrSpineIndexes: number[];
  RandomLobbySaveTime: string;
}

export const LobbySelector: React.FC<LobbySelectorProps> = ({
  students: propStudents,
  recruitedIds,
  memorialIds = [],
}) => {
  const currentStudents = propStudents || ALL_STUDENTS;

  // File System Access API를 통한 직접 연결된 세이브 파일 핸들
  const [connectedFileName, setConnectedFileName] = useState<string | null>(null);
  const fileHandleRef = useRef<any>(null);
  const [directSaveToast, setDirectSaveToast] = useState<string | null>(null);
  // 로비에 선택된 학생 ID 목록 (로컬 스토리지 저장, 원본 utnapisht.im 호환 키 지원)
  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('ba_lobby_selected_students');
      if (saved) return JSON.parse(saved);
      const legacy = localStorage.getItem('selectedItems');
      if (legacy) return JSON.parse(legacy);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // 유저 UID (파일명 생성용)
  const [uid, setUid] = useState<string>(() => {
    return localStorage.getItem('ba_lobby_uid') || '00000000';
  });

  // 메모리얼 로비(L2D) 적용 모드 ('sync' = 모집한 학생 메모리얼 연동, 'all' = 모두 L2D, 'none' = 모두 기본)
  const [memorialMode, setMemorialMode] = useState<'sync' | 'all' | 'none'>(() => {
    const saved = localStorage.getItem('ba_lobby_memorial_mode');
    if (saved === 'sync' || saved === 'all' || saved === 'none') return saved;
    const legacy = localStorage.getItem('ba_lobby_is_memorial');
    return legacy === 'false' ? 'none' : 'sync';
  });

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'selected' | 'unselected' | 'recruited' | 'memorial'>('all');
  const [sortOption, setSortOption] = useState<'release' | 'name' | 'star'>('release');
  const [outputJson, setOutputJson] = useState<string>('');
  const [copiedType, setCopiedType] = useState<'json' | 'path' | 'filename' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 로컬스토리지 동기화
  useEffect(() => {
    try {
      localStorage.setItem('ba_lobby_selected_students', JSON.stringify(selectedIds));
      localStorage.setItem('selectedItems', JSON.stringify(selectedIds));
    } catch (e) {
      console.error(e);
    }
  }, [selectedIds]);

  useEffect(() => {
    localStorage.setItem('ba_lobby_uid', uid);
  }, [uid]);

  useEffect(() => {
    localStorage.setItem('ba_lobby_memorial_mode', memorialMode);
  }, [memorialMode]);

  // DefaultOrder 매핑 (원본 스크립트와 100% 동일한 정렬 보장)
  const orderingMap = useMemo(() => {
    return new Map<number, number>(currentStudents.map((s) => [s.id, s.order]));
  }, [currentStudents]);

  const memorialSet = useMemo(() => new Set(memorialIds), [memorialIds]);

  // 세이브 데이터 생성 함수 (원본 utnapisht.im/tools/lobby/ 와 100% 동일한 규격)
  const buildSelectData = useMemo((): LobbySaveData => {
    const validIds = new Set(currentStudents.map((s) => s.id));
    const sortedItems = [...selectedIds]
      .filter((id) => validIds.has(id))
      .sort((a, b) => (orderingMap.get(a) ?? 0) - (orderingMap.get(b) ?? 0));

    const isMemorialList = sortedItems.map((id) => {
      if (memorialMode === 'all') return true;
      if (memorialMode === 'none') return false;
      return memorialSet.has(id);
    });

    return {
      CharacterIds: sortedItems,
      IsMemorials: isMemorialList,
      CurrCharacterId: sortedItems[0] ?? 13010,
      CurrSpineIndexes: sortedItems.map(() => 0),
      RandomLobbySaveTime: '0001-01-01T00:00:00',
    };
  }, [selectedIds, memorialMode, memorialSet, orderingMap, currentStudents]);

  // 학생 토글
  const handleToggleStudent = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 모집한 학생 불러오기
  const handleApplyRecruited = () => {
    setSelectedIds([...recruitedIds]);
  };

  // 전체 선택 / 해제
  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedIds(currentStudents.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  // JSON 출력 및 클립보드 복사
  const handleOutputAndCopy = () => {
    const jsonText = JSON.stringify(buildSelectData);
    setOutputJson(jsonText);
    navigator.clipboard.writeText(jsonText).then(() => {
      setCopiedType('json');
      setTimeout(() => setCopiedType(null), 2000);
    });
  };

  // 경로 복사
  const handleCopyPath = (text: string, type: 'path' | 'filename') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    });
  };

  // .save 파일 다운로드
  // .save 파일 수동 다운로드 (기존 방식 호환)
  const handleDownloadSaveFile = () => {
    const jsonText = JSON.stringify(buildSelectData);
    setOutputJson(jsonText);
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanUid = uid.trim() || '00000000';
    a.download = `${cleanUid}LobbyCharacterSelectData.save`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 세이브 파일 직접 열기 및 핸들 바인딩 (File System Access API)
  const handleOpenDirectSaveFile = async () => {
    try {
      if (!('showOpenFilePicker' in window)) {
        fileInputRef.current?.click();
        return;
      }
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: '블루아카이브 세이브 파일 (*.save)',
            accept: {
              'application/json': ['.save', '.json'],
            },
          },
        ],
        multiple: false,
      });

      const file = await handle.getFile();
      const match = file.name.match(/^(\d+)LobbyCharacterSelectData\.save$/i);
      if (match && match[1]) {
        setUid(match[1]);
      }

      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<LobbySaveData>;
      if (Array.isArray(parsed.CharacterIds)) {
        setSelectedIds(parsed.CharacterIds);
      }
      if (Array.isArray(parsed.IsMemorials) && parsed.IsMemorials.length > 0) {
        const allTrue = parsed.IsMemorials.every(Boolean);
        const allFalse = parsed.IsMemorials.every((v) => !v);
        if (allTrue) setMemorialMode('all');
        else if (allFalse) setMemorialMode('none');
        else setMemorialMode('sync');
      }
      setOutputJson(text);
      fileHandleRef.current = handle;
      setConnectedFileName(file.name);
      setDirectSaveToast(`"${file.name}" 파일과 연결되었습니다!`);
      setTimeout(() => setDirectSaveToast(null), 3000);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Failed to open file directly', err);
        alert('파일을 여는 도중 오류가 발생했습니다: ' + (err?.message || err));
      }
    }
  };

  // 세이브 파일 직접 덮어쓰기 (원클릭 저장)
  const handleDirectOverwrite = async () => {
    try {
      const jsonText = JSON.stringify(buildSelectData);
      setOutputJson(jsonText);

      let handle = fileHandleRef.current;

      // 연결된 핸들이 없는 경우 직접 파일 선택/저장창 띄우기
      if (!handle) {
        if (!('showSaveFilePicker' in window)) {
          handleDownloadSaveFile();
          return;
        }
        const cleanUid = uid.trim() || '00000000';
        handle = await (window as any).showSaveFilePicker({
          suggestedName: `${cleanUid}LobbyCharacterSelectData.save`,
          types: [
            {
              description: '블루아카이브 세이브 파일 (*.save)',
              accept: {
                'application/json': ['.save'],
              },
            },
          ],
        });
        fileHandleRef.current = handle;
        setConnectedFileName(handle.name);
      }

      const writable = await handle.createWritable();
      await writable.write(jsonText);
      await writable.close();

      setDirectSaveToast(`"${handle.name}" 파일에 바로 덮어씌웠습니다!`);
      setTimeout(() => setDirectSaveToast(null), 3500);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Failed to overwrite file', err);
        alert('파일 덮어쓰기 실패: ' + (err?.message || err));
      }
    }
  };

  // 연결 해제
  const handleDisconnectFile = () => {
    fileHandleRef.current = null;
    setConnectedFileName(null);
    setDirectSaveToast('파일 연결이 해제되었습니다.');
    setTimeout(() => setDirectSaveToast(null), 2500);
  };

  // 기존 .save 파일 불러오기 (input fallback)
  const handleUploadSaveFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일명에서 UID 추출 시도: (UID)LobbyCharacterSelectData.save
    const match = file.name.match(/^(\d+)LobbyCharacterSelectData\.save$/i);
    if (match && match[1]) {
      setUid(match[1]);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as Partial<LobbySaveData>;
        if (Array.isArray(parsed.CharacterIds)) {
          setSelectedIds(parsed.CharacterIds);
        }
        if (Array.isArray(parsed.IsMemorials) && parsed.IsMemorials.length > 0) {
          const allTrue = parsed.IsMemorials.every(Boolean);
          const allFalse = parsed.IsMemorials.every((v) => !v);
          if (allTrue) setMemorialMode('all');
          else if (allFalse) setMemorialMode('none');
          else setMemorialMode('sync');
        }
        setOutputJson(content);
        setConnectedFileName(file.name);
        setDirectSaveToast(`"${file.name}" 불러오기 완료!`);
        setTimeout(() => setDirectSaveToast(null), 3000);
      } catch (err) {
        alert('올바른 LobbyCharacterSelectData.save 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 필터링 및 정렬된 학생 목록
  const filteredStudents = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    const recruitedSet = new Set(recruitedIds);

    return currentStudents.filter((student) => {
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (!student.name.toLowerCase().includes(q)) return false;
      }
      if (filterMode === 'selected' && !selectedSet.has(student.id)) return false;
      if (filterMode === 'unselected' && selectedSet.has(student.id)) return false;
      if (filterMode === 'recruited' && !recruitedSet.has(student.id)) return false;
      if (filterMode === 'memorial' && !memorialSet.has(student.id)) return false;
      return true;
    }).sort((a, b) => {
      if (sortOption === 'release') return a.order - b.order;
      if (sortOption === 'name') return a.name.localeCompare(b.name, 'ko');
      if (sortOption === 'star') return b.starGrade - a.starGrade || a.order - b.order;
      return 0;
    });
  }, [searchQuery, filterMode, sortOption, selectedIds, recruitedIds, memorialSet]);

  const saveFolderPath = `%USERPROFILE%\\AppData\\LocalLow\\Nexon Games\\Blue Archive`;
  const saveFileName = `${uid.trim() || '00000000'}LobbyCharacterSelectData.save`;

  return (
    <div className="space-y-6">
      {/* 상단 안내 및 세이브 설정 카드 */}
      <section className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#27272a]">
          <div>
            <div className="flex items-center gap-2.5">
              <Sparkles size={20} className="text-blue-400" />
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                로비 캐릭터 선택기 (Lobby Character Selector)
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30">
                선택됨 {selectedIds.length}명
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              블루 아카이브 PC 클라이언트의 인게임 로비 당번 인원 제한 없이 원하는 모든 학생을 로비에 등록할 수 있는 세이브 파일 생성 도구입니다.
            </p>
          </div>

          {/* 세이브 파일 불러오기 및 직접 연결 */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".save,.json"
              onChange={handleUploadSaveFile}
              className="hidden"
            />
            {connectedFileName ? (
              <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/50 rounded-xl px-3 py-1.5 text-xs">
                <FileCheck2 size={15} className="text-emerald-400 shrink-0" />
                <span className="font-bold text-emerald-300 max-w-[180px] truncate" title={connectedFileName}>
                  {connectedFileName}
                </span>
                <button
                  type="button"
                  onClick={handleDisconnectFile}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 underline ml-1 cursor-pointer"
                >
                  연결 해제
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleOpenDirectSaveFile}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#22222a] hover:bg-[#2c2c36] text-zinc-200 border border-[#343442] text-xs font-bold transition cursor-pointer shadow-xs"
              title="게임 폴더의 세이브 파일을 열어 현재 설정과 즉시 연동합니다"
            >
              <Upload size={14} className="text-blue-400" />
              세이브 파일 불러오기 / 연결
            </button>
          </div>
        </div>

        {/* 직접 저장/연결 완료 알림 토스트 */}
        {directSaveToast && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg border border-emerald-400 animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>{directSaveToast}</span>
          </div>
        )}

        {/* 경로 안내 & UID / 메모리얼 설정 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 좌측: 파일 경로 및 사용 방법 */}
          <div className="bg-[#131316] border border-[#26262e] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
              <FolderOpen size={14} className="text-amber-400" />
              <span>세이브 파일 적용 경로 (PC 클라이언트)</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 bg-[#1c1c22] border border-[#2d2d38] rounded-lg px-3 py-2">
                <code className="text-[11px] text-zinc-300 font-mono truncate">
                  {saveFolderPath}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyPath(saveFolderPath, 'path')}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedType === 'path' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedType === 'path' ? '복사됨' : '경로 복사'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 bg-[#1c1c22] border border-[#2d2d38] rounded-lg px-3 py-2">
                <code className="text-[11px] text-emerald-400 font-mono truncate">
                  {saveFileName}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyPath(saveFileName, 'filename')}
                  className="text-[11px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedType === 'filename' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedType === 'filename' ? '복사됨' : '파일명 복사'}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed flex items-start gap-1.5">
              <HelpCircle size={13} className="text-zinc-500 shrink-0 mt-0.5" />
              <span>
                위 폴더에 있는 본인의 <strong>(UID)LobbyCharacterSelectData.save</strong> 파일에서 숫자(UID)를 확인해 입력한 뒤, 다운로드한 파일을 해당 폴더에 덮어씌우세요.
              </span>
            </p>
          </div>

          {/* 우측: UID 입력, Is Memorial 체크박스, 다운로드 및 출력 버튼 */}
          <div className="bg-[#131316] border border-[#26262e] rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* UID 입력창 */}
              <div className="space-y-1.5">
                <label htmlFor="lobby-uid" className="text-xs font-bold text-zinc-300 block">
                  계정 UID (파일명 접두사)
                </label>
                <input
                  id="lobby-uid"
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="00000000"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#1c1c22] text-white border border-[#343442] rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Is Memorial 설정 */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-zinc-300 block">로비 형태 (메모리얼/기본)</span>
                <div className="grid grid-cols-3 gap-1 bg-[#1c1c22] p-1 rounded-lg border border-[#343442]">
                  <button
                    type="button"
                    onClick={() => setMemorialMode('sync')}
                    className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      memorialMode === 'sync'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="모집한 학생에서 체크된 L2D 메모리얼 여부를 그대로 반영합니다"
                  >
                    <Sparkles size={11} className={memorialMode === 'sync' ? 'text-pink-200' : 'text-pink-400'} />
                    <span>연동 ({memorialIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemorialMode('all')}
                    className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      memorialMode === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="선택된 모든 학생을 메모리얼(L2D) 로비로 설정"
                  >
                    모두 L2D
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemorialMode('none')}
                    className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      memorialMode === 'none'
                        ? 'bg-zinc-700 text-white shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="선택된 모든 학생을 기본 일러스트 로비로 설정"
                  >
                    모두 기본
                  </button>
                </div>
              </div>
            </div>

            {/* 액션 버튼: 바로 덮어쓰기 (원클릭) & 세이브 다운로드 & JSON 복사 */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDirectOverwrite}
                className="flex-1 min-w-[210px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition shadow-lg shadow-emerald-950/40 cursor-pointer"
                title="인게임 세이브 파일에 수동 다운로드/복사 없이 즉시 덮어씌웁니다"
              >
                <Save size={15} />
                세이브 파일 바로 덮어쓰기 (원클릭)
              </button>

              <button
                type="button"
                onClick={handleDownloadSaveFile}
                className="flex-1 min-w-[150px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#25252e] hover:bg-[#30303c] text-zinc-200 border border-[#383846] font-bold text-xs transition cursor-pointer"
                title="수동 복사용 .save 파일을 브라우저로 다운로드합니다"
              >
                <Download size={14} />
                수동 다운로드 (.save)
              </button>

              <button
                type="button"
                onClick={handleOutputAndCopy}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#25252e] hover:bg-[#30303c] text-zinc-200 border border-[#383846] font-bold text-xs transition cursor-pointer"
              >
                {copiedType === 'json' ? (
                  <>
                    <Check size={15} className="text-emerald-400" />
                    <span className="text-emerald-400">클립보드에 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} className="text-zinc-300" />
                    <span>JSON 출력 및 클립보드 복사</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* JSON 미리보기 출력창 (Output Selected Items 클릭 시 노출) */}
        {outputJson && (
          <div className="bg-[#101013] border border-[#2c2c36] rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold">
              <span>생성된 JSON 데이터 ({selectedIds.length}명)</span>
              <button
                type="button"
                onClick={() => setOutputJson('')}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                닫기
              </button>
            </div>
            <pre className="text-[11px] text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-32 bg-[#16161a] p-2.5 rounded-lg border border-[#25252e]">
              {outputJson}
            </pre>
          </div>
        )}
      </section>

      {/* 하단: 필터 바 & 학생 그리드 */}
      <section className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 shadow-xs space-y-4">
        {/* 컨트롤 바 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#27272a]">
          <div className="flex flex-wrap items-center gap-2">
            {/* 검색창 */}
            <div className="relative w-full sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="학생 이름 검색..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-[#121214] text-white border border-[#32323c] rounded-lg focus:outline-none focus:border-blue-500 placeholder:text-zinc-500"
              />
            </div>

            {/* 필터 탭 */}
            <div className="flex items-center bg-[#121214] p-1 rounded-lg border border-[#2a2a34] text-xs font-bold">
              {(
                [
                  { id: 'all', label: `전체 (${currentStudents.length})` },
                  { id: 'selected', label: `선택됨 (${selectedIds.length})` },
                  { id: 'unselected', label: '미선택' },
                  { id: 'recruited', label: `모집한 학생 (${recruitedIds.length})` },
                  { id: 'memorial', label: `메모리얼 (${memorialIds.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    filterMode === tab.id
                      ? 'bg-[#272732] text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.id === 'memorial' && <Sparkles size={11} className="text-pink-400" />}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* 정렬 순서 */}
            <div className="flex items-center gap-1 bg-[#121214] p-1 rounded-lg border border-[#2a2a34] text-xs">
              <Filter size={12} className="text-zinc-500 ml-1.5 mr-0.5" />
              {(
                [
                  { id: 'release', label: '출시순(기본)' },
                  { id: 'name', label: '이름순' },
                  { id: 'star', label: '★성급순' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSortOption(s.id)}
                  className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                    sortOption === s.id
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 우측 일괄 선택 버튼들 */}
          <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
            <button
              type="button"
              onClick={handleApplyRecruited}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#27272f] hover:bg-[#32323e] text-blue-400 border border-blue-500/40 text-xs font-bold transition cursor-pointer shadow-xs"
              title="모집한 학생 탭에서 체크해 둔 보유 학생들을 모두 선택합니다"
            >
              <Users size={13} />
              모집한 학생 반영
            </button>
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-xs"
            >
              모두 선택
            </button>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#323238] text-zinc-300 text-xs font-semibold transition border border-zinc-700/60 cursor-pointer"
            >
              <RotateCcw size={12} /> 초기화
            </button>
          </div>
        </div>

        {/* 학생 카드 그리드 (utnapisht.im/tools/lobby 와 동일한 collection 초상화 + 체크 표시) */}
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm">
            표시할 학생이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
            {filteredStudents.map((student) => {
              const isSelected = selectedIds.includes(student.id);
              const collectionImgUrl = `https://schaledb.com/images/student/collection/${student.id}.webp`;

              return (
                <div
                  key={student.id}
                  onClick={() => handleToggleStudent(student.id)}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all select-none border flex flex-col items-center p-1.5 ${
                    isSelected
                      ? 'border-blue-500 bg-[#1e2230] ring-1 ring-blue-500/60 shadow-md'
                      : 'border-[#27272f] bg-[#141418] hover:border-zinc-600'
                  }`}
                >
                  {/* 캐릭터 이미지 */}
                  <div className="relative w-full aspect-[4/4.5] rounded-lg overflow-hidden bg-[#1c1c22] mb-1.5">
                    <img
                      src={collectionImgUrl}
                      alt={student.name}
                      loading="lazy"
                      className={`w-full h-full object-cover transition duration-150 ${
                        isSelected
                          ? 'grayscale-0 opacity-100 group-hover:scale-105'
                          : 'grayscale opacity-40 group-hover:opacity-65'
                      }`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== student.iconUrl) {
                          target.src = student.iconUrl;
                        }
                      }}
                    />

                    {/* 좌측 상단 메모리얼 보유 표시 배지 */}
                    {memorialSet.has(student.id) && (
                      <div
                        className="absolute top-1.5 left-1.5 px-1 py-0.5 rounded bg-pink-500/90 text-[9px] font-black text-white shadow-xs flex items-center gap-0.5 pointer-events-none"
                        title="메모리얼 로비(L2D) 획득 학생"
                      >
                        <Sparkles size={9} />
                        L2D
                      </div>
                    )}

                    {/* 우측 상단 체크박스 표시 */}
                    <div
                      className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        isSelected
                          ? 'bg-blue-600 border-blue-400 text-white shadow-xs'
                          : 'bg-black/60 border-zinc-500/60 text-transparent group-hover:border-zinc-300'
                      }`}
                    >
                      <Check size={13} className="stroke-[3]" />
                    </div>
                  </div>

                  {/* 학생 이름 */}
                  <div
                    className={`text-[11px] font-bold text-center truncate w-full px-0.5 leading-tight ${
                      isSelected ? 'text-white' : 'text-zinc-500'
                    }`}
                    title={student.name}
                  >
                    {student.name}
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

export default LobbySelector;
