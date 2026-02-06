/**
 * @description
 * PopupContext.jsx는 페이지의 팝업을 관리하는 Provider입니다.
 */
import React, { useState, useEffect, createContext, useContext } from 'react';

import progressImg from '@/Assets/icon/spinner.png';

const PopupContext = createContext();

export function PopupProvider({ children }) {
    /** useState */
    const [popupSwitch, setPopupSwitch] = useState(false); // 팝업 스위치
    const [popupBody, setPopupBody] = useState(<></>); // 팝업 내용

    const [progressPopupSwitch, setProgressPopupSwitch] = useState(false); // 프로그레스 팝업

    /** Function */
    const makePopup = (element) => {
        setPopupSwitch(true);
        setPopupBody(element);
    };

    const closePopup = () => {
        setPopupSwitch(false);
        setPopupBody(<></>);
    };

    const makeProgressPopup = () => {
        setProgressPopupSwitch(true);
    };
    const closeProgressPopup = () => {
        setProgressPopupSwitch(false);
    };

    const value = {
        makePopup,
        closePopup,
        makeProgressPopup,
        closeProgressPopup,
    };

    /** useEffect */
    useEffect(() => {
        const clear = () => {
            closePopup();
        };

        window.addEventListener('popstate', clear);

        return () => {
            window.removeEventListener('popstate', clear);
        };
    }, []);

    return (
        <PopupContext.Provider value={value}>
            {children}
            <div
                className={`popupOuter ${popupSwitch || progressPopupSwitch ? 'true' : ''}`}
            >
                <div className="relativeInner">
                    <div
                        className={`progressInner ${progressPopupSwitch ? 'true' : ''}`}
                    >
                        <img className="progress" src={progressImg} alt="" />
                    </div>
                    <div className={`popupInner ${popupSwitch ? 'true' : ''}`}>
                        {popupBody}
                    </div>
                </div>
            </div>
        </PopupContext.Provider>
    );
}

export function usePopup() {
    return useContext(PopupContext);
}
