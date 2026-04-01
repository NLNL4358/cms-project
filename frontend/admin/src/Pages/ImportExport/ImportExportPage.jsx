/**
 * @description
 * Import/Export 페이지
 * 콘텐츠를 CSV/JSON으로 내보내거나, 파일에서 대량 가져옵니다.
 */
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Download,
    Upload,
    FileText,
    FileJson,
    CheckCircle,
    XCircle,
    HelpCircle,
} from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { usePopup } from '@/Providers/PopupContext';
import { useGlobal } from '@/Providers/GlobalContext.jsx';
import { Button } from '@/Components/ui/Button.jsx';
import { Label } from '@/Components/ui/label.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/Select.jsx';
import AlertPopup from '@/Components/common/AlertPopup.jsx';
import '@/CSS/local/import-export.css';

function ImportExportPage() {
    const api = useAPI();
    const { contentTypes } = useGlobal();
    const { makePopup, closePopup } = usePopup();

    const [activeTab, setActiveTab] = useState('export');

    return (
        <div className="formPageWrap iePageWrap">
            <div className="formPageHead">
                <div className="flex gap-3 items-center">
                    <div className="settingsIcon">
                        <ArrowDownToLine className="size-5" />
                    </div>
                    <h2 className="text-2xl font-bold">Import / Export</h2>
                </div>
                <p className="pageDescription">
                    콘텐츠를 CSV/JSON 파일로 내보내거나, 파일에서 대량으로
                    가져옵니다
                </p>
            </div>

            {/* 탭 */}
            <div className="ieTabs">
                <button
                    type="button"
                    className={`ieTab ${activeTab === 'export' ? 'ieTabActive' : ''}`}
                    onClick={() => setActiveTab('export')}
                >
                    <Download className="size-4" />
                    내보내기 (Export)
                </button>
                <button
                    type="button"
                    className={`ieTab ${activeTab === 'import' ? 'ieTabActive' : ''}`}
                    onClick={() => setActiveTab('import')}
                >
                    <Upload className="size-4" />
                    가져오기 (Import)
                </button>
            </div>

            {activeTab === 'export' ? (
                <ExportSection
                    api={api}
                    contentTypes={contentTypes}
                    makePopup={makePopup}
                    closePopup={closePopup}
                />
            ) : (
                <ImportSection
                    api={api}
                    contentTypes={contentTypes}
                    makePopup={makePopup}
                    closePopup={closePopup}
                />
            )}
        </div>
    );
}

