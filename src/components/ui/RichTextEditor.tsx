"use client";

import { useEffect, useRef, useState } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editorRef = useRef<any>(null);
    const [editorLoaded, setEditorLoaded] = useState(false);
    const { CKEditor, ClassicEditor } = editorRef.current || {};

    useEffect(() => {
        editorRef.current = {
            CKEditor: require('@ckeditor/ckeditor5-react').CKEditor,
            ClassicEditor: require('@ckeditor/ckeditor5-build-classic')
        };
        setEditorLoaded(true);
    }, []);

    // Custom CSS to ensure editor has height
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .ck-editor__editable_inline {
                min-height: 200px;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    if (!editorLoaded) {
        return <div className="h-[200px] border rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">Loading editor...</div>;
    }

    return (
        <div className="prose-editor-wrapper text-black">
            <CKEditor
                editor={ClassicEditor}
                data={value}
                config={{
                    placeholder: placeholder
                }}
                onChange={(event: any, editor: any) => {
                    const data = editor.getData();
                    onChange(data);
                }}
            />
        </div>
    );
}
