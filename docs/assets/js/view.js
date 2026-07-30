window.addEventListener('DOMContentLoaded', () => {
    // Check if we're in MCP mode
    const urlParams = new URLSearchParams(window.location.search);
    const isMcpMode = urlParams.has('mcp') || urlParams.has('jsonrpc');
    
    let render = () => { };
    const textarea = document.querySelector('#source');
    textarea.addEventListener('input', () => render());
    const toolbar = new Chartifact.toolbar.Toolbar('.chartifact-toolbar', { textarea });
    
    host = new Chartifact.host.Listener({
        preview: '#preview',
        loading: '#loading',
        help: '#help',
        uploadButton: '#upload-btn',
        fileInput: '#file-input',
        toolbar,
        options: {
            clipboard: !isMcpMode,  // Disable clipboard in MCP mode
            dragDrop: !isMcpMode,   // Disable drag-drop in MCP mode
            fileUpload: !isMcpMode, // Disable file upload in MCP mode
            postMessage: true,      // Always enable postMessage (handles both protocols)
            url: !isMcpMode,        // Disable URL loading in MCP mode
        },
        onApprove: (message) => {
            // TODO look through each spec and override policy to approve unapproved for https://microsoft.github.io/chartifact/
            const { specs } = message;
            return specs;
        },
        onSetMode: (mode, markdown, interactiveDocument) => {
            switch (mode) {
                case 'json':
                    textarea.value = JSON.stringify(interactiveDocument, null, 2);
                    render = () => {
                        const json = textarea.value;
                        try {
                            const interactiveDocument = JSON.parse(json);
                            if (typeof interactiveDocument !== 'object') {
                                host.errorHandler('Invalid JSON format', 'Please provide a valid Interactive Document JSON.');
                                return;
                            }
                            host.renderInteractiveDocument(interactiveDocument);
                        }
                        catch (error) {
                            host.errorHandler(error, 'Failed to parse Interactive Document JSON');
                        }
                    };
                    break;
                case 'markdown':
                    textarea.value = markdown;
                    render = () => {
                        const markdown = textarea.value;
                        host.renderMarkdown(markdown);
                    };
                    break;
                default:
                    return;
            }
        },
    });
    
    // Hide UI elements in MCP mode
    if (isMcpMode) {
        const helpDiv = document.getElementById('help');
        const footer = document.querySelector('.footer');
        if (helpDiv) helpDiv.style.display = 'none';
        if (footer) footer.style.display = 'none';
    }
});
