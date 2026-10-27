import type { StudentProfile } from '../components/StudentManager';
import allStudentsRaw from '../data/allStudents.json';

const bulletMap: Record<string, string> = {
  Explosion: '폭발',
  Pierce: '관통',
  Mystic: '신비',
  Sonic: '진동',
};

const armorMap: Record<string, string> = {
  LightArmor: '경장',
  HeavyArmor: '중장',
  Unarmed: '특수',
  ElasticArmor: '탄력',
};

const roleMap: Record<string, string> = {
  DamageDealer: '딜러',
  Tanker: '탱커',
  Supporter: '서포터',
  Healer: '힐러',
  Vehicle: 'T.S.',
};

const squadMap: Record<string, string> = {
  Main: '스트라이커',
  Support: '스페셜',
};

// 로컬 스토리지에 캐시된 최신 학생 목록 불러오기 (초기값: allStudents.json)
export function getInitialStudents(): StudentProfile[] {
  try {
    const cached = localStorage.getItem('ba_cached_students');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length >= allStudentsRaw.length) {
        return parsed as StudentProfile[];
      }
    }
  } catch (e) {
    console.error('Failed to load cached students', e);
  }
  return allStudentsRaw as StudentProfile[];
}

interface RawSchaleStudent {
  Id: number;
  Name: string;
  StarGrade: number;
  BulletType: string;
  ArmorType: string;
  SquadType: string;
  Position?: string;
  TacticRole: string;
  School: string;
  DefaultOrder?: number;
  IsReleased?: boolean[];
}

// SchaleDB API를 통한 실시간 백그라운드 동기화 (CORS 허용됨)
export async function syncStudentsFromRemote(): Promise<{
  updated: boolean;
  students: StudentProfile[];
  count: number;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8초 타임아웃

    const res = await fetch('https://schaledb.com/data/kr/students.json', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as Record<string, RawSchaleStudent>;
    const list: StudentProfile[] = Object.values(data)
      .map((s) => ({
        id: s.Id,
        name: s.Name,
        starGrade: s.StarGrade,
        bulletType: bulletMap[s.BulletType] || s.BulletType,
        armorType: armorMap[s.ArmorType] || s.ArmorType,
        squadType: squadMap[s.SquadType] || s.SquadType,
        position: (s.Position || 'MIDDLE').toUpperCase(),
        role: roleMap[s.TacticRole] || s.TacticRole,
        school: s.School,
        order: s.DefaultOrder ?? 9999,
        isReleased: Boolean(s.IsReleased?.[0] || s.IsReleased?.[1]),
        iconUrl: `https://schaledb.com/images/student/icon/${s.Id}.webp`,
      }))
      .sort((a, b) => a.order - b.order);

    if (list.length > 0) {
      localStorage.setItem('ba_cached_students', JSON.stringify(list));
      localStorage.setItem('ba_last_sync_time', new Date().toISOString());
      return { updated: true, students: list, count: list.length };
    }
  } catch (err) {
    console.warn('Background student sync skipped (using offline cache):', err);
  }

  const fallback = getInitialStudents();
  return { updated: false, students: fallback, count: fallback.length };
}
