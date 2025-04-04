import '@toast-ui/editor/dist/toastui-editor-viewer.css';
import { useEffect, useState } from 'react';

export {markdownToPlainText,MarkdownViewer }
 function MarkdownViewer({ markdown }: { markdown: string }) {
    const [Viewer, setViewer] = useState<any>()
    useEffect(()=>{
        (async()=>{
            const {Viewer} = await import('@toast-ui/react-editor')  
            const v = <Viewer initialValue={markdown || "Aucun contenu"} />
            setViewer(v);
        })()
    },[markdown])
    return Viewer??'..';
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