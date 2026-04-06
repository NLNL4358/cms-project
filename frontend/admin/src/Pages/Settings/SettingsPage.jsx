/**
 * @description
 * 시스템 설정 페이지
 * 사이트 기본 정보, 관리 설정 등을 관리합니다.
 */
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Image, Globe, Clock, Mail, FileText } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { usePopup } from '@/Providers/PopupContext';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { Label } from '@/Components/ui/label.jsx';
import { Textarea } from '@/Components/ui/textarea.jsx';
import { Switch } from '@/Components/ui/switch.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/Select.jsx';
import AlertPopup from '@/Components/common/AlertPopup.jsx';
import MediaPickerPopup from '@/Components/common/MediaPickerPopup.jsx';
import { getMediaUrl } from '@/lib/media-utils.js';
import '@/CSS/local/settings.css';

const TIMEZONE_OPTIONS = [
    { value: 'Asia/Seoul', label: 'Asia/Seoul (KST, +09:00)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, +09:00)' },
    { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST, +08:00)' },
    { value: 'America/New_York', label: 'America/New_York (EST, -05:00)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST, -08:00)' },
    { value: 'Europe/London', label: 'Europe/London (GMT, +00:00)' },
    { value: 'Europe/Berlin', label: 'Europe/Berlin (CET, +01:00)' },
    { value: 'UTC', label: 'UTC (+00:00)' },
];

const DATE_FORMAT_OPTIONS = [
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-03-23)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (23/03/2026)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (03/23/2026)' },
    { value: 'YYYY.MM.DD', label: 'YYYY.MM.DD (2026.03.23)' },
];

/** Prisma JSON 필드에서 가져온 값을 문자열로 안전하게 변환 (빈 문자열도 fallback) */
function toStr(val, fallback = '') {
    if (val === null || val === undefined || val === '') return fallback;
    if (typeof val === 'string') return val;
    return String(val);
}

