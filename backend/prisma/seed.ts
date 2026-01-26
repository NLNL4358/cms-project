import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// DATABASE_URL 환경 변수에서 연결 정보 가져오기
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/cms_db';
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 시드 데이터 생성 시작...');

  // 기본 역할 생성 (있으면 스킵)
  const roles = [
    {
      name: '슈퍼 관리자',
      slug: 'super-admin',
      description: '모든 권한을 가진 최고 관리자',
      permissions: ['*'], // 모든 권한
    },
    {
      name: '관리자',
      slug: 'admin',
      description: '콘텐츠 관리 및 사용자 관리 권한',
      permissions: ['content:*', 'user:read'],
    },
    {
      name: '편집자',
      slug: 'editor',
      description: '콘텐츠 작성 및 수정 권한',
      permissions: ['content:create', 'content:update', 'content:read'],
    },
    {
      name: '뷰어',
      slug: 'viewer',
      description: '읽기 전용 권한',
      permissions: ['content:read'],
    },
  ];

  for (const role of roles) {
    const existing = await prisma.role.findUnique({
      where: { slug: role.slug },
    });

    if (!existing) {
      await prisma.role.create({ data: role });
      console.log(`✅ 역할 생성: ${role.name}`);
    } else {
      console.log(`⏭️  역할 존재: ${role.name}`);
    }
  }

  console.log('🎉 시드 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
