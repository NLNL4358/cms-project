# NestJS 백엔드 개발 가이드
## 프론트엔드 개발자를 위한 실전 백엔드 입문

> 이 문서는 CMS 프로젝트의 "사용자 관리" 기능 구현 과정을 따라가며
> NestJS 백엔드 개발의 기초부터 실전까지를 설명합니다.

---

## 목차

1. [백엔드란 무엇인가?](#1-백엔드란-무엇인가)
2. [NestJS vs Next.js — 헷갈리기 쉬운 차이](#2-nestjs-vs-nextjs)
3. [NestJS의 3대 핵심 구조](#3-nestjs의-3대-핵심-구조)
4. [실전: 사용자 관리 기능 개발 과정](#4-실전-사용자-관리-기능-개발-과정)
5. [Module — 기능을 묶는 상자](#5-module--기능을-묶는-상자)
6. [Controller — 요청을 받는 문지기](#6-controller--요청을-받는-문지기)
7. [Service — 실제 일을 하는 일꾼](#7-service--실제-일을-하는-일꾼)
8. [DTO — 데이터 검증 필터](#8-dto--데이터-검증-필터)
9. [Prisma — 데이터베이스와 대화하기](#9-prisma--데이터베이스와-대화하기)
10. [Guard & Decorator — 보안과 인증](#10-guard--decorator--보안과-인증)
11. [전체 요청 흐름 정리](#11-전체-요청-흐름-정리)
12. [자주 쓰는 패턴 모음](#12-자주-쓰는-패턴-모음)

---

## 1. 백엔드란 무엇인가?

프론트엔드 개발자인 당신은 이미 백엔드를 사용하고 있습니다.

```
[ 프론트엔드 (React) ]  ←→  [ 백엔드 (NestJS) ]  ←→  [ 데이터베이스 (PostgreSQL) ]
      화면 표시                  데이터 처리                 데이터 저장
```

프론트엔드에서 `api.get('/users')` 를 호출하면:

1. **프론트엔드**: "사용자 목록 줘!" (HTTP 요청)
2. **백엔드**: 요청을 받고, DB에서 데이터를 꺼내서, JSON으로 응답
3. **프론트엔드**: 받은 JSON을 화면에 표시

**백엔드의 역할:**
- 데이터를 저장하고 꺼내주기 (CRUD)
- 누가 요청했는지 확인하기 (인증/인가)
- 데이터가 올바른지 검증하기 (Validation)
- 비즈니스 로직 처리 (예: "자기 자신은 삭제 불가")

---

## 2. NestJS vs Next.js

| | **NestJS** (우리 프로젝트) | **Next.js** |
|---|---|---|
| **역할** | 백엔드 전용 서버 | React 프론트엔드 + 간단한 백엔드 |
| **언어** | TypeScript | TypeScript/JavaScript |
| **구조** | Module → Controller → Service | Pages/App Router |
| **용도** | API 서버, 마이크로서비스 | 웹사이트, SSR/SSG |
| **비유** | 전문 요리사 (복잡한 요리 전문) | 만능 셰프 (요리도 서빙도 가능) |

**NestJS를 선택한 이유:**
- 대규모 엔터프라이즈 CMS에 필요한 구조화된 아키텍처
- 모듈 시스템으로 기능별 깔끔한 분리
- TypeScript 강제 → 타입 안전성
- Swagger 자동 API 문서 생성

---

## 3. NestJS의 3대 핵심 구조

NestJS의 모든 기능은 **Module, Controller, Service** 세 가지로 구성됩니다.

```
┌─── Module (기능 묶음) ────────────────────────┐
│                                                │
│   Controller (요청 처리)    Service (비즈니스 로직)  │
│   "POST /users 요청이 왔다"   "DB에서 유저 만들어"   │
│          │                       │             │
│          └───── 요청 전달 ────────┘             │
│                                                │
└────────────────────────────────────────────────┘
```

**React와 비교하면:**

| React (프론트엔드) | NestJS (백엔드) |
|---|---|
| `App.jsx` (라우터 설정) | `Module` (기능 등록) |
| `Pages/` (화면 컴포넌트) | `Controller` (요청 수신) |
| `Providers/`, `lib/` (로직) | `Service` (비즈니스 로직) |
| `Zod` (폼 검증) | `DTO + class-validator` (요청 검증) |

---

## 4. 실전: 사용자 관리 기능 개발 과정

사용자 관리 기능을 만들 때 실제로 한 작업 순서입니다:

### Step 1: 폴더 구조 생성

```
backend/src/user/
├── dto/
│   ├── create-user.dto.ts    ← 생성 시 데이터 검증 규칙
│   └── update-user.dto.ts    ← 수정 시 데이터 검증 규칙
├── user.controller.ts        ← HTTP 요청 수신 (라우터)
├── user.service.ts           ← 비즈니스 로직 (DB 작업)
└── user.module.ts            ← 모듈 등록 (조립)
```

### Step 2: 개발 순서

```
1. DTO 작성 (데이터 규칙 정의)
   → "사용자 생성 시 이메일은 필수, 비밀번호는 8자 이상"

2. Service 작성 (실제 로직)
   → "DB에서 유저 조회, 생성, 수정, 삭제"

3. Controller 작성 (요청 연결)
   → "POST /users 요청이 오면 → Service.create() 호출"

4. Module 작성 (조립)
   → "Controller와 Service를 하나로 묶기"

5. AppModule에 등록
   → "전체 앱에 이 기능 추가"
```

---

## 5. Module — 기능을 묶는 상자

### 실제 코드: `user.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [PrismaModule, RoleModule],  // 이 모듈이 사용하는 다른 모듈들
  controllers: [UserController],        // 요청을 처리할 컨트롤러
  providers: [UserService],             // 비즈니스 로직을 담당할 서비스
  exports: [UserService],               // 다른 모듈에서 사용할 수 있게 공개
})
export class UserModule {}
```

### 한 줄씩 설명

**`@Module({ ... })`**
- `@`로 시작하는 것을 **데코레이터**라고 합니다
- React에서는 없는 개념이지만, "이 클래스에 추가 정보를 붙이는 것"이라고 이해하면 됩니다
- `@Module`은 "이 클래스는 NestJS 모듈이야"라고 선언하는 것

**`imports: [PrismaModule, RoleModule]`**
- React에서 `import`로 다른 파일을 가져오는 것과 비슷
- 하지만 여기서는 **다른 모듈의 기능 전체**를 가져옵니다
- `PrismaModule` → 데이터베이스 접근 기능
- `RoleModule` → 역할/권한 확인 기능 (PermissionsGuard가 여기 있음)

**`controllers: [UserController]`**
- "이 모듈에서 HTTP 요청을 처리할 컨트롤러는 UserController야"

**`providers: [UserService]`**
- "이 모듈에서 실제 로직을 담당할 서비스는 UserService야"
- React의 Context Provider와 이름만 비슷하고 다른 개념입니다
- NestJS에서 provider는 "주입 가능한 클래스"를 의미합니다

**`exports: [UserService]`**
- 다른 모듈에서 UserService를 사용할 수 있게 공개
- exports하지 않으면 이 모듈 안에서만 사용 가능

### AppModule에 등록

```typescript
// backend/src/app.module.ts
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ContentTypeModule,
    ContentModule,
    MediaModule,
    RoleModule,
    UserModule,      // ← 여기에 추가! 이게 없으면 /users API가 작동하지 않음
    DashboardModule,
    TasksModule,
  ],
})
export class AppModule {}
```

React로 비유하면 `App.jsx`에 `<Route>` 를 추가하는 것과 같습니다.

---

## 6. Controller — 요청을 받는 문지기

Controller는 HTTP 요청을 받아서 Service에게 전달하는 역할입니다.
React의 페이지 컴포넌트(라우터)와 비슷합니다.

### 실제 코드: `user.controller.ts` (핵심 부분)

```typescript
@ApiTags('Users')                    // Swagger 문서에서 "Users" 그룹으로 표시
@Controller('users')                 // 이 컨트롤러는 /users 경로 담당
@UseGuards(JwtAuthGuard)            // 모든 요청에 로그인 필수
@ApiBearerAuth('access-token')      // Swagger에서 인증 토큰 사용 표시
export class UserController {
  constructor(private readonly userService: UserService) {}
  //          ↑ 의존성 주입 (Dependency Injection)
  //            NestJS가 자동으로 UserService 인스턴스를 넣어줌
  //            React에서 useContext()로 값을 가져오는 것과 비슷

  @Post()                            // POST /users
  @UseGuards(PermissionsGuard)       // 권한 확인
  @Permissions('user:create', 'user:*', '*')  // 이 중 하나라도 있으면 허용
  @HttpCode(HttpStatus.CREATED)      // 응답 코드 201 (생성됨)
  create(@Body() createUserDto: CreateUserDto) {
    //    ↑ @Body()는 요청 body를 가져옴
    //      React에서 form 데이터를 가져오는 것과 비슷
    return this.userService.create(createUserDto);
  }

  @Get()                             // GET /users
  @UseGuards(PermissionsGuard)
  @Permissions('user:read', 'user:*', '*')
  findAll(
    @Query('type') type?: string,    // URL 쿼리 파라미터: /users?type=ADMIN
    @Query('search') search?: string, // /users?search=홍길동
    @Query('page') page?: string,     // /users?page=2
    @Query('limit') limit?: string,   // /users?limit=20
  ) {
    return this.userService.findAll({
      type,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')                        // GET /users/abc123 (동적 라우트)
  findOne(@Param('id') id: string) {
    //     ↑ URL의 :id 부분을 가져옴
    //       React Router의 useParams()와 같은 역할
    return this.userService.findOne(id);
  }

  @Patch(':id')                      // PATCH /users/abc123
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')                     // DELETE /users/abc123
  remove(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
    // ↑ 커스텀 데코레이터: 현재 로그인한 사용자의 ID
  ) {
    return this.userService.remove(id, currentUserId);
  }
}
```

### HTTP 메서드와 데코레이터 매핑

| 데코레이터 | HTTP 메서드 | 용도 | 프론트엔드 호출 |
|---|---|---|---|
| `@Post()` | POST | 생성 | `api.post('/users', data)` |
| `@Get()` | GET | 조회 | `api.get('/users')` |
| `@Get(':id')` | GET | 단일 조회 | `api.get('/users/abc123')` |
| `@Patch(':id')` | PATCH | 부분 수정 | `api.patch('/users/abc123', data)` |
| `@Delete(':id')` | DELETE | 삭제 | `api.delete('/users/abc123')` |

### 파라미터 데코레이터

| 데코레이터 | 가져오는 위치 | 예시 |
|---|---|---|
| `@Body()` | 요청 body (JSON) | `{ "name": "홍길동", "email": "..." }` |
| `@Param('id')` | URL 경로 파라미터 | `/users/:id` → `abc123` |
| `@Query('page')` | URL 쿼리 스트링 | `/users?page=2` → `"2"` |
| `@CurrentUser('id')` | JWT 토큰의 사용자 정보 | 현재 로그인한 사용자 ID |

---

## 7. Service — 실제 일을 하는 일꾼

Service는 실제 비즈니스 로직을 담당합니다.
DB 조회, 데이터 가공, 규칙 검증 등 모든 "일"이 여기서 이루어집니다.

### 실제 코드: `user.service.ts` (핵심 부분)

```typescript
@Injectable()  // "이 클래스는 다른 곳에 주입될 수 있어" 선언
export class UserService {
  constructor(private prisma: PrismaService) {}
  //                  ↑ PrismaService를 주입받아 DB 접근
  //                    React에서 const api = useAPI() 와 비슷

  // ========== 사용자 생성 ==========
  async create(createUserDto: CreateUserDto) {
    const { email, password, name, type, roleIds } = createUserDto;
    //     ↑ 구조 분해 할당 (React에서도 쓰는 문법!)

    // 1. 이메일 중복 확인
    const existing = await this.prisma.user.findUnique({
      where: { email }
    });
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
      // ↑ HTTP 409 응답을 자동으로 보냄
      //   프론트에서 error.response.status === 409 로 받음
    }

    // 2. 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);
    // ↑ "password123" → "$2b$10$xK3b..." 로 변환
    //   DB에 절대 평문 비밀번호를 저장하면 안 됨!

    // 3. DB에 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        type: type || 'ADMIN',
      },
      select: this.userSelect(),
      // ↑ 응답에서 password 필드를 제외하기 위해 select 사용
    });

    // 4. 역할 할당 (roleIds가 있으면)
    if (roleIds?.length) {
      await this.assignRoles(user.id, roleIds);
    }

    return this.findOne(user.id);
  }
```

### async/await 란?

```typescript
// 데이터베이스 조회는 시간이 걸리는 작업입니다.
// async/await는 "기다렸다가 결과를 받겠다"는 의미입니다.

// ❌ 이렇게 하면 결과를 기다리지 않고 넘어감
const user = this.prisma.user.findUnique({ where: { id } });
console.log(user); // Promise { <pending> } ← 아직 결과가 없음!

// ✅ await를 붙이면 결과가 올 때까지 기다림
const user = await this.prisma.user.findUnique({ where: { id } });
console.log(user); // { id: 'abc', name: '홍길동', ... } ← 실제 데이터!

// 함수 앞에 async를 붙여야 내부에서 await 사용 가능
async create(dto: CreateUserDto) {
  const user = await this.prisma.user.create({ ... });
  return user;
}
```

React에서도 API 호출할 때 `await api.get(...)` 쓰시죠? 같은 원리입니다.

### 에러 처리 (Exception)

```typescript
// NestJS는 특별한 에러 클래스를 제공합니다.
// throw하면 자동으로 해당 HTTP 상태 코드로 응답됩니다.

throw new NotFoundException('사용자를 찾을 수 없습니다');
// → HTTP 404 { message: '사용자를 찾을 수 없습니다' }

throw new ConflictException('이미 사용 중인 이메일입니다');
// → HTTP 409 { message: '이미 사용 중인 이메일입니다' }

throw new BadRequestException('자기 자신은 삭제할 수 없습니다');
// → HTTP 400 { message: '자기 자신은 삭제할 수 없습니다' }

throw new ForbiddenException('권한이 없습니다');
// → HTTP 403 { message: '권한이 없습니다' }
```

프론트엔드에서 이렇게 받습니다:
```javascript
// 프론트엔드 (React)
try {
  await api.post('/users', data);
} catch (error) {
  const message = error.response?.data?.message;
  // "이미 사용 중인 이메일입니다"
  alert(message);
}
```

---

## 8. DTO — 데이터 검증 필터

DTO(Data Transfer Object)는 "이 데이터는 이런 규칙을 지켜야 해"를 정의합니다.
React의 Zod 스키마와 같은 역할입니다.

### 실제 코드: `create-user.dto.ts`

```typescript
export class CreateUserDto {
  @ApiProperty({ example: 'editor@cms.com' })  // Swagger 문서용
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다' })
  password: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: UserType })
  @IsEnum(UserType)    // ADMIN 또는 MEMBER만 허용
  @IsOptional()        // 선택 입력 (없으면 기본값 사용)
  type?: UserType;

  @IsArray()
  @IsString({ each: true })  // 배열의 각 항목이 문자열인지
  @IsOptional()
  roleIds?: string[];
}
```

### React Zod vs NestJS DTO 비교

```
// React (프론트엔드) — Zod
const createSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력하세요'),
  type: z.enum(['ADMIN', 'MEMBER']),
});

// NestJS (백엔드) — DTO + class-validator
export class CreateUserDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email: string;

  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다' })
  password: string;

  @IsNotEmpty()
  name: string;

  @IsEnum(UserType)
  type?: UserType;
}
```

**왜 프론트와 백엔드 양쪽에서 검증할까?**
- 프론트 검증: 사용자 경험 (빠른 피드백, 제출 전 확인)
- 백엔드 검증: 보안 (프론트 검증은 우회 가능하므로 최종 방어선)

---

## 9. Prisma — 데이터베이스와 대화하기

Prisma는 TypeScript로 DB를 조작할 수 있게 해주는 ORM(Object-Relational Mapping)입니다.
SQL 쿼리를 직접 쓰지 않아도 됩니다.

### Prisma 스키마 (설계도)

```prisma
// backend/prisma/schema.prisma
model User {
  id        String   @id @default(cuid())   // 고유 ID, 자동 생성
  email     String   @unique                 // 이메일, 중복 불가
  password  String                           // 비밀번호 (암호화된 상태)
  name      String                           // 이름
  type      UserType @default(ADMIN)         // 타입 (기본값: ADMIN)
  isActive  Boolean  @default(true)          // 활성 여부
  createdAt DateTime @default(now())         // 생성일 (자동)
  updatedAt DateTime @updatedAt              // 수정일 (자동)

  // 관계 (Relations)
  roles     UserRole[] @relation("UserRoles") // 이 유저의 역할들

  @@map("users")  // 실제 DB 테이블명: "users"
}
```

### Prisma 사용법 — CRUD 예시

```typescript
// ===== 생성 (Create) =====
const user = await this.prisma.user.create({
  data: {                    // 저장할 데이터
    email: 'editor@cms.com',
    password: hashedPassword,
    name: '홍길동',
    type: 'ADMIN',
  },
});
// SQL: INSERT INTO users (email, password, name, type) VALUES (...)

// ===== 조회 (Read) — 목록 =====
const users = await this.prisma.user.findMany({
  where: {                   // 조건 (WHERE)
    type: 'ADMIN',
    name: { contains: '홍', mode: 'insensitive' }, // 이름에 "홍" 포함 (대소문자 무시)
  },
  select: {                  // 가져올 필드만 지정
    id: true,
    email: true,
    name: true,
    // password: false ← 비밀번호는 제외!
  },
  orderBy: { createdAt: 'desc' },  // 최신순 정렬
  skip: 0,                         // 건너뛸 개수 (페이지네이션)
  take: 20,                        // 가져올 개수
});
// SQL: SELECT id, email, name FROM users WHERE type='ADMIN' AND name ILIKE '%홍%' ORDER BY created_at DESC LIMIT 20

// ===== 조회 (Read) — 단일 =====
const user = await this.prisma.user.findUnique({
  where: { id: 'abc123' },  // ID로 찾기
});
// SQL: SELECT * FROM users WHERE id = 'abc123'

// ===== 수정 (Update) =====
const updated = await this.prisma.user.update({
  where: { id: 'abc123' },
  data: { name: '김철수', isActive: false },
});
// SQL: UPDATE users SET name='김철수', is_active=false WHERE id='abc123'

// ===== 삭제 (Delete) =====
await this.prisma.user.delete({
  where: { id: 'abc123' },
});
// SQL: DELETE FROM users WHERE id = 'abc123'

// ===== 개수 세기 (Count) =====
const total = await this.prisma.user.count({
  where: { type: 'ADMIN' },
});
// SQL: SELECT COUNT(*) FROM users WHERE type='ADMIN'
```

### 관계(Relation) 데이터 포함하기

```typescript
// 사용자 조회 시 역할 정보도 함께 가져오기
const user = await this.prisma.user.findUnique({
  where: { id: 'abc123' },
  select: {
    id: true,
    name: true,
    email: true,
    roles: {                    // UserRole 관계 포함
      where: { status: 'ACTIVE' },  // 활성 역할만
      select: {
        role: {                     // Role 테이블까지 조인
          select: { id: true, name: true, slug: true },
        },
      },
    },
  },
});

// 결과:
// {
//   id: 'abc123',
//   name: '홍길동',
//   email: 'hong@cms.com',
//   roles: [
//     { role: { id: 'role1', name: '편집자', slug: 'editor' } },
//     { role: { id: 'role2', name: '뷰어', slug: 'viewer' } },
//   ]
// }
```

### Promise.all — 여러 DB 작업 동시 실행

```typescript
// ❌ 느린 방법: 순서대로 하나씩
const users = await this.prisma.user.findMany({ ... });
const total = await this.prisma.user.count({ ... });
// → 합쳐서 200ms

// ✅ 빠른 방법: 동시에 실행
const [users, total] = await Promise.all([
  this.prisma.user.findMany({ ... }),
  this.prisma.user.count({ ... }),
]);
// → 동시에 실행하므로 100ms (더 빠름!)
```

React에서도 여러 API를 동시에 호출할 때 `Promise.all` 쓰시죠? 같은 원리입니다.

---

## 10. Guard & Decorator — 보안과 인증

### Guard (가드) — "들어와도 되는지 확인"

Guard는 요청이 Controller에 도달하기 전에 체크하는 보안 관문입니다.
React의 `AuthGuard` 컴포넌트와 같은 역할입니다.

```
요청 → [JwtAuthGuard] → [PermissionsGuard] → Controller → Service
         "로그인했나?"    "권한이 있나?"        "요청 처리"    "로직 실행"
```

```typescript
// 클래스 전체에 가드 적용 (모든 엔드포인트)
@UseGuards(JwtAuthGuard)
export class UserController {

  // 특정 엔드포인트에만 추가 가드
  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('user:create', 'user:*', '*')
  // ↑ 'user:create' 또는 'user:*' 또는 '*' 권한 중 하나라도 있으면 허용
  create(@Body() dto: CreateUserDto) { ... }
}
```

**JwtAuthGuard**: JWT 토큰이 유효한지 확인
- 프론트에서 `Authorization: Bearer eyJhbG...` 헤더로 보내는 토큰을 검증

**PermissionsGuard**: 사용자의 역할에 필요한 권한이 있는지 확인
- DB에서 사용자의 역할 → 권한 목록을 조회하여 비교

### Decorator (데코레이터) — "추가 정보 붙이기"

```typescript
// 커스텀 데코레이터: 현재 로그인한 사용자 정보 가져오기
@Delete(':id')
remove(
  @Param('id') id: string,              // URL에서 삭제할 사용자 ID
  @CurrentUser('id') currentUserId: string,  // JWT에서 현재 로그인 사용자 ID
) {
  return this.userService.remove(id, currentUserId);
  // → Service에서 "자기 자신은 삭제 불가" 체크
}
```

React와 비교:
```javascript
// React (프론트엔드)
const { user } = useUser();        // Context에서 현재 사용자
const { id } = useParams();        // URL에서 파라미터

// NestJS (백엔드)
@CurrentUser('id') currentUserId   // JWT에서 현재 사용자
@Param('id') id                    // URL에서 파라미터
```

---

## 11. 전체 요청 흐름 정리

프론트엔드에서 `api.post('/users', { email, password, name })` 호출 시:

```
1. [프론트엔드] api.post('/users', { email: 'a@b.com', password: '12345678', name: '홍길동' })
   → Axios가 HTTP POST 요청 전송
   → Authorization 헤더에 JWT 토큰 자동 첨부 (인터셉터)

2. [NestJS 서버] 요청 수신 (POST /users)

3. [JwtAuthGuard] JWT 토큰 검증
   → 유효하면 통과, 무효하면 401 응답

4. [PermissionsGuard] 권한 확인
   → user:create 권한이 있으면 통과, 없으면 403 응답

5. [ValidationPipe + DTO] 요청 body 검증
   → CreateUserDto 규칙에 맞는지 확인
   → 이메일 형식 안 맞으면 400 응답

6. [UserController.create()] 요청 수신
   → body에서 CreateUserDto 추출
   → userService.create(dto) 호출

7. [UserService.create()] 비즈니스 로직
   → 이메일 중복 확인 (있으면 409 응답)
   → 비밀번호 암호화
   → Prisma로 DB에 사용자 생성
   → 역할 할당
   → 생성된 사용자 반환

8. [프론트엔드] 응답 수신
   → { id: '...', email: 'a@b.com', name: '홍길동', roles: [...] }
   → queryClient.invalidateQueries로 목록 갱신
   → navigate('/users')로 페이지 이동
```

---

## 12. 자주 쓰는 패턴 모음

### 패턴 1: 페이지네이션

```typescript
// Service
async findAll(params: { page?: number; limit?: number }) {
  const { page = 1, limit = 20 } = params;

  const [data, total] = await Promise.all([
    this.prisma.user.findMany({
      skip: (page - 1) * limit,  // 건너뛸 개수
      take: limit,                // 가져올 개수
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.user.count(),     // 전체 개수
  ]);

  return {
    data,
    meta: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

프론트에서 사용:
```javascript
const { data: result } = useQuery({
  queryKey: ['users', page],
  queryFn: () => api.get(`/users?page=${page}&limit=20`).then(r => r.data),
});
const users = result?.data || [];
const meta = result?.meta || { total: 0, page: 1, totalPages: 1 };
```

### 패턴 2: 검색 + 필터

```typescript
// Service
async findAll(params: { type?: string; search?: string }) {
  const where: any = {};

  if (params.type) {
    where.type = params.type;  // 정확한 일치
  }

  if (params.search) {
    where.OR = [               // 이름 또는 이메일에 포함
      { name: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  return this.prisma.user.findMany({ where });
}
```

### 패턴 3: 소프트 삭제 (Soft Delete)

```typescript
// 실제 삭제 대신 deletedAt 필드에 시간 기록
async remove(id: string) {
  return this.prisma.content.update({
    where: { id },
    data: { deletedAt: new Date() },  // 삭제 표시만
  });
}

// 조회 시 삭제된 항목 제외
async findAll() {
  return this.prisma.content.findMany({
    where: { deletedAt: null },  // deletedAt이 없는 것만
  });
}
```

### 패턴 4: 비밀번호 절대 노출하지 않기

```typescript
// select로 필요한 필드만 지정 (password 제외)
private userSelect() {
  return {
    id: true,
    email: true,
    name: true,
    type: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    // password는 포함하지 않음!
  };
}

// 사용
const user = await this.prisma.user.findUnique({
  where: { id },
  select: this.userSelect(),
});
```

---

## 용어 사전

| 용어 | 설명 | React 대응 |
|---|---|---|
| **Module** | 관련 기능을 묶는 단위 | App.jsx의 Route 그룹 |
| **Controller** | HTTP 요청을 받는 클래스 | Page 컴포넌트 |
| **Service** | 비즈니스 로직을 처리하는 클래스 | Provider, lib/ 함수 |
| **DTO** | 데이터 전송 객체, 검증 규칙 정의 | Zod 스키마 |
| **Guard** | 요청 전 보안 검증 | AuthGuard 컴포넌트 |
| **Decorator** | 클래스/메서드에 메타데이터 추가 | React에 없는 개념 (`@Get`, `@Post` 등) |
| **Dependency Injection** | NestJS가 자동으로 인스턴스 생성/주입 | useContext() |
| **Prisma** | DB를 TypeScript로 조작하는 ORM | React Query (데이터 접근 계층) |
| **ORM** | Object-Relational Mapping, DB 추상화 | - |
| **Migration** | DB 스키마 변경 이력 관리 | - |
| **JWT** | JSON Web Token, 인증 토큰 | localStorage의 accessToken |

---

## 다음 학습 추천

1. **Swagger UI 확인하기**: `http://localhost:3000/api-docs` 접속 → 모든 API를 브라우저에서 테스트 가능
2. **기존 모듈 읽어보기**: `backend/src/content/` 폴더의 코드를 이 문서와 대조하며 읽어보기
3. **Prisma Studio**: `npx prisma studio` 실행 → 브라우저에서 DB 데이터를 직접 확인/수정 가능
