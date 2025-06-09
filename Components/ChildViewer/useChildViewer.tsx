//Components/ChildViewer/useChildViewer.tsx
import React, { JSX, StyleHTMLAttributes } from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { ClientCall } from "../../Components/Utils/functions";

export const useChildViewer= create(combine({
    currentChild: null as JSX.Element | null | undefined,
    alignItems: '' as 'stretch' | 'start' | 'self-start' | 'self-end' | 'flex-start' | 'flex-end' | 'end' | 'baseline' | 'center',
    justifyContent: '' as 'right' | 'left' | 'space-around' | 'space-between' | 'space-evenly' | 'unsafe' | 'center',
    background: '' as string,
    blur: 0,
    back: true,
    className:''
}, (set, get) => ({
    openChild(child: JSX.Element | null | undefined, option?: Partial<ReturnType<typeof get>> & { back?: boolean }) {
        set(() => ({
            currentChild: child,
            alignItems: option?.alignItems || 'center',
            justifyContent: option?.justifyContent || 'center',
            background: option?.background || '',
            blur: option?.blur || 0,
            back: option?.back || true,
            className: option?.className||''
        }))
        if (!child && option?.back !== false) ClientCall(history.back, 0);
        if (child) location.hash = 'openChild'
    },
})));
