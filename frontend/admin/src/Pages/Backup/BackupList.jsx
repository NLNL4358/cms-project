/**
 * @description
 * 백업/복원 관리 페이지
 * DB 백업 생성, 다운로드, 복원, 삭제를 관리합니다.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    HardDrive,
    Plus,
    Download,
    RotateCcw,
    Trash2,
    Clock,
    FileArchive,
} from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { usePopup } from '@/Providers/PopupContext';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import AlertPopup from '@/Components/common/AlertPopup.jsx';
import YesNoPopup from '@/Components/common/YesNoPopup.jsx';
import '@/CSS/local/backup.css';

function BackupList() {
    const api = useAPI();
    const queryClient = useQueryClient();
    const { makePopup, closePopup } = usePopup();
    const [description, setDescription] = useState('');
    const [uploadFile, setUploadFile] = useState(null);

    // 백업 목록
    const { data: backups = [], isLoading } = useQuery({
        queryKey: ['backups'],
        queryFn: () => api.get('/backups').then((r) => r.data),
        refetchOnMount: 'always',
    });

    // 백업 생성
    const createMutation = useMutation({
        mutationFn: () =>
            api.post('/backups', { description: description || undefined }).then((r) => r.data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            setDescription('');
            makePopup(
                <AlertPopup
                    title="백업 완료"
                    body={`백업이 생성되었습니다. (${data.sizeFormatted || data.filename})`}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
        onError: (error) => {
            makePopup(
                <AlertPopup
                    title="백업 실패"
                    body={error.response?.data?.message || '백업 생성에 실패했습니다'}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    // 다운로드
    const handleDownload = async (filename) => {
        try {
            const response = await api.get(`/backups/${filename}/download`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            makePopup(
                <AlertPopup
                    title="다운로드 실패"
                    body="백업 파일 다운로드에 실패했습니다."
                    buttonFunction={() => closePopup()}
                />,
            );
        }
    };

    // 복원
    const restoreMutation = useMutation({
        mutationFn: (filename) =>
            api.post(`/backups/${filename}/restore`).then((r) => r.data),
        onSuccess: (data) => {
            makePopup(
                <AlertPopup
                    title="복원 완료"
                    body={data.message || '복원이 완료되었습니다.'}
                    buttonFunction={() => {
                        closePopup();
                        window.location.reload();
                    }}
                />,
            );
        },
        onError: (error) => {
            makePopup(
                <AlertPopup
                    title="복원 실패"
                    body={error.response?.data?.message || '복원에 실패했습니다'}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    const handleRestore = (backup) => {
        makePopup(
            <YesNoPopup
                title="백업 복원"
                body={`"${backup.description}" (${formatDate(backup.createdAt)}) 시점으로 복원하시겠습니까?\n\n현재 데이터가 백업 시점의 데이터로 교체됩니다.`}
                buttonText={{ left: '복원', right: '취소' }}
                buttonFunction={{
                    left: () => {
                        closePopup();
                        restoreMutation.mutate(backup.filename);
                    },
                    right: () => closePopup(),
                }}
            />,
        );
    };

    // 삭제
    const deleteMutation = useMutation({
        mutationFn: (filename) =>
            api.delete(`/backups/${filename}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            makePopup(
                <AlertPopup
                    title="삭제 완료"
                    body="백업이 삭제되었습니다."
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    const handleDelete = (backup) => {
        makePopup(
            <YesNoPopup
                title="백업 삭제"
                body={`"${backup.description}" 백업을 삭제하시겠습니까?`}
                buttonFunction={{
                    left: () => {
                        closePopup();
                        deleteMutation.mutate(backup.filename);
                    },
                    right: () => closePopup(),
                }}
            />,
        );
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="formPageWrap backupPageWrap">
            <div className="formPageHead">
                <div className="flex gap-3 items-center">
                    <div className="settingsIcon">
                        <HardDrive className="size-5" />
                    </div>
                    <h2 className="text-2xl font-bold">백업 / 복원</h2>
                </div>
                <p className="pageDescription">
                    데이터베이스를 백업하고, 필요 시 이전 시점으로 복원합니다
                </p>
            </div>

            {/* 백업 생성 */}
            <div className="sectionBox">
                <div className="sectionTitle">
                    <div className="sectionTitleBar" />
                    <h5>새 백업 생성</h5>
                </div>
                <div className="backupCreateRow">
                    <Input
                        placeholder="백업 설명 (선택)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="backupDescInput"
                    />
                    <Button
                        onClick={() => createMutation.mutate()}
                        disabled={createMutation.isPending}
                    >
                        <Plus className="size-4 mr-1" />
                        {createMutation.isPending ? '생성 중...' : '백업 생성'}
                    </Button>
                </div>
            </div>

            {/* 파일 업로드 복원 */}
            <div className="sectionBox">
                <div className="sectionTitle">
                    <div className="sectionTitleBar" />
                    <h5>파일로 복원</h5>
                </div>
                <p className="backupUploadDesc">
                    다운로드한 .sql 백업 파일을 업로드하여 복원합니다
                </p>
                <div className="backupCreateRow">
                    <label className="backupFileLabel">
                        <input
                            type="file"
                            accept=".zip,.sql"
                            className="backupFileInput"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        />
                        <FileArchive className="size-4" />
                        <span>{uploadFile ? uploadFile.name : '.zip 또는 .sql 파일 선택'}</span>
                    </label>
                    <Button
                        variant="outline"
                        disabled={!uploadFile}
                        onClick={() => {
                            if (!uploadFile) return;
                            makePopup(
                                <YesNoPopup
                                    title="파일 복원"
                                    body={`"${uploadFile.name}" 파일로 복원하시겠습니까?\n\n현재 데이터가 파일의 데이터로 교체됩니다.`}
                                    buttonText={{ left: '복원', right: '취소' }}
                                    buttonFunction={{
                                        left: async () => {
                                            closePopup();
                                            try {
                                                const formData = new FormData();
                                                formData.append('file', uploadFile);
                                                const res = await api.post('/backups/upload-restore', formData, {
                                                    headers: { 'Content-Type': 'multipart/form-data' },
                                                });
                                                makePopup(
                                                    <AlertPopup
                                                        title="복원 완료"
                                                        body={res.data.message}
                                                        buttonFunction={() => {
                                                            closePopup();
                                                            window.location.reload();
                                                        }}
                                                    />,
                                                );
                                                setUploadFile(null);
                                            } catch (error) {
                                                makePopup(
                                                    <AlertPopup
                                                        title="복원 실패"
                                                        body={error.response?.data?.message || '복원에 실패했습니다'}
                                                        buttonFunction={() => closePopup()}
                                                    />,
                                                );
                                            }
                                        },
                                        right: () => closePopup(),
                                    }}
                                />,
                            );
                        }}
                    >
                        <RotateCcw className="size-4 mr-1" />
                        업로드 복원
                    </Button>
                </div>
            </div>

            {/* 백업 목록 */}
            <div className="sectionBox">
                <div className="sectionTitle">
                    <div className="sectionTitleBar" />
                    <h5>백업 목록</h5>
                </div>
                {isLoading ? (
                    <div className="backupEmpty">불러오는 중...</div>
                ) : backups.length === 0 ? (
                    <div className="backupEmpty">
                        <FileArchive className="size-10 text-muted-foreground" />
                        <p>생성된 백업이 없습니다</p>
                    </div>
                ) : (
                    <div className="backupList">
                        {backups.map((backup) => (
                            <div key={backup.filename} className="backupItem">
                                <div className="backupItemInfo">
                                    <div className="backupItemMain">
                                        <FileArchive className="size-4 backupItemIcon" />
                                        <span className="backupItemDesc">
                                            {backup.description}
                                        </span>
                                        <span className="backupItemSize">
                                            {backup.sizeFormatted}
                                        </span>
                                    </div>
                                    <div className="backupItemDate">
                                        <Clock className="size-3" />
                                        <span>{formatDate(backup.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="backupItemActions">
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        title="다운로드"
                                        onClick={() =>
                                            handleDownload(backup.filename)
                                        }
                                    >
                                        <Download className="size-3.5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        title="복원"
                                        onClick={() => handleRestore(backup)}
                                        disabled={restoreMutation.isPending}
                                    >
                                        <RotateCcw className="size-3.5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        title="삭제"
                                        onClick={() => handleDelete(backup)}
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

export default BackupList;
