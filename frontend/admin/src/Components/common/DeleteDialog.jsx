import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/Components/ui/alert-dialog.jsx';

/**
 * 삭제 확인 다이얼로그
 *
 * 삭제 작업 전 사용자에게 확인을 요청하는 공통 컴포넌트.
 * Shadcn/ui AlertDialog 기반.
 *
 * @param {boolean} open - 다이얼로그 열림 상태
 * @param {Function} onOpenChange - 열림 상태 변경 핸들러
 * @param {string} title - 다이얼로그 제목
 * @param {string} description - 다이얼로그 설명
 * @param {Function} onConfirm - 삭제 확인 핸들러
 * @param {boolean} isLoading - 삭제 진행 중 여부
 */
export function DeleteDialog({
  open,
  onOpenChange,
  title = '삭제 확인',
  description = '이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
  onConfirm,
  isLoading = false,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>취소</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? '삭제 중...' : '삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
