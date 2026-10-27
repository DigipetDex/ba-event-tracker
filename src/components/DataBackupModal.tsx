import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, Upload, RefreshCw, Database, AlertCircle } from 'lucide-react';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportJson, setExportJson] = useState<string>('');
  const [importJson, setImportJson] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // 현재 브라우저의 모든 BA 플래너 데이터 취합
  const generateBackupData = () => {
    const backup: Record<string, any> = {
      _meta: {
        app: 'BlueArchiveEventTracker',
        version: '2.0',
        exportedAt: new Date().toISOString(),
      },
      data: {},
    };

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('ba_') || key === 'selectedItems')) {
          try {
            backup.data[key] = JSON.parse(localStorage.getItem(key) || 'null');
          } catch {
            backup.data[key] = localStorage.getItem(key);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    return backup;
  };

  useEffect(() => {
    if (isOpen) {
      const data = generateBackupData();
      setExportJson(JSON.stringify(data, null, 2));
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 클립보드 복사
  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportJson).then(() => {
      setCopied(true);
      setStatusMessage({ text: '클립보드에 백업 데이터가 복사되었습니다!' });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 백업 파일 다운로드
  const handleDownloadBackup = () => {
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `블루아카_플래너_백업_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage({ text: '백업 파일이 다운로드되었습니다.' });
  };

  // 백업 파일 불러오기
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJson(content);
      setStatusMessage({ text: `파일 "${file.name}"을 불러왔습니다. [데이터 복원 및 적용]을 눌러주세요.` });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 데이터 복원 실행
  const handleApplyImport = () => {
    if (!importJson.trim()) {
      setStatusMessage({ text: '가져올 데이터를 입력하거나 파일을 선택해주세요.', isError: true });
      return;
    }

    try {
      const parsed = JSON.parse(importJson.trim());
      const dataToRestore = parsed.data || parsed;

      let restoredCount = 0;
      Object.keys(dataToRestore).forEach((key) => {
        if (key.startsWith('ba_') || key === 'selectedItems') {
          const val = dataToRestore[key];
          if (typeof val === 'string') {
            localStorage.setItem(key, val);
          } else {
            localStorage.setItem(key, JSON.stringify(val));
          }
          restoredCount++;
        }
      });

      if (restoredCount === 0) {
        throw new Error('복원할 수 있는 블루아카 플래너 데이터 키를 찾지 못했습니다.');
      }

      setStatusMessage({ text: `총 ${restoredCount}개 항목 복원 완료! 화면을 새로고침합니다.` });
      setTimeout(() => {
        onDataRestored();
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        text: '복원 실패: 올바른 JSON 백업 데이터 형식이 아닙니다. (' + (err?.message || err) + ')',
        isError: true,
      });
    }
  };

  // 요약 카운트
  const recruitedCount = (() => {
    try {
      const saved = localStorage.getItem('ba_recruited_students');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  })();

  const memorialCount = (() => {
    try {
      const saved = localStorage.getItem('ba_memorial_students');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#18181b] border border-[#2e2e38] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <Database size={20} className="text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              데이터 백업 및 연동 (서버 ↔ HTML 파일)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#27272a] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-[#27272a] bg-[#141418]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setStatusMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-400 bg-[#1c1c24]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Copy size={14} />
            데이터 내보내기 (백업)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setStatusMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-400 bg-[#1c1c24]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload size={14} />
            데이터 가져오기 (복원)
          </button>
        </div>

        {/* 안내 배너 */}
        <div className="p-4 bg-[#141418]/60 border-b border-[#27272a] text-xs text-zinc-400 leading-relaxed flex items-start gap-2">
          <AlertCircle size={15} className="text-blue-400 shrink-0 mt-0.5" />
          <span>
            웹 브라우저의 보안 정책상 <strong>개발 서버(localhost)</strong>와 <strong>로컬 파일(file://)</strong>은 저장소가 분리되어 있습니다. 기존 화면에서 [내보내기] 후 새 화면에서 [가져오기]를 하면 즉시 모든 데이터가 연동됩니다.
          </span>
        </div>

        {/* 탭 본문 */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'export' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300">
                <span>현재 저장된 데이터:</span>
                <span className="font-bold text-blue-400">
                  모집 학생 {recruitedCount}명 / 메모리얼 {memorialCount}명
                </span>
              </div>

              <textarea
                readOnly
                value={exportJson}
                rows={9}
                className="w-full p-3 bg-[#111114] border border-[#2c2c36] rounded-xl text-zinc-300 font-mono text-[11px] focus:outline-none resize-none"
              />

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyExport}
                  className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? '복사되었습니다!' : '클립보드에 전체 복사'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#272732] hover:bg-[#343444] text-zinc-200 border border-[#3c3c4e] text-xs font-bold transition cursor-pointer"
                >
                  <Download size={14} />
                  파일로 저장 (.json)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-zinc-300">
                  복사한 백업 데이터 붙여넣기 또는 파일 선택:
                </label>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#272732] hover:bg-[#343444] text-zinc-200 border border-[#3c3c4e] text-xs font-semibold cursor-pointer transition">
                  <Upload size={12} />
                  <span>백업 파일 선택</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="여기에 복사한 백업 JSON 데이터를 붙여넣으세요..."
                rows={9}
                className="w-full p-3 bg-[#111114] border border-[#2c2c36] rounded-xl text-zinc-200 font-mono text-[11px] focus:outline-none focus:border-blue-500 resize-none"
              />

              <button
                type="button"
                onClick={handleApplyImport}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <RefreshCw size={14} />
                데이터 복원 및 즉시 적용
              </button>
            </div>
          )}

          {/* 상태 알림 메시지 */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-bold border transition ${
                statusMessage.isError
                  ? 'bg-red-950/40 border-red-500/50 text-red-300'
                  : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              }`}
            >
              {statusMessage.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