/** 내보내기 섹션 */
function ExportSection({ api, contentTypes, makePopup, closePopup }) {
    const [contentTypeId, setContentTypeId] = useState('');
    const [format, setFormat] = useState('json');
    const [status, setStatus] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!contentTypeId) {
            makePopup(
                <AlertPopup
                    title="선택 필요"
                    body="내보낼 콘텐츠 타입을 선택하세요."
                    buttonFunction={() => closePopup()}
                />,
            );
            return;
        }

        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            params.set('contentTypeId', contentTypeId);
            if (status) params.set('status', status);

            const response = await api.get(
                `/import-export/export/${format}?${params}`,
                { responseType: 'blob' },
            );

            // 파일 다운로드
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `export-${Date.now()}.${format === 'json' ? 'json' : 'csv'}`;
            a.click();
            window.URL.revokeObjectURL(url);

            makePopup(
                <AlertPopup
                    title="내보내기 완료"
                    body="파일이 다운로드되었습니다."
                    buttonFunction={() => closePopup()}
                />,
            );
        } catch {
            makePopup(
                <AlertPopup
                    title="내보내기 실패"
                    body="내보내기 중 오류가 발생했습니다."
                    buttonFunction={() => closePopup()}
                />,
            );
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="sectionBox">
            <div className="sectionTitle">
                <div className="sectionTitleBar" />
                <h5>콘텐츠 내보내기</h5>
            </div>
            <div className="contentColumnWrap">
                <div className="ieRow">
                    <div className="flex flex-col flex-1">
                        <Label>콘텐츠 타입</Label>
                        <Select
                            value={contentTypeId}
                            onValueChange={setContentTypeId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="콘텐츠 타입 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                {contentTypes.map((ct) => (
                                    <SelectItem key={ct.id} value={ct.id}>
                                        {ct.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col flex-1">
                        <Label>파일 형식</Label>
                        <Select value={format} onValueChange={setFormat}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="json">
                                    JSON
                                </SelectItem>
                                <SelectItem value="csv">
                                    CSV (엑셀 호환)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="ieRow">
                    <div className="flex flex-col flex-1">
                        <Label>상태 필터 (선택)</Label>
                        <Select
                            value={status || 'all'}
                            onValueChange={(v) =>
                                setStatus(v === 'all' ? '' : v)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="전체" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체</SelectItem>
                                <SelectItem value="DRAFT">초안</SelectItem>
                                <SelectItem value="PUBLISHED">
                                    발행됨
                                </SelectItem>
                                <SelectItem value="ARCHIVED">
                                    보관됨
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col flex-1 justify-end">
                        <Button
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            <Download className="size-4 mr-1" />
                            {isExporting ? '내보내는 중...' : '내보내기'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** 가져오기 섹션 */
function ImportSection({ api, contentTypes, makePopup, closePopup }) {
    const [contentTypeId, setContentTypeId] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [previewResult, setPreviewResult] = useState(null);
    const [fileName, setFileName] = useState('');
    const [overwrite, setOverwrite] = useState(false);

    // 파일 선택 처리
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setPreviewResult(null);

        const text = await file.text();
        const isJson = file.name.endsWith('.json');

        try {
            let items;
            if (isJson) {
                const json = JSON.parse(text);
                items = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
            } else {
                // CSV → 백엔드 파싱 → "data:" 접두사로 동적 필드 구분
                const res = await api.post('/import-export/parse/csv', {
                    csvText: text,
                });
                items = res.data.map((row) => {
                    const data = {};
                    const item = { title: row.title || '', slug: row.slug || '' };
                    if (row.status) item.status = row.status;
                    for (const [key, val] of Object.entries(row)) {
                        if (key.startsWith('data:') && val !== '') {
                            data[key.slice(5)] = val;
                        }
                    }
                    item.data = data;
                    return item;
                });
            }
            setParsedData(items);
        } catch {
            makePopup(
                <AlertPopup
                    title="파싱 실패"
                    body="파일 형식이 올바르지 않습니다. CSV 또는 JSON 파일을 선택하세요."
                    buttonFunction={() => closePopup()}
                />,
            );
        }
    };

    // 미리보기
    const handlePreview = async () => {
        if (!contentTypeId) {
            makePopup(
                <AlertPopup
                    title="선택 필요"
                    body="가져올 콘텐츠 타입을 선택하세요."
                    buttonFunction={() => closePopup()}
                />,
            );
            return;
        }
        if (!parsedData?.length) return;

        try {
            const res = await api.post('/import-export/import/preview', {
                contentTypeId,
                items: parsedData,
            });
            setPreviewResult(res.data);
        } catch {
            makePopup(
                <AlertPopup
                    title="미리보기 실패"
                    body="유효성 검사 중 오류가 발생했습니다."
                    buttonFunction={() => closePopup()}
                />,
            );
        }
    };

    // 실행
    const executeMutation = useMutation({
        mutationFn: () =>
            api
                .post('/import-export/import/execute', {
                    contentTypeId,
                    items: parsedData,
                    overwrite,
                })
                .then((r) => r.data),
        onSuccess: (data) => {
            const parts = [];
            if (data.created > 0) parts.push(`${data.created}건 생성`);
            if (data.updated > 0) parts.push(`${data.updated}건 덮어쓰기`);
            if (data.skipped > 0) parts.push(`${data.skipped}건 건너뜀`);
            makePopup(
                <AlertPopup
                    title="가져오기 완료"
                    body={parts.join(', ') || '처리된 항목이 없습니다'}
                    buttonFunction={() => closePopup()}
                />,
            );
            setParsedData(null);
            setPreviewResult(null);
            setFileName('');
        },
    });

    return (
        <>
            <div className="sectionBox">
                <div className="sectionTitle">
                    <div className="sectionTitleBar" />
                    <h5>콘텐츠 가져오기</h5>
                </div>
                <div className="contentColumnWrap">
                    <div className="flex flex-col">
                        <Label>콘텐츠 타입</Label>
                        <Select
                            value={contentTypeId}
                            onValueChange={setContentTypeId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="콘텐츠 타입 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                {contentTypes.map((ct) => (
                                    <SelectItem key={ct.id} value={ct.id}>
                                        {ct.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col">
                        <Label>파일 선택 (CSV 또는 JSON)</Label>
                        <label className="ieFileDropzone">
                            <input
                                type="file"
                                accept=".csv,.json"
                                onChange={handleFileSelect}
                                className="ieFileInput"
                            />
                            {fileName ? (
                                <div className="ieFileSelected">
                                    <FileText className="size-5" />
                                    <span>{fileName}</span>
                                    <span className="ieFileCount">
                                        ({parsedData?.length || 0}건 감지)
                                    </span>
                                </div>
                            ) : (
                                <div className="ieFileEmpty">
                                    <Upload className="size-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        CSV 또는 JSON 파일을 선택하세요
                                    </span>
                                </div>
                            )}
                        </label>
                    </div>

                    {parsedData && (
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={handlePreview}
                            >
                                미리보기 및 유효성 검사
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* 미리보기 결과 */}
            {previewResult && (
                <div className="sectionBox">
                    <div className="sectionTitle">
                        <div className="sectionTitleBar" />
                        <h5>미리보기 결과</h5>
                    </div>
                    <div className="iePreviewSummary">
                        <div className="iePreviewStat">
                            <span className="iePreviewStatNum iePreviewTotal">
                                {previewResult.total}
                            </span>
                            <span>전체</span>
                        </div>
                        <div className="iePreviewStat">
                            <span className="iePreviewStatNum iePreviewValid">
                                {previewResult.valid}
                            </span>
                            <span>유효</span>
                        </div>
                        <div className="iePreviewStat">
                            <span className="iePreviewStatNum iePreviewInvalid">
                                {previewResult.invalid}
                            </span>
                            <span>오류</span>
                        </div>
                    </div>

                    <div className="iePreviewTableWrap">
                        <table className="iePreviewTable">
                            <thead>
                                <tr>
                                    <th>행</th>
                                    <th>제목</th>
                                    <th>고유주소</th>
                                    <th>상태</th>
                                    <th>오류</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewResult.items
                                    .slice(0, 100)
                                    .map((item) => (
                                        <tr
                                            key={item.row}
                                            className={
                                                item.valid
                                                    ? ''
                                                    : 'iePreviewRowError'
                                            }
                                        >
                                            <td>{item.row}</td>
                                            <td className="iePreviewCell">
                                                {item.title || '-'}
                                            </td>
                                            <td className="iePreviewCell">
                                                {item.slug || '-'}
                                            </td>
                                            <td>
                                                {item.valid ? (
                                                    <CheckCircle className="size-4 ieIconValid" />
                                                ) : (
                                                    <XCircle className="size-4 ieIconInvalid" />
                                                )}
                                            </td>
                                            <td className="iePreviewError">
                                                {item.errors?.join(', ')}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                    {previewResult.total > 100 && (
                        <p className="iePreviewTruncated">
                            전체 {previewResult.total}건 중 100건만 미리보기에 표시됩니다
                        </p>
                    )}

                    <div className="ieImportActions">
                        <label className="ieOverwriteCheck">
                            <input
                                type="checkbox"
                                checked={overwrite}
                                onChange={(e) =>
                                    setOverwrite(e.target.checked)
                                }
                            />
                            <span>동일한 고유주소가 있으면 덮어쓰기</span>
                            <span className="ieOverwriteHint">
                                (기존 콘텐츠를 새 데이터로 교체합니다)
                            </span>
                        </label>
                        <Button
                            onClick={() => executeMutation.mutate()}
                            disabled={executeMutation.isPending}
                        >
                            <ArrowUpFromLine className="size-4 mr-1" />
                            {executeMutation.isPending
                                ? '가져오는 중...'
                                : `${previewResult.total}건 가져오기 실행`}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}

export default ImportExportPage;
