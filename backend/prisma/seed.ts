import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

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

  // 기본 역할 생성 (있으면 업데이트)
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
      description: '콘텐츠, 미디어, 사용자 관리 권한 (역할 관리 제외)',
      permissions: [
        'content-type:*',
        'content:*',
        'media:*',
        'user:read',
        'role:read',
      ],
    },
    {
      name: '편집자',
      slug: 'editor',
      description: '콘텐츠 작성, 수정 및 미디어 업로드 권한',
      permissions: [
        'content:read',
        'content:create',
        'content:update',
        'content-type:read',
        'media:read',
        'media:create',
        'media:update',
      ],
    },
    {
      name: '뷰어',
      slug: 'viewer',
      description: '읽기 전용 권한',
      permissions: ['content:read', 'content-type:read', 'media:read'],
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
      // 권한 업데이트
      await prisma.role.update({
        where: { slug: role.slug },
        data: {
          permissions: role.permissions,
          description: role.description,
        },
      });
      console.log(`🔄 역할 업데이트: ${role.name}`);
    }
  }

  // 기본 super-admin 사용자 생성
  const hashedPassword = await bcrypt.hash('admin123', 10); // password: admin123

  const superAdminRole = await prisma.role.findUnique({
    where: { slug: 'super-admin' }
  });

  let existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@cms.com' }
  });

  if (!existingAdmin && superAdminRole) {
    existingAdmin = await prisma.user.create({
      data: {
        email: 'admin@cms.com',
        name: 'System Admin',
        password: hashedPassword,
        type: 'ADMIN',
        isActive: true,
      }
    });

    await prisma.userRole.create({
      data: {
        userId: existingAdmin.id,
        roleId: superAdminRole.id,
        status: 'ACTIVE',
        requestedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: existingAdmin.id,
      }
    });

    console.log('✅ 기본 super-admin 사용자 생성: admin@cms.com / admin123');
  } else if (existingAdmin && superAdminRole) {
    // 기존 사용자 비밀번호 업데이트
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { password: hashedPassword }
    });

    // UserRole이 없으면 생성
    const existingRole = await prisma.userRole.findFirst({
      where: {
        userId: existingAdmin.id,
        roleId: superAdminRole.id
      }
    });

    if (!existingRole) {
      await prisma.userRole.create({
        data: {
          userId: existingAdmin.id,
          roleId: superAdminRole.id,
          status: 'ACTIVE',
          requestedAt: new Date(),
          approvedAt: new Date(),
          approvedBy: existingAdmin.id,
        }
      });
    }

    console.log('✅ 기본 super-admin 사용자 업데이트: admin@cms.com / admin123');
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
