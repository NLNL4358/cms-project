/**
 * @description
 * 드래그&드롭 + 클릭 파일 업로드 컴포넌트.
 * 파일별 업로드 진행률을 표시하고, 완료 시 미디어 쿼리를 갱신한다.
 */
import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, X } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { Button } from '@/Components/ui/Button.jsx';

function MediaUploadZone({ onClose }) {
    const api = useAPI();
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploads, setUploads] = useState([]);

    // 모든 업로드 완료 시 미디어 목록 갱신
    useEffect(() => {
        if (
            uploads.length > 0 &&
            uploads.every((u) => u.status === 'done' || u.status === 'error')
        ) {
            queryClient.invalidateQueries({ queryKey: ['media'] });
        }
    }, [uploads, queryClient]);

    const updateById = (id, patch) =>
        setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        );

    const uploadFile = async (upload) => {
        updateById(upload.id, { status: 'uploading' });

        const formData = new FormData();
        formData.append('file', upload.file);

        try {
            await api.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (event) => {
                    const percent = Math.round(
                        (event.loaded * 100) / event.total,
                    );
                    updateById(upload.id, { progress: percent });
                },
            });
            updateById(upload.id, { status: 'done', progress: 100 });
        } catch (err) {
            const message = err.response?.data?.message || '업로드 실패';
            updateById(upload.id, { status: 'error', error: message });
        }
    };

    // 백엔드에서 허용 타입 목록 가져오기
    const { data: allowedTypes } = useQuery({
        queryKey: ['media', 'allowed-types'],
        queryFn: () => api.get('/media/allowed-types').then((r) => r.data),
        staleTime: 1000 * 60 * 30, // 30분 캐시
    });

    const maxFileSize = allowedTypes?.maxFileSize || 50 * 1024 * 1024;
    const allowedMimeTypes = allowedTypes?.mimeTypes || [];

    const handleFiles = (files) => {
        const newUploads = files.map((file) => {
            let error = null;

            if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
                error = `허용되지 않는 파일 형식\n(${file.type || '알 수 없음'})`;
            } else if (file.size > maxFileSize) {
                error = `크기 초과\n(${(file.size / 1024 / 1024).toFixed(1)}MB / 최대 ${allowedTypes?.maxFileSizeFormatted || '50MB'})`;
            }

            return {
                id: crypto.randomUUID(),
                file,
                progress: 0,
                status: error ? 'error' : 'pending',
                error,
            };
        });
        setUploads((prev) => [...prev, ...newUploads]);
        newUploads
            .filter((u) => u.status !== 'error')
            .forEach((upload) => uploadFile(upload));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) handleFiles(files);
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) handleFiles(files);
        e.target.value = '';
    };

    const clearCompleted = () => {
        setUploads((prev) =>
            prev.filter((u) => u.status !== 'done' && u.status !== 'error'),
        );
    };

    return (
        <div>
            <div
                className={`mediaUploadZone${isDragging ? ' dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    hidden
                    onChange={handleFileInput}
                />
                <div className="mediaUploadPrompt">
                    <Upload className="size-8 text-muted-foreground" />
                    <p>파일을 드래그하거나 클릭하여 업로드</p>
                    <span className="text-xs text-muted-foreground">
                        이미지, 영상, 문서 등 최대 50MB
                    </span>
                </div>
            </div>

            {uploads.length > 0 && (
                <div className="mediaUploadList">
                    {uploads.map((upload) => (
                        <div
                            key={upload.id}
                            className={`mediaUploadItem ${upload.status}`}
                        >
                            <span className="mediaUploadItemName">
                                {upload.file.name}
                            </span>
                            <div className="mediaUploadItemProgress">
                                <div
                                    className="mediaUploadItemBar"
                                    style={{ width: `${upload.progress}%` }}
                                />
                            </div>
                            <span className="mediaUploadItemStatus">
                                {upload.status === 'uploading' &&
                                    `${upload.progress}%`}
                                {upload.status === 'done' && '완료'}
                                {upload.status === 'error' && (upload.error || '실패')}
                            </span>
                        </div>
                    ))}
                    {uploads.every(
                        (u) => u.status === 'done' || u.status === 'error',
                    ) && (
                        <div className="flex justify-end gap-2 mt-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearCompleted}
                            >
                                목록 지우기
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                            >
                                닫기
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default MediaUploadZone;
