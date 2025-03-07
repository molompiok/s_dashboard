import React, { JSX, StyleHTMLAttributes } from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { usePageContext } from "../usePageContext";

export { useApp }

const useApp = create(combine({
    currentChild: null as JSX.Element | null | undefined,
    alignItems: '' as 'stretch' | 'start' | 'self-start' | 'self-end' | 'flex-start' | 'flex-end' | 'end' | 'baseline' | 'center',
    justifyContent: '' as 'right' | 'left' | 'space-around' | 'space-between' | 'space-evenly' | 'unsafe' | 'center',
    background: '' as string,
    blur: 0,
}, (set, get) => ({
    openChild(child: JSX.Element | null | undefined, option?: Partial<ReturnType<typeof get>>) {
        set(() => ({
            currentChild: child,
            alignItems: option?.alignItems || 'center',
            justifyContent: option?.justifyContent || 'center',
            background: option?.background || '',
            blur: option?.blur || 0,
        }))
        if (!child) history.back()
    }
})));

