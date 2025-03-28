import { JSX, useEffect, useRef, useState } from "react";
import './MarkdownEditor.css'

export function MarkdownEditor({ value, setValue }: { value: any, setValue: (value: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [EasyMDE, setEasyMDE] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("easymde").then((mod) => {
        setEasyMDE(() => mod.default || mod);
      });
    }
  }, []);

  useEffect(() => {
    if (EasyMDE && textareaRef.current) {
      const instance = new EasyMDE({
        element: textareaRef.current,
        spellChecker: false, // ❌ Désactiver le correcteur d’orthographe
        errorCallback: null, // ❌ Désactiver la gestion des erreurs
        previewImagesInEditor: true,  // 🖼️ Activer l'affichage des images dans l'éditeur
        renderingConfig: {
          singleLineBreaks: true, // ✅ Conserver les retours à la ligne simples
        },
        lineNumbers: false, // Facultatif, si tu ne veux pas de numéros de ligne
        toolbar: [
          "bold", "italic", "heading", "|",
          "quote", "unordered-list", "ordered-list", "|",
          {
            name: "custom-help",
            action: () => window.open("https://mon-site.com/guide-markdown", "_blank"),
            className: "fa fa-question-circle",
            title: "Aide Markdown",
          },
          "|", "preview", "side-by-side", "fullscreen"
        ],
      });

      instance.value(value.description || "");

      instance.codemirror.on("change", () => {
        setValue(instance.value());
      });
      setTimeout(() => {
        const elem = document.querySelectorAll('.EasyMDEContainer .CodeMirror-scroll') as NodeListOf<HTMLDivElement>;
        if (elem) {
          elem.forEach(e => {
            e.style.minHeight = '';
          })
        }
      }, 10);
    }
  }, [EasyMDE]);

  return (
    <textarea
      ref={textareaRef}
      className="editor"
      id="input-product-description"
      placeholder="Ajoutez la description du produit"
      value={value.description}
      onChange={(e) => {
        setValue(e.target.value.substring(0, 1024));
      }}
    />
  );
}


export function MarkdownEditor2({ value, setValue }: { value: string, setValue: (value: string) => void }) {
  const editorRef = useRef<any>(null);
  const [editor, setEditor] = useState<JSX.Element>()
  const handleChange = () => {
    const instance = editorRef.current?.getInstance();
    setValue(instance?.getMarkdown())
  };
  useEffect(() => {
    (async () => {

      await import('@toast-ui/editor/dist/toastui-editor.css');
      const { Editor } = await import('@toast-ui/react-editor');
      editorRef.current = Editor;
      setEditor(<Editor
        ref={editorRef}
        initialValue={value || ""}
        previewStyle="vertical"
        height="300px"
        initialEditType="wysiwyg" // ✅ Mode édition directe
        useCommandShortcut={true}
        
        onChange={handleChange}
        toolbarItems={[
          ['bold', 'italic', 'strike','hr', 'quote','ul', 'task','table'], // ✅ Tableaux + liens, mais sans image
          /*
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task'],
          ['table', 'link'], // ✅ Tableaux + liens, mais sans image
          ['code', 'codeblock'],
          ['scrollSync'],
          ['image']
          */
        ]}
      />)
    })()
  }, [])
  useEffect(() => {
    // 🔄 Mettre à jour le contenu quand `value` change
    if (editorRef.current) {
      const editor = editorRef.current.getInstance();
      if (editor && editor.getMarkdown() !== value) {
        editor.setMarkdown(value || ""); // ✅ Mise à jour du texte
      }
    }
    
  }, [value]); // 🔥 S'exécute à chaque changement de `value`


  if (!editor) return <p>Chargement de l'éditeur...</p>;

  return (
    <>{editor}</>
  );
}