function SettingsPage() {
    const api = useAPI();
    const queryClient = useQueryClient();
    const { makePopup, closePopup } = usePopup();

    const { register, handleSubmit, reset, setValue, watch, control } = useForm({
        defaultValues: {
            siteName: '',
            siteDescription: '',
            siteUrl: '',
            adminEmail: '',
            logoUrl: '',
            faviconUrl: '',
            timezone: 'Asia/Seoul',
            dateFormat: 'YYYY-MM-DD',
            postsPerPage: 10,
            maintenanceMode: false,
            // 이메일 설정
            emailEnabled: false,
            smtpHost: '',
            smtpPort: 587,
            smtpUser: '',
            smtpPassword: '',
            smtpSecure: false,
            fromName: '',
            fromEmail: '',
        },
    });

    const logoUrl = watch('logoUrl');
    const faviconUrl = watch('faviconUrl');
    const maintenanceMode = watch('maintenanceMode');
    const emailEnabled = watch('emailEnabled');
    const smtpSecure = watch('smtpSecure');
    const adminEmail = watch('adminEmail');

    // 설정 불러오기
    const { data: settings, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: () => api.get('/settings').then((r) => r.data),
    });

    // 설정값으로 폼 초기화
    useEffect(() => {
        if (settings) {
            reset({
                siteName: toStr(settings.siteName),
                siteDescription: toStr(settings.siteDescription),
                siteUrl: toStr(settings.siteUrl),
                adminEmail: toStr(settings.adminEmail),
                logoUrl: toStr(settings.logoUrl),
                faviconUrl: toStr(settings.faviconUrl),
                timezone: toStr(settings.timezone, 'Asia/Seoul'),
                dateFormat: toStr(settings.dateFormat, 'YYYY-MM-DD'),
                postsPerPage: settings.postsPerPage ?? 10,
                maintenanceMode: Boolean(settings.maintenanceMode),
                emailEnabled: Boolean(settings.emailEnabled),
                smtpHost: toStr(settings.smtpHost),
                smtpPort: settings.smtpPort ?? 587,
                smtpUser: toStr(settings.smtpUser),
                smtpPassword: '', // 마스킹된 값 표시 안 함, 비워두면 기존 값 유지
                smtpSecure: Boolean(settings.smtpSecure),
                fromName: toStr(settings.fromName),
                fromEmail: toStr(settings.fromEmail),
            });
        }
    }, [settings, reset]);

    // 저장
    const saveMutation = useMutation({
        mutationFn: (data) =>
            api.patch('/settings', { settings: data }).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            makePopup(
                <AlertPopup
                    title="저장 완료"
                    body="설정이 성공적으로 저장되었습니다."
                    buttonFunction={() => closePopup()}
                />,
            );
        },
        onError: (error) => {
            const message =
                error.response?.data?.message || '설정 저장에 실패했습니다';
            makePopup(
                <AlertPopup
                    title="저장 실패"
                    body={message}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    const onSubmit = (data) => {
        const payload = {
            ...data,
            postsPerPage: Number(data.postsPerPage),
            smtpPort: Number(data.smtpPort) || 587,
        };
        // smtpPassword가 비어있으면 보내지 않음 (기존 값 유지)
        if (!payload.smtpPassword) {
            delete payload.smtpPassword;
        }
        saveMutation.mutate(payload);
    };

    // 미디어 선택 팝업
    const openMediaPicker = (fieldName) => {
        makePopup(
            <MediaPickerPopup
                mode="image"
                onSelect={(media) => {
                    setValue(fieldName, media.url);
                    closePopup();
                }}
                onClose={() => closePopup()}
            />,
        );
    };

    if (isLoading) {
        return (
            <div className="formPageWrap">
                <div className="formPageHead">
                    <h2 className="text-2xl font-bold">시스템 설정</h2>
                </div>
                <div className="settingsLoading">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="sectionBox">
                            <div className="settingsSkeletonTitle" />
                            <div className="settingsSkeletonField" />
                            <div className="settingsSkeletonField" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="formPageWrap">
            <div className="formPageHead">
                <div className="flex gap-3 items-center">
                    <div className="settingsIcon">
                        <Settings className="size-5" />
                    </div>
                    <h2 className="text-2xl font-bold">시스템 설정</h2>
                </div>
                <p className="pageDescription">
                    사이트의 기본 정보와 관리 옵션을 설정합니다
                </p>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
            >
                {/* 사이트 기본 정보 */}
                <div className="sectionBox">
                    <div className="sectionTitle">
                        <div className="sectionTitleBar" />
                        <h5>사이트 기본 정보</h5>
                    </div>
                    <div className="contentColumnWrap">
                        <div className="flex flex-col">
                            <Label htmlFor="siteName">사이트 이름</Label>
                            <Input
                                id="siteName"
                                placeholder="예: My Website"
                                {...register('siteName')}
                            />
                            <p className="helpText text-muted-foreground">
                                사이드바 로고 영역에 표시됩니다
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="siteDescription">사이트 설명</Label>
                            <Textarea
                                id="siteDescription"
                                placeholder="사이트에 대한 간단한 설명"
                                {...register('siteDescription')}
                            />
                        </div>

                        <div className="settingsRow">
                            <div className="flex flex-col flex-1">
                                <Label htmlFor="siteUrl">
                                    <Globe className="size-3.5 inline mr-1" />
                                    사이트 URL
                                </Label>
                                <Input
                                    id="siteUrl"
                                    placeholder="https://example.com"
                                    {...register('siteUrl')}
                                />
                                <p className="helpText text-muted-foreground">
                                    이메일 알림, sitemap 등에서 참조하는 사이트
                                    주소입니다
                                </p>
                            </div>
                            <div className="flex flex-col flex-1">
                                <Label htmlFor="adminEmail">
                                    <Mail className="size-3.5 inline mr-1" />
                                    관리자 연락 이메일
                                </Label>
                                <Input
                                    id="adminEmail"
                                    type="email"
                                    placeholder="admin@example.com"
                                    {...register('adminEmail')}
                                />
                                <p className="helpText text-muted-foreground">
                                    시스템 알림 발송에 사용되는 이메일입니다
                                    (로그인 계정과 별개)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 로고 & 파비콘 */}
                <div className="sectionBox">
                    <div className="sectionTitle">
                        <div className="sectionTitleBar" />
                        <h5>로고 & 파비콘</h5>
                    </div>
                    <div className="settingsMediaRow">
                        <div className="settingsMediaItem">
                            <Label>
                                <Image className="size-3.5 inline mr-1" />
                                사이트 로고
                            </Label>
                            <p className="helpText text-muted-foreground">
                                사이드바 상단에 표시됩니다
                            </p>
                            {logoUrl ? (
                                <div className="settingsMediaPreview">
                                    <img
                                        src={getMediaUrl(logoUrl)}
                                        alt="로고"
                                        className="settingsMediaImg"
                                    />
                                    <div className="settingsMediaBtns">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                openMediaPicker('logoUrl')
                                            }
                                        >
                                            변경
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setValue('logoUrl', '')
                                            }
                                        >
                                            제거
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="settingsMediaEmpty"
                                    onClick={() =>
                                        openMediaPicker('logoUrl')
                                    }
                                >
                                    <Image className="size-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        로고 이미지 선택
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="settingsMediaItem">
                            <Label>
                                <FileText className="size-3.5 inline mr-1" />
                                파비콘
                            </Label>
                            <p className="helpText text-muted-foreground">
                                브라우저 탭에 표시되는 아이콘입니다
                            </p>
                            {faviconUrl ? (
                                <div className="settingsMediaPreview">
                                    <img
                                        src={getMediaUrl(faviconUrl)}
                                        alt="파비콘"
                                        className="settingsMediaImg settingsMediaImgSmall"
                                    />
                                    <div className="settingsMediaBtns">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                openMediaPicker('faviconUrl')
                                            }
                                        >
                                            변경
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setValue('faviconUrl', '')
                                            }
                                        >
                                            제거
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="settingsMediaEmpty"
                                    onClick={() =>
                                        openMediaPicker('faviconUrl')
                                    }
                                >
                                    <FileText className="size-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        파비콘 이미지 선택
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 표시 설정 */}
                <div className="sectionBox">
                    <div className="sectionTitle">
                        <div className="sectionTitleBar" />
                        <h5>표시 설정</h5>
                    </div>
                    <div className="contentColumnWrap">
                        <div className="settingsRow">
                            <div className="flex flex-col flex-1">
                                <Label>
                                    <Clock className="size-3.5 inline mr-1" />
                                    타임존
                                </Label>
                                <Controller
                                    control={control}
                                    name="timezone"
                                    render={({ field }) => (
                                        <Select
                                            key={`tz-${field.value}`}
                                            value={field.value || 'Asia/Seoul'}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="타임존 선택" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIMEZONE_OPTIONS.map((tz) => (
                                                    <SelectItem
                                                        key={tz.value}
                                                        value={tz.value}
                                                    >
                                                        {tz.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="flex flex-col flex-1">
                                <Label>날짜 형식</Label>
                                <Controller
                                    control={control}
                                    name="dateFormat"
                                    render={({ field }) => (
                                        <Select
                                            key={`df-${field.value}`}
                                            value={field.value || 'YYYY-MM-DD'}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="날짜 형식 선택" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DATE_FORMAT_OPTIONS.map(
                                                    (df) => (
                                                        <SelectItem
                                                            key={df.value}
                                                            value={df.value}
                                                        >
                                                            {df.label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <Label htmlFor="postsPerPage">
                                페이지당 표시 개수
                            </Label>
                            <Input
                                id="postsPerPage"
                                type="number"
                                min={1}
                                max={100}
                                {...register('postsPerPage')}
                            />
                            <p className="helpText text-muted-foreground">
                                목록 페이지에서 한 번에 표시할 항목 수
                            </p>
                        </div>
                    </div>
                </div>

                {/* 유지보수 모드 */}
                <div className="sectionBox">
                    <div className="sectionTitle">
                        <div className="sectionTitleBar" />
                        <h5>시스템</h5>
                    </div>
                    <div className="settingsMaintenanceRow">
                        <div className="settingsMaintenanceInfo">
                            <span className="settingsMaintenanceLabel">
                                유지보수 모드
                            </span>
                            <span className="settingsMaintenanceDesc">
                                활성화하면 관리자 외 접속자에게 유지보수 안내
                                페이지가 표시됩니다
                            </span>
                        </div>
                        <Switch
                            checked={Boolean(maintenanceMode)}
                            onCheckedChange={(v) =>
                                setValue('maintenanceMode', v)
                            }
                        />
                    </div>
                </div>

                {/* 이메일 발송 (SMTP) */}
                <div className="sectionBox">
                    <div className="sectionTitle">
                        <div className="sectionTitleBar" />
                        <h5>이메일 발송 설정 (SMTP)</h5>
                    </div>

                    <div className="settingsMaintenanceRow">
                        <div className="settingsMaintenanceInfo">
                            <span className="settingsMaintenanceLabel">
                                이메일 발송 활성화
                            </span>
                            <span className="settingsMaintenanceDesc">
                                회원 가입 인증, 비밀번호 재설정, 알림 등에 이메일을 사용합니다.
                                비활성화 시 콘솔에 출력만 됩니다.
                            </span>
                        </div>
                        <Switch
                            checked={Boolean(emailEnabled)}
                            onCheckedChange={(v) => setValue('emailEnabled', v)}
                        />
                    </div>

                    {emailEnabled && (
                        <>
                            <div className="settingsEmailGuide">
                                <strong>📚 SMTP 설정 가이드</strong>
                                <ul>
                                    <li>
                                        <b>Gmail:</b> smtp.gmail.com / 587 / 2단계 인증 후{' '}
                                        <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">앱 비밀번호 발급</a>
                                    </li>
                                    <li>
                                        <b>Naver:</b> smtp.naver.com / 587 / 메일 환경설정에서 IMAP/SMTP 사용 ON
                                    </li>
                                    <li>
                                        <b>SendGrid:</b> smtp.sendgrid.net / 587 / API 키 발급 후 사용자명: apikey
                                    </li>
                                </ul>
                            </div>

                            <div className="contentColumnWrap">
                                <div className="settingsRow">
                                    <div className="flex flex-col flex-1">
                                        <Label>SMTP 호스트</Label>
                                        <Input
                                            placeholder="smtp.gmail.com"
                                            {...register('smtpHost')}
                                        />
                                    </div>
                                    <div className="flex flex-col" style={{ width: '120px' }}>
                                        <Label>포트</Label>
                                        <Input
                                            type="number"
                                            placeholder="587"
                                            {...register('smtpPort')}
                                        />
                                    </div>
                                </div>

                                <div className="settingsRow">
                                    <div className="flex flex-col flex-1">
                                        <Label>SMTP 사용자명 (이메일)</Label>
                                        <Input
                                            placeholder="your@gmail.com"
                                            {...register('smtpUser')}
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <Label>SMTP 비밀번호 / 앱 비밀번호</Label>
                                        <Input
                                            type="password"
                                            placeholder="새로 입력 시에만 변경됨"
                                            {...register('smtpPassword')}
                                        />
                                    </div>
                                </div>

                                <div className="settingsRow">
                                    <div className="flex flex-col flex-1">
                                        <Label>발신자 이름</Label>
                                        <Input
                                            placeholder="ContentCMS"
                                            {...register('fromName')}
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <Label>발신자 이메일</Label>
                                        <Input
                                            placeholder="noreply@example.com"
                                            {...register('fromEmail')}
                                        />
                                    </div>
                                </div>

                                <div className="settingsMaintenanceRow">
                                    <div className="settingsMaintenanceInfo">
                                        <span className="settingsMaintenanceLabel">
                                            SSL/TLS 사용
                                        </span>
                                        <span className="settingsMaintenanceDesc">
                                            465 포트는 ON, 587 포트는 보통 OFF (STARTTLS 자동)
                                        </span>
                                    </div>
                                    <Switch
                                        checked={Boolean(smtpSecure)}
                                        onCheckedChange={(v) =>
                                            setValue('smtpSecure', v)
                                        }
                                    />
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={async () => {
                                        if (!adminEmail) {
                                            makePopup(
                                                <AlertPopup
                                                    title="테스트 이메일 주소 필요"
                                                    body="먼저 '관리자 연락 이메일' 필드에 테스트 받을 이메일을 입력하세요."
                                                    buttonFunction={() => closePopup()}
                                                />,
                                            );
                                            return;
                                        }
                                        try {
                                            const res = await api.post('/email/test', { to: adminEmail });
                                            makePopup(
                                                <AlertPopup
                                                    title="테스트 발송 완료"
                                                    body={
                                                        res.data?.fallback
                                                            ? '이메일 발송이 비활성화되어 있어 콘솔에 출력되었습니다. 백엔드 로그를 확인하세요.'
                                                            : `${adminEmail}로 테스트 메일을 발송했습니다. 받은편지함을 확인하세요.`
                                                    }
                                                    buttonFunction={() => closePopup()}
                                                />,
                                            );
                                        } catch (error) {
                                            makePopup(
                                                <AlertPopup
                                                    title="테스트 발송 실패"
                                                    body={error.response?.data?.message || '발송에 실패했습니다. 설정을 먼저 저장하세요.'}
                                                    buttonFunction={() => closePopup()}
                                                />,
                                            );
                                        }
                                    }}
                                >
                                    📧 테스트 이메일 발송
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {/* 하단 버튼 */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            if (settings) {
                                reset({
                                    siteName: toStr(settings.siteName),
                                    siteDescription: toStr(settings.siteDescription),
                                    siteUrl: toStr(settings.siteUrl),
                                    adminEmail: toStr(settings.adminEmail),
                                    logoUrl: toStr(settings.logoUrl),
                                    faviconUrl: toStr(settings.faviconUrl),
                                    timezone: toStr(settings.timezone, 'Asia/Seoul'),
                                    dateFormat: toStr(settings.dateFormat, 'YYYY-MM-DD'),
                                    postsPerPage: settings.postsPerPage ?? 10,
                                    maintenanceMode: Boolean(settings.maintenanceMode),
                                });
                            }
                        }}
                    >
                        초기화
                    </Button>
                    <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? '저장 중...' : '설정 저장'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default SettingsPage;
