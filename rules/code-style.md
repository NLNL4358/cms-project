# 코드 스타일 가이드

이 문서는 CMS 프로젝트의 코드 컨벤션을 정의한다.

---

## 목차

1. [공통 규칙](#1-공통-규칙)
2. [TypeScript 규칙](#2-typescript-규칙)
3. [프론트엔드 (React)](#3-프론트엔드-react)
4. [백엔드 (NestJS)](#4-백엔드-nestjs)
5. [Git 컨벤션](#5-git-컨벤션)

---

## 1. 공통 규칙

### 포매터 및 린터

| 도구 | 용도 |
|------|------|
| **Prettier** | 코드 포맷팅 |
| **ESLint** | 코드 품질 검사 |

### Prettier 설정

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### ESLint 설정

- TypeScript ESLint 사용
- Prettier와 통합

### 네이밍 규칙

| 유형 | 규칙 | 예시 |
|------|------|------|
| **파일명** | kebab-case | `user-profile.ts` |
| **폴더명** | kebab-case | `content-types/` |
| **컴포넌트 (React)** | PascalCase | `UserProfile.tsx` |
| **변수** | camelCase | `userName` |
| **상수** | UPPER_SNAKE_CASE | `API_BASE_URL` |
| **함수** | camelCase (동사 시작) | `getUserProfile()` |
| **클래스** | PascalCase | `ContentService` |
| **인터페이스** | PascalCase | `UserProfile` |
| **타입** | PascalCase | `ContentType` |
| **Enum** | PascalCase | `UserRole` |
| **Enum 멤버** | UPPER_SNAKE_CASE | `SUPER_ADMIN` |

### 주석 규칙

```typescript
// 단일 주석: 간단한 설명

/*
 * 여러 줄 주석:
 * 긴 설명이 필요할 때
 */

/**
 * JSDoc 주석: 함수/클래스 설명
 * @param url - API 요청 URL
 * @returns 사용자 정보
 */
function getUserProfile(url: string): Promise<User> {
  // ...
}
```

### 주석 사용 원칙

- 코드가 **무엇**을 하는지보다 **왜** 하는지 설명
- 자명한 코드에는 주석 불필요
- TODO, FIXME 등 태그 활용

```typescript
// TODO: 추후 캐싱 추가 필요
// FIXME: 에지 케이스 처리 필요
// NOTE: 외부 API 제약으로 인한 우회 처리
```

---

## 2. TypeScript 규칙

### 타입 정의

```typescript
// 인터페이스: 객체 구조 정의
interface User {
  id: string;
  name: string;
  email: string;
}

// 타입: 유니온, 조합 등
type UserRole = 'admin' | 'editor' | 'viewer';

// 제네릭 활용
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

### 타입 vs 인터페이스

| 사용 상황 | 선택 |
|----------|------|
| 객체 구조 정의 | `interface` |
| 유니온, 교차 타입 | `type` |
| 확장 가능성 있음 | `interface` |
| 단순 별칭 | `type` |

### any 사용 금지

```typescript
// Bad
function processData(data: any) { ... }

// Good
function processData(data: unknown) { ... }
function processData<T>(data: T) { ... }
```

### Optional 처리

```typescript
// Optional Chaining
const userName = user?.profile?.name;

// Nullish Coalescing
const displayName = userName ?? 'Anonymous';
```

### Enum vs Union

```typescript
// 간단한 경우: Union 사용 (권장)
type Status = 'draft' | 'published' | 'archived';

// 값 매핑 필요 시: Enum 사용
enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
}
```

---

## 3. 프론트엔드 (React)

### 컴포넌트 선언

```typescript
// 함수형 컴포넌트 + 화살표 함수
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button = ({ label, onClick, disabled = false }: ButtonProps) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
```

### Props 타입 정의

```typescript
// 컴포넌트명 + Props 접미사
interface ContentCardProps {
  content: Content;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// children 포함
interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}
```

### 이벤트 핸들러

```typescript
// handle 접두사 사용
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // ...
};

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

// Props로 전달 시 on 접두사
<Form onSubmit={handleSubmit} onChange={handleInputChange} />
```

### 훅 규칙

```typescript
// use 접두사 필수
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  // ...
  return { user, login, logout };
}

// 커스텀 훅은 항상 파일로 분리
// hooks/useAuth.ts
```

### 컴포넌트 구조

```typescript
// 1. 타입/인터페이스
interface ContentListProps {
  contentType: string;
}

// 2. 컴포넌트
export const ContentList = ({ contentType }: ContentListProps) => {
  // 3. 훅 호출 (최상단)
  const { data, isLoading } = useContents(contentType);
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  // 4. 이벤트 핸들러
  const handleRowClick = (id: string) => {
    setSelected(id);
    navigate(`/content/${contentType}/${id}`);
  };

  // 5. 조건부 렌더링
  if (isLoading) return <Skeleton />;
  if (!data) return <EmptyState />;

  // 6. JSX 반환
  return (
    <DataTable
      data={data}
      onRowClick={handleRowClick}
    />
  );
};
```

### 조건부 렌더링

```typescript
// 단순 조건: && 연산자
{isLoading && <Spinner />}

// 이항 조건: 삼항 연산자
{isError ? <ErrorMessage /> : <Content />}

// 복잡한 조건: 조기 반환
if (isLoading) return <Skeleton />;
if (isError) return <ErrorBoundary />;
return <Content />;
```

### 스타일링 (Tailwind CSS)

```typescript
// 클래스 조합: cn 유틸리티 사용
import { cn } from '@/lib/utils';

<button
  className={cn(
    'px-4 py-2 rounded-md',
    'bg-primary text-white',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
>
  {label}
</button>
```

### Import 순서

```typescript
// 1. React 관련
import { useState, useEffect } from 'react';

// 2. 외부 라이브러리
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

// 3. 내부 모듈 (절대 경로)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth';

// 4. 상대 경로
import { ContentCard } from './ContentCard';

// 5. 타입 (type import)
import type { Content } from '@/types';

// 6. 스타일
import './styles.css';
```

---

## 4. 백엔드 (NestJS)

### 모듈 구조

```typescript
// contents.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [ContentsController],
  providers: [ContentsService],
  exports: [ContentsService],
})
export class ContentsModule {}
```

### 컨트롤러

```typescript
// contents.controller.ts
@Controller('api/v1/contents/:contentType')
@UseGuards(JwtAuthGuard)
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  async findAll(
    @Param('contentType') contentType: string,
    @Query() query: ContentQueryDto
  ): Promise<PaginatedResponse<Content>> {
    return this.contentsService.findAll(contentType, query);
  }

  @Post()
  @Permissions('content:create')
  async create(
    @Param('contentType') contentType: string,
    @Body() dto: CreateContentDto,
    @CurrentUser() user: User
  ): Promise<Content> {
    return this.contentsService.create(contentType, dto, user);
  }
}
```

### 서비스

```typescript
// contents.service.ts
@Injectable()
export class ContentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    contentType: string,
    query: ContentQueryDto
  ): Promise<PaginatedResponse<Content>> {
    const { page = 1, limit = 20, search, sort } = query;

    const where = this.buildWhereClause(contentType, search);
    const orderBy = this.buildOrderBy(sort);

    const [items, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Private 메서드는 하단에 배치
  private buildWhereClause(contentType: string, search?: string) {
    // ...
  }
}
```

### DTO (Data Transfer Object)

```typescript
// dto/create-content.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContentDto {
  @ApiProperty({ description: '콘텐츠 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: '콘텐츠 슬러그' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: '필드 데이터' })
  @IsObject()
  data: Record<string, unknown>;
}
```

### 예외 처리

```typescript
// 표준 NestJS 예외 사용
throw new NotFoundException('Content not found');
throw new BadRequestException('Invalid content type');
throw new ForbiddenException('Permission denied');
throw new UnauthorizedException('Invalid credentials');

// 커스텀 예외
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : 500;

    response.status(status).json({
      success: false,
      error: {
        code: this.getErrorCode(exception),
        message: this.getMessage(exception),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
```

### 데코레이터 사용

```typescript
// 커스텀 데코레이터
// decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

// decorators/permissions.decorator.ts
export const Permissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

// 사용
@Get('profile')
async getProfile(@CurrentUser() user: User) {
  return user;
}
```

### Prisma 스키마 스타일

```prisma
// schema.prisma

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  userType  UserType @default(MEMBER)

  // 관계
  contents  Content[]

  // 메타데이터
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@map("users")
}

enum UserType {
  ADMIN
  MEMBER
}
```

---

## 5. Git 컨벤션

### 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `main` | 프로덕션 배포 |
| `develop` | 개발 통합 |
| `feature/*` | 기능 개발 |
| `fix/*` | 버그 수정 |
| `hotfix/*` | 긴급 수정 |

### 브랜치 네이밍

```
feature/content-type-crud
feature/page-builder-dnd
fix/login-token-refresh
hotfix/security-patch
```

### 커밋 메시지

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 타입

| 타입 | 설명 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `style` | 포맷팅 (코드 동작 변경 없음) |
| `refactor` | 리팩토링 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 설정 변경 |

#### 예시

```
feat(content): 콘텐츠 타입 CRUD 기능 추가

- 콘텐츠 타입 생성/수정/삭제 API 구현
- 필드 정의 스키마 검증 추가
- 관련 테스트 작성

Closes #123
```

```
fix(auth): 토큰 갱신 시 무한 루프 수정

리프레시 토큰 만료 시 로그아웃 처리가
되지 않아 무한 요청이 발생하는 문제 수정

Fixes #456
```

### PR (Pull Request) 규칙

```markdown
## 변경 사항
- 콘텐츠 타입 CRUD API 구현
- 필드 타입 검증 로직 추가

## 테스트
- [x] 유닛 테스트 통과
- [x] E2E 테스트 통과

## 스크린샷 (UI 변경 시)
[이미지]

## 관련 이슈
Closes #123
```

---

## 참고

- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [NestJS 공식 문서](https://docs.nestjs.com/)
- [React 공식 문서](https://react.dev/)
