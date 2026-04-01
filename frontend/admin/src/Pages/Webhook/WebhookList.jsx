/**
 * @description
 * Webhook 관리 페이지 (목록 + 생성/수정 인라인)
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Webhook,
    Plus,
    Pencil,
    Trash2,
    Send,
    X,
    HelpCircle,
} from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { usePopup } from '@/Providers/PopupContext';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { Label } from '@/Components/ui/label.jsx';
import { Switch } from '@/Components/ui/switch.jsx';
import AlertPopup from '@/Components/common/AlertPopup.jsx';
import YesNoPopup from '@/Components/common/YesNoPopup.jsx';
import '@/CSS/local/webhook.css';

const AVAILABLE_EVENTS = [
    { value: 'content:create', label: '콘텐츠 생성' },
    { value: 'content:update', label: '콘텐츠 수정' },
    { value: 'content:delete', label: '콘텐츠 삭제' },
    { value: 'media:create', label: '파일 업로드' },
    { value: 'media:delete', label: '파일 삭제' },
    { value: 'user:create', label: '사용자 생성' },
    { value: 'user:delete', label: '사용자 삭제' },
    { value: 'setting:update', label: '설정 변경' },
    { value: '*', label: '모든 이벤트' },
];

function WebhookList() {
    const api = useAPI();
    const queryClient = useQueryClient();
    const { makePopup, closePopup } = usePopup();

    const [editing, setEditing] = useState(null); // null | 'new' | webhookId
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        events: [],
        secret: '',
        isActive: true,
    });

    // Webhook 목록
    const { data: webhooks = [], isLoading } = useQuery({
        queryKey: ['webhooks'],
        queryFn: () => api.get('/webhooks').then((r) => r.data),
    });

    // 저장
    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (editing === 'new') {
                return api.post('/webhooks', data);
            }
            return api.patch(`/webhooks/${editing}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            setEditing(null);
            makePopup(
                <AlertPopup
                    title="저장 완료"
                    body="Webhook이 저장되었습니다."
                    buttonFunction={() => closePopup()}
                />,
            );
        },
        onError: (error) => {
            const msg = error.response?.data?.message;
            const message = Array.isArray(msg) ? msg.join('\n') : msg || '저장에 실패했습니다';
            makePopup(
                <AlertPopup
                    title="저장 실패"
                    body={message}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    // 삭제
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/webhooks/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            makePopup(
                <AlertPopup
                    title="삭제 완료"
                    body="Webhook이 삭제되었습니다."
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    // 테스트 발송
    const testMutation = useMutation({
        mutationFn: (id) => api.post(`/webhooks/${id}/test`).then((r) => r.data),
        onSuccess: (data) => {
            if (data.success) {
                makePopup(
                    <AlertPopup
                        title="테스트 성공"
                        body="테스트 요청이 정상적으로 발송되었습니다."
                        buttonFunction={() => closePopup()}
                    />,
                );
            } else {
                makePopup(
                    <AlertPopup
                        title="발송 실패"
                        body={`URL로 요청을 보냈으나 실패했습니다.\n\n${data.message || ''}`}
                        buttonFunction={() => closePopup()}
                    />,
                );
            }
        },
        onError: (error) => {
            makePopup(
                <AlertPopup
                    title="테스트 실패"
                    body={error.response?.data?.message || '발송에 실패했습니다'}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    const handleDelete = (webhook) => {
        makePopup(
            <YesNoPopup
                title="Webhook 삭제"
                body={`"${webhook.name}" Webhook을 삭제하시겠습니까?`}
                buttonFunction={{
                    left: () => {
                        closePopup();
                        deleteMutation.mutate(webhook.id);
                    },
                    right: () => closePopup(),
                }}
            />,
        );
    };

    const startEdit = (webhook) => {
        setEditing(webhook.id);
        setFormData({
            name: webhook.name,
            url: webhook.url,
            events: Array.isArray(webhook.events) ? webhook.events : [],
            secret: webhook.secret || '',
            isActive: webhook.isActive,
        });
    };

    const startNew = () => {
        setEditing('new');
        setFormData({
            name: '',
            url: '',
            events: [],
            secret: '',
            isActive: true,
        });
    };

    const toggleEvent = (event) => {
        setFormData((prev) => ({
            ...prev,
            events: prev.events.includes(event)
                ? prev.events.filter((e) => e !== event)
                : [...prev.events, event],
        }));
    };

    const handleSave = () => {
        if (!formData.name.trim()) {
            makePopup(
                <AlertPopup
                    title="입력 오류"
                    body="Webhook 이름을 입력하세요."
                    buttonFunction={() => closePopup()}
                />,
            );
            return;
        }
        try {
            new URL(formData.url);
        } catch {
            makePopup(
                <AlertPopup
                    title="입력 오류"
                    body="올바른 URL 형식을 입력하세요. (예: https://hooks.slack.com/...)"
                    buttonFunction={() => closePopup()}
                />,
            );
            return;
        }
        saveMutation.mutate(formData);
    };

    const showHelp = () => {
        makePopup(
            <AlertPopup
                title="Webhook이란?"
                body={
                    <div className="webhookHelpBody">
                        <p className="webhookHelpDesc">
                            CMS에서 특정 이벤트(콘텐츠 생성, 파일 업로드 등)가
                            발생하면, 등록된 URL로 자동 알림을 보내는 기능입니다.
                        </p>
                        <div className="webhookHelpSection">
                            <strong>활용 예시</strong>
                            <ul className="webhookHelpList">
                                <li>
                                    <span className="webhookHelpEmoji">💬</span>
                                    <span>콘텐츠 발행 → <b>Slack 채널</b>에 자동 알림</span>
                                </li>
                                <li>
                                    <span className="webhookHelpEmoji">🔄</span>
                                    <span>콘텐츠 수정 → <b>Vercel</b> 사이트 자동 재빌드</span>
                                </li>
                                <li>
                                    <span className="webhookHelpEmoji">📧</span>
                                    <span>회원 가입 → <b>Zapier</b> 경유 → 이메일 마케팅 도구에 자동 등록</span>
                                </li>
                            </ul>
                        </div>
                        <div className="webhookHelpSection">
                            <strong>설정 방법</strong>
                            <ol className="webhookHelpSteps">
                                <li>외부 서비스에서 Webhook 수신 URL을 발급받습니다</li>
                                <li>"Webhook 추가" 버튼을 눌러 이름과 URL을 입력합니다</li>
                                <li>알림을 받을 이벤트를 선택합니다</li>
                                <li>저장하면 해당 이벤트 발생 시 자동으로 알림이 전송됩니다</li>
                            </ol>
                        </div>
                        <p className="webhookHelpNote">
                            시크릿 키를 설정하면 HMAC 서명으로 요청의 진위를 검증할 수 있습니다.
                        </p>
                    </div>
                }
                buttonFunction={() => closePopup()}
            />,
        );
    };

    return (
        <div className="formPageWrap webhookPageWrap">
            <div className="formPageHead">
                <div className="flex gap-3 items-center">
                    <div className="settingsIcon">
                        <Webhook className="size-5" />
                    </div>
                    <h2 className="text-2xl font-bold">Webhook 관리</h2>
                    <button
                        type="button"
                        className="webhookHelpBtn"
                        onClick={showHelp}
                        title="Webhook이란?"
                    >
                        <HelpCircle className="size-5" />
                    </button>
                </div>
                <p className="pageDescription">
                    콘텐츠 변경 시 외부 서비스에 자동으로 알림을 보냅니다
                </p>
            </div>

            {/* 추가 버튼 */}
            <div className="flex justify-end">
                <Button onClick={startNew} disabled={editing !== null}>
                    <Plus className="size-4 mr-1" />
                    Webhook 추가
                </Button>
            </div>

            {/* 생성 폼 */}
            {editing === 'new' && (
                <WebhookForm
                    formData={formData}
                    setFormData={setFormData}
                    toggleEvent={toggleEvent}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                    isPending={saveMutation.isPending}
                />
            )}

            {/* 목록 */}
            {isLoading ? (
                <div className="sectionBox">
                    <div className="auditLoading">불러오는 중...</div>
                </div>
            ) : webhooks.length === 0 && editing !== 'new' ? (
                <div className="sectionBox">
                    <div className="auditEmpty">
                        <Webhook className="size-10 text-muted-foreground" />
                        <p>등록된 Webhook이 없습니다</p>
                    </div>
                </div>
            ) : (
                <div className="webhookCards">
                    {webhooks.map((wh) =>
                        editing === wh.id ? (
                            <WebhookForm
                                key={wh.id}
                                formData={formData}
                                setFormData={setFormData}
                                toggleEvent={toggleEvent}
                                onSave={handleSave}
                                onCancel={() => setEditing(null)}
                                isPending={saveMutation.isPending}
                            />
                        ) : (
                            <div key={wh.id} className="sectionBox webhookCard">
                                <div className="webhookCardHeader">
                                    <div className="webhookCardInfo">
                                        <span className="webhookCardName">
                                            {wh.name}
                                        </span>
                                        <span
                                            className={`webhookStatusBadge ${wh.isActive ? 'webhookActive' : 'webhookInactive'}`}
                                        >
                                            {wh.isActive ? '활성' : '비활성'}
                                        </span>
                                    </div>
                                    <div className="webhookCardActions">
                                        <Button
                                            variant="outline"
                                            size="icon-sm"
                                            title="테스트 발송"
                                            onClick={() =>
                                                testMutation.mutate(wh.id)
                                            }
                                            disabled={testMutation.isPending}
                                        >
                                            <Send className="size-3.5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon-sm"
                                            title="수정"
                                            onClick={() => startEdit(wh)}
                                            disabled={editing !== null}
                                        >
                                            <Pencil className="size-3.5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon-sm"
                                            title="삭제"
                                            onClick={() => handleDelete(wh)}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="webhookCardUrl">{wh.url}</div>
                                <div className="webhookCardEvents">
                                    {(Array.isArray(wh.events)
                                        ? wh.events
                                        : []
                                    ).map((ev) => {
                                        const label =
                                            AVAILABLE_EVENTS.find(
                                                (e) => e.value === ev,
                                            )?.label || ev;
                                        return (
                                            <span
                                                key={ev}
                                                className="webhookEventTag"
                                            >
                                                {label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ),
                    )}
                </div>
            )}
        </div>
    );
}

/** Webhook 생성/수정 인라인 폼 */
function WebhookForm({
    formData,
    setFormData,
    toggleEvent,
    onSave,
    onCancel,
    isPending,
}) {
    return (
        <div className="sectionBox webhookFormBox">
            <div className="contentColumnWrap">
                <div className="settingsRow">
                    <div className="flex flex-col flex-1">
                        <Label>이름 *</Label>
                        <Input
                            placeholder="예: Slack 알림"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((p) => ({
                                    ...p,
                                    name: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="flex flex-col flex-1">
                        <Label>URL *</Label>
                        <Input
                            placeholder="https://hooks.slack.com/..."
                            value={formData.url}
                            onChange={(e) =>
                                setFormData((p) => ({
                                    ...p,
                                    url: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>

                <div className="settingsRow">
                    <div className="flex flex-col flex-1">
                        <Label>시크릿 키 (선택)</Label>
                        <Input
                            placeholder="HMAC 서명용 시크릿"
                            value={formData.secret}
                            onChange={(e) =>
                                setFormData((p) => ({
                                    ...p,
                                    secret: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                        <Label>활성 상태</Label>
                        <Switch
                            checked={formData.isActive}
                            onCheckedChange={(v) =>
                                setFormData((p) => ({ ...p, isActive: v }))
                            }
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <Label>이벤트 선택</Label>
                    <div className="webhookEventPicker">
                        {AVAILABLE_EVENTS.map((ev) => {
                            const active = formData.events.includes(ev.value);
                            return (
                                <button
                                    key={ev.value}
                                    type="button"
                                    className={`webhookEventBtn ${active ? 'webhookEventBtnActive' : ''}`}
                                    onClick={() => toggleEvent(ev.value)}
                                >
                                    {ev.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={onCancel}>
                    <X className="size-4 mr-1" />
                    취소
                </Button>
                <Button onClick={onSave} disabled={isPending}>
                    {isPending ? '저장 중...' : '저장'}
                </Button>
            </div>
        </div>
    );
}

export default WebhookList;
