/**
 * @description
 * API 키 관리 페이지
 * 외부 통합용 API 키를 발급/관리합니다.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Key,
    Plus,
    Trash2,
    Copy,
    Check,
    Power,
} from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { usePopup } from '@/Providers/PopupContext';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { Label } from '@/Components/ui/label.jsx';
import { Switch } from '@/Components/ui/switch.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/Select.jsx';
import AlertPopup from '@/Components/common/AlertPopup.jsx';
import YesNoPopup from '@/Components/common/YesNoPopup.jsx';
import '@/CSS/local/api-key.css';

function ApiKeyList() {
    const api = useAPI();
    const queryClient = useQueryClient();
    const { makePopup, closePopup } = usePopup();
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState(['public:read']);
    const [expiresIn, setExpiresIn] = useState('');
    const [copiedKey, setCopiedKey] = useState(null);

    const { data: keys = [], isLoading } = useQuery({
        queryKey: ['api-keys'],
        queryFn: () => api.get('/api-keys').then((r) => r.data),
        refetchOnMount: 'always',
    });

    const createMutation = useMutation({
        mutationFn: () => {
            const payload = { name, permissions };
            if (expiresIn) {
                const days = parseInt(expiresIn);
                if (days > 0) {
                    payload.expiresAt = new Date(Date.now() + days * 86400000).toISOString();
                }
            }
            return api.post('/api-keys', payload).then((r) => r.data);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            setName('');
            setPermissions(['public:read']);
            setExpiresIn('');
            makePopup(
                <AlertPopup
                    title="API 키가 생성되었습니다"
                    body={
                        <div className="apiKeyCreatedBody">
                            <p className="apiKeyWarning">
                                ⚠️ 이 키는 다시 표시되지 않습니다. 안전한
                                곳에 저장하세요.
                            </p>
                            <div className="apiKeyDisplay">
                                <code>{data.key}</code>
                                <button
                                    className="apiKeyCopyBtn"
                                    onClick={() => {
                                        navigator.clipboard.writeText(data.key);
                                    }}
                                >
                                    <Copy className="size-4" />
                                </button>
                            </div>
                            <p className="apiKeyUsage">
                                사용법:
                                <br />
                                <code>Authorization: Bearer {data.key.substring(0, 20)}...</code>
                            </p>
                        </div>
                    }
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }) =>
            api.patch(`/api-keys/${id}/toggle`, { isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/api-keys/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
        },
    });

    const handleDelete = (key) => {
        makePopup(
            <YesNoPopup
                title="API 키 삭제"
                body={`"${key.name}" 키를 삭제하시겠습니까?\n\n이 키를 사용하던 외부 앱은 즉시 접근이 차단됩니다.`}
                buttonFunction={{
                    left: () => {
                        closePopup();
                        deleteMutation.mutate(key.id);
                    },
                    right: () => closePopup(),
                }}
            />,
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="formPageWrap apiKeyPageWrap">
            <div className="formPageHead">
                <div className="flex gap-3 items-center">
                    <div className="settingsIcon">
                        <Key className="size-5" />
                    </div>
                    <h2 className="text-2xl font-bold">API 키 관리</h2>
                </div>
                <p className="pageDescription">
                    외부 프론트엔드 앱이 Public API에 접근하기 위한 API 키를
                    발급합니다
                </p>
            </div>

            {/* 키 생성 */}
            <div className="sectionBox">
                <div className="sectionTitle">
                    <div className="sectionTitleBar" />
                    <h5>새 API 키 발급</h5>
                </div>
                <div className="apiKeyCreateForm">
                    <div className="apiKeyCreateRow">
                        <Input
                            placeholder="키 이름 (예: 메인 사이트 프론트엔드)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="apiKeyCreateRow">
                        <div className="flex flex-wrap gap-2">
                            {['public:read', 'public:write', '*'].map((perm) => (
                                <label key={perm} className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={permissions.includes(perm)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setPermissions([...permissions, perm]);
                                            } else {
                                                setPermissions(permissions.filter((p) => p !== perm));
                                            }
                                        }}
                                    />
                                    <span className="text-sm">
                                        {perm === 'public:read' && '읽기 (public:read)'}
                                        {perm === 'public:write' && '쓰기 (public:write)'}
                                        {perm === '*' && '전체 권한 (*)'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="apiKeyCreateRow">
                        <Select value={expiresIn || 'none'} onValueChange={(v) => setExpiresIn(v === 'none' ? '' : v)}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="만료 기간" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">만료 없음</SelectItem>
                                <SelectItem value="30">30일</SelectItem>
                                <SelectItem value="90">90일</SelectItem>
                                <SelectItem value="180">180일</SelectItem>
                                <SelectItem value="365">1년</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={() => {
                            if (!name.trim()) {
                                makePopup(
                                    <AlertPopup
                                        title="이름 입력"
                                        body="키 이름을 입력하세요"
                                        buttonFunction={() => closePopup()}
                                    />,
                                );
                                return;
                            }
                            createMutation.mutate();
                        }}
                        disabled={createMutation.isPending}
                    >
                        <Plus className="size-4 mr-1" />
                        키 발급
                    </Button>
                </div>
            </div>

            {/* 키 목록 */}
            <div className="sectionBox">
                <div className="sectionTitle">
                    <div className="sectionTitleBar" />
                    <h5>발급된 API 키 목록</h5>
                </div>
                {isLoading ? (
                    <div className="apiKeyEmpty">불러오는 중...</div>
                ) : keys.length === 0 ? (
                    <div className="apiKeyEmpty">
                        <Key className="size-10 text-muted-foreground" />
                        <p>발급된 API 키가 없습니다</p>
                    </div>
                ) : (
                    <div className="apiKeyList">
                        {keys.map((key) => (
                            <div key={key.id} className="apiKeyItem">
                                <div className="apiKeyInfo">
                                    <div className="apiKeyHeader">
                                        <span className="apiKeyName">
                                            {key.name}
                                        </span>
                                        <span
                                            className={`apiKeyStatus ${key.isActive ? 'active' : 'inactive'}`}
                                        >
                                            {key.isActive ? '활성' : '비활성'}
                                        </span>
                                    </div>
                                    <div className="apiKeyMeta">
                                        <code>{key.keyPrefix}...</code>
                                        <span>
                                            생성: {formatDate(key.createdAt)}
                                        </span>
                                        <span>
                                            마지막 사용:{' '}
                                            {formatDate(key.lastUsedAt)}
                                        </span>
                                    </div>
                                </div>
                                <div className="apiKeyActions">
                                    <Switch
                                        checked={key.isActive}
                                        onCheckedChange={(v) =>
                                            toggleMutation.mutate({
                                                id: key.id,
                                                isActive: v,
                                            })
                                        }
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        title="삭제"
                                        onClick={() => handleDelete(key)}
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ApiKeyList;
