import React from 'react';
import { Button } from '@/Components/ui/Button';

function YesNoPopup(props) {
    /**
     * @description props
     * title : popup의 제목
     * body : popup의 내용
     * buttonText :
     * {
     *      left : "확인",
     *      right : "취소"
     * }
     * buttonFunction :
     * {
     *      left : () => {왼쪽 버튼 클릭시 호출함수},
     *      right : () => {오른쪽 버튼 클릭시 호출함수},
     * }
     */
    const {
        title = null,
        body = <></>,
        buttonText = {
            left: '확인',
            right: '취소',
        },
        buttonFunction = {
            left: () => {},
            right: () => {},
        },
    } = props;

    return (
        <>
            {title && <h4 className="popupTitle">{title}</h4>}
            <div className="popupBody">{body}</div>
            <div className="popupButtonWrap">
                <Button
                    className="leftPopupButton red"
                    onClick={buttonFunction?.left}
                    style={{
                        padding: '1.5rem 1.2rem',
                        fontSize: 'var(--p-size)',
                    }}
                >
                    {buttonText?.left}
                </Button>
                <Button
                    className="rightPopupButton outline secondary"
                    onClick={buttonFunction?.right}
                    style={{
                        padding: '1.5rem 1.2rem',
                        fontSize: 'var(--p-size)',
                    }}
                >
                    {buttonText?.right}
                </Button>
            </div>
        </>
    );
}

export default YesNoPopup;
