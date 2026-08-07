/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { InteractiveDocument } from '@microsoft/chartifact-schema';
import { SandboxDocumentPreview } from "./sandbox.js";
import { Sandbox } from '@microsoft/chartifact-sandbox';
import { EditorPageMessage, EditorReadyMessage, SpecReview, SandboxedPreHydrateMessage } from "common";
import { TreeView } from './components/TreeView.js';

export interface EditorProps {
    postMessageTarget?: Window;
    sandbox?: typeof Sandbox;
    onApprove: (message: SandboxedPreHydrateMessage) => SpecReview<{}>[];
}

const devmode = false; // Set to true to use DevDocumentPreview, false for SandboxDocumentPreview

export function Editor(props: EditorProps) {
    const postMessageTarget = props.postMessageTarget || window.parent;
    const [page, setPage] = React.useState<InteractiveDocument>(() => ({
        title: "Initializing...",
        layout: {
            css: "",
        },
        dataLoaders: [],
        groups: [
            {
                groupId: "init",
                elements: [
                    "# 🔄 Editor Initializing",
                    "Please wait while the editor loads...",
                    "",
                    "The editor is ready and waiting for content from the host application.",
                    "",
                    "📡 **Status**: Ready to receive documents"
                ]
            }
        ],
        variables: [],
    }));

    React.useEffect(() => {
        const handleMessage = (event: MessageEvent<EditorReadyMessage | EditorPageMessage>) => {
            // Optionally add origin validation here for security
            // if (event.origin !== 'expected-origin') return;

            // Only process messages that are not from us (editor)
            if (event.data && event.data.sender !== 'editor') {
                if (event.data.type === 'editorPage' && event.data.page) {
                    setPage(event.data.page);
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    React.useEffect(() => {
        // Send ready message when the editor is mounted and ready
        const readyMessage: EditorReadyMessage = {
            type: 'editorReady',
            sender: 'editor'
        };
        postMessageTarget.postMessage(readyMessage, '*');
    }, []);

    return (
        <EditorView
            page={page}
            postMessageTarget={postMessageTarget}
            sandbox={props.sandbox}
            onApprove={props.onApprove}
        />
    );
}

export interface EditorViewProps {
    page: InteractiveDocument;
    postMessageTarget: Window;
    sandbox?: typeof Sandbox;
    onApprove: (message: SandboxedPreHydrateMessage) => SpecReview<{}>[];
}

export function EditorView(props: EditorViewProps) {
    const { page, postMessageTarget, sandbox, onApprove } = props;

    const sendEditToApp = (newPage: InteractiveDocument) => {
        const pageMessage: EditorPageMessage = {
            type: 'editorPage',
            page: newPage,
            sender: 'editor'
        };
        postMessageTarget.postMessage(pageMessage, '*');
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            height: '100vh',
            overflow: 'hidden'
        }}>
            <div style={{
                borderRight: '1px solid #e1e5e9',
                overflowY: 'auto',
                background: '#fafbfc',
                padding: '20px'
            }}>
                <TreeView 
                    page={page} 
                    onPageChange={sendEditToApp} 
                />
            </div>
            <div style={{
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
                padding: '10px',
                overflowY: 'auto'
            }}>
                <h3>Document Preview</h3>
                <SandboxDocumentPreview
                    page={page}
                    sandbox={sandbox}
                    onApprove={onApprove}
                />
            </div>
        </div>
    );
}
