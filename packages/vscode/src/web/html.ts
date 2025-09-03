// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as vscode from 'vscode';

export function link(href: vscode.Uri) {
    return `<link rel="stylesheet" type="text/css" href="${href.toString()}" />`;
}

export function style(css: string) {
    return `<style>${css}</style>`;
}

export function script(src: vscode.Uri | string) {
    if (typeof src === 'string') {
        return `<script>${src}</script>`;
    } else if (src instanceof vscode.Uri) {
        return `<script src="${src.toString()}"></script>`;
    }
}
