/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
declare const renderRequest: Chartifact.common.SandboxRenderMessage;
declare const rendererOptions: Chartifact.markdown.RendererOptions;

let renderer: Chartifact.markdown.Renderer;

document.addEventListener('DOMContentLoaded', () => {
    let transactionIndex = 0;

    const transactions: Record<number, Chartifact.common.SpecReview<{}>[]> = {};

    renderer = new Chartifact.markdown.Renderer(document.body, {
        ...rendererOptions,
        errorHandler: (error: Error, pluginName: string, instanceIndex: number, phase: string, container: Element, detail?: string) => {
            console.error(`Error in plugin ${pluginName} at instance ${instanceIndex} during ${phase}:`, error);
            if (detail) {
                console.error('Detail:', detail);
            }
            container.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
        }
    });

    function render(request: Chartifact.common.SandboxRenderMessage) {
        if (request.markdown) {
            renderer.reset();

            //debugger;

            const html = renderer.renderHtml(request.markdown);
            renderer.element.innerHTML = html;
            const specs = renderer.hydrateSpecs();

            const transactionId = transactionIndex++;
            transactions[transactionId] = specs;

            //send message to parent to ask for whitelist
            const sandboxedPreRenderMessage: Chartifact.common.SandboxedPreHydrateMessage = {
                type: 'sandboxedPreHydrate',
                transactionId,
                specs,
            };
            window.parent.postMessage(sandboxedPreRenderMessage, '*');
        }
    }

    render(renderRequest);

    //add listener for postMessage
    window.addEventListener('message', (event) => {
        if (!event.data) return;

        const message = event.data as Chartifact.common.SandboxApprovalMessage | Chartifact.common.SandboxRenderMessage;

        switch (message.type) {
            case 'sandboxRender': {
                render(message);
                break;
            }
            case 'sandboxApproval': {

                //debugger;

                //only handle if the transactionId is the latest
                if (message.transactionId === transactionIndex - 1) {

                    //todo: console.warn of unapproved

                    //hydrate the renderer
                    const flags = transactions[message.transactionId];
                    if (flags) {
                        renderer.hydrate(flags);
                    }
                } else {
                    console.debug('Received sandbox approval for an outdated transaction:', message.transactionId, transactionIndex);
                }
                break;
            }
        }
    });

});