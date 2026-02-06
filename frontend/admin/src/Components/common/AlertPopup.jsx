import React from 'react';
import { Button } from '@/Components/ui/Button';

function AlertPopup(props) {
    /**
     * @description props
     * title : popup의 제목
     * body : popup의 내용
     * buttonText : 버튼의 텍스트
     * buttonFunction : 버튼클릭시 호출함수
     */
    const {
        title = null,
        body = <></>,
        buttonText = '확인',
        buttonFunction = () => {},
    } = props;
    return (
        <>
            {title && <h4 className="popupTitle">{title}</h4>}
            <div className="popupBody">{body}</div>
            <div className="popupButtonWrap">
                <Button
                    className="alertPopupButton"
                    onClick={buttonFunction}
                    style={{
                        padding: '1.5rem 1.2rem',
                        fontSize: 'var(--p-size)',
                    }}
                >
                    {buttonText}
                </Button>
            </div>
        </>
    );
}

export default AlertPopup;
