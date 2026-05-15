const { execSync } = require('child_process');
const { Client } = require('pg');

async function main() {
  // .env 로드
  require('dotenv').config();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('⚠️  DATABASE_URL not set, skipping DB setup');
    return;
  }

  const url = new URL(dbUrl);
  const dbName = url.pathname.slice(1);

  // DB 연결 시도
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.end();
    console.log(`✅ Database "${dbName}" exists`);
  } catch (err) {
    if (err.code === '3D000') {
      // DB가 없으면 생성
      console.log(`📦 Database "${dbName}" not found, creating...`);
      const adminUrl = new URL(dbUrl);
      adminUrl.pathname = '/postgres';
      const adminClient = new Client({ connectionString: adminUrl.toString() });
      await adminClient.connect();
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      await adminClient.end();
      console.log(`✅ Database "${dbName}" created`);

      // 마이그레이션 실행
      console.log('🔄 Running migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations complete');
    } else {
      // DB 연결 자체가 안 되는 경우 (PostgreSQL 꺼짐 등)
      console.log(`⚠️  Cannot connect to database: ${err.message}`);
      console.log('   Skipping DB setup, server will start anyway');
    }
  }
}

main().catch(console.error);
