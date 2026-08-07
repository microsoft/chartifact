/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

export interface EditElementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (content: string) => void;
    initialContent: string;
    elementLabel: string;
}

export function EditElementModal({ isOpen, onClose, onSave, initialContent, elementLabel }: EditElementModalProps) {
    const [content, setContent] = React.useState(initialContent);

    React.useEffect(() => {
        setContent(initialContent);
    }, [initialContent, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(content);
        onClose();
    };

    const handleCancel = () => {
        setContent(initialContent);
        onClose();
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000
            }}
            onClick={handleCancel}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.3)',
                    width: '90%',
                    maxWidth: '600px',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #e1e5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#24292f'
                    }}>
                        ✏️ Edit Element: {elementLabel}
                    </h3>
                    <button
                        onClick={handleCancel}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: '#656d76',
                            padding: '4px 8px',
                            lineHeight: 1
                        }}
                        title="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div style={{
                    padding: '20px',
                    flex: 1,
                    overflow: 'auto'
                }}>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '200px',
                            padding: '12px',
                            border: '1px solid #d1d9e0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                            resize: 'vertical',
                            background: '#f6f8fa',
                            color: '#24292f',
                            lineHeight: '1.5',
                            boxSizing: 'border-box'
                        }}
                        autoFocus
                    />
                </div>

                {/* Modal Footer */}
                <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid #e1e5e9',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    background: '#f6f8fa'
                }}>
                    <button
                        onClick={handleCancel}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #d1d9e0',
                            borderRadius: '6px',
                            background: 'white',
                            color: '#24292f',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f6f8fa';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#2da44e',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2c974b';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#2da44e';
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
