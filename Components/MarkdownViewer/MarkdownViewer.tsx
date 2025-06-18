import '@toast-ui/editor/dist/toastui-editor-viewer.css';
import { useEffect, useRef, useState } from 'react';
import { useAppZust } from '../../renderer/AppStore/appZust';
import './_.css'
export { markdownToPlainText, MarkdownViewer }

function MarkdownViewer({ markdown }: { markdown: string }) {
    const { themeMode } = useAppZust()
    const [Viewer, setViewer] = useState<any>()
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        (async () => {
            const { Viewer } = await import('@toast-ui/react-editor')
            const v = <div ref={ref} className={'markdown-viewer ' + themeMode }>
                <Viewer initialValue={markdown || "Aucun contenu"} />
            </div>
            setViewer(v);
        })()
    }, [markdown]);

    useEffect(() => {
        if(!ref.current) return
        themeMode == 'dark'
        ? ref.current.classList.add('dark')
        : ref.current.classList.remove('dark')
    }, [ref, themeMode])
    return Viewer ?? '..';
}

function markdownToPlainText(markdown: string): string {
    return markdown
        .replace(/[#*_~`>\-+|]/g, '') // Supprime les caractères spéciaux Markdown
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Supprime les liens, garde le texte
        .replace(/!\[.*?\]\(.*?\)/g, '') // Supprime les images
        .replace(/```[\s\S]*?```/g, '') // Supprime les blocs de code
        .replace(/`([^`]+)`/g, '$1') // Supprime les inline-code
        .replace(/\n+/g, ' ') // Remplace les retours à la ligne par des espaces
        .trim();
}