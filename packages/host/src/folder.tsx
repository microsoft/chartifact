/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Folder, DocRef } from "@microsoft/chartifact-schema-folder";
import { Listener } from "./listener.js";
import { loadViaUrl } from "./url.js";
import { createElement } from 'tsx-create-element';

interface FolderDisplayProps {
    title: string;
    docIndex: number;
    docs: DocRef[];
    prevClick: () => void;
    nextClick: () => void;
    pageSelectChange: (index: number) => void;
}

const FolderDisplay = (props: FolderDisplayProps) => {
    const { title, docIndex, docs, prevClick, nextClick } = props;
    return (
        <span>
            <span>{title}</span>
            <div style={{ display: 'inline-block', marginRight: '0.5em' }}></div>
            <span>(document {docIndex + 1} of {docs.length})</span>
            <div style={{ display: 'inline-block' }}>
                <button type="button" id="prevBtn" disabled={docIndex === 0} onClick={prevClick}>Previous</button>
                <select
                    id="pageSelect"
                    title={`Select document (1 to ${docs.length})`}
                    onChange={(e) => props.pageSelectChange(parseInt(e.target.value, 10) - 1)}
                >
                    {docs.map((doc, index) => (
                        <option
                            key={index}
                            value={(index + 1)}
                        >
                            {doc.title ? doc.title : `Page ${index + 1}`}
                        </option>
                    ))}
                </select>
                <button type="button" id="nextBtn" disabled={docIndex === docs.length - 1} onClick={nextClick}>Next</button>
            </div>
        </span>
    );
}

export function loadFolder(folderUrl: string, folder: Folder, host: Listener) {
    if (!folder || !folder.docs) {
        host.errorHandler(
            'Invalid folder format',
            'Please provide a valid folder JSON.'
        );
        return;
    }

    if (folder.docs.length === 0) {
        host.errorHandler(
            'Empty folder',
            'The folder does not contain any documents.'
        );
        return;
    }

    if (!host.toolbar) {
        host.errorHandler(
            'Toolbar not found',
            'The toolbar element is required to load folder content.'
        );
        return;
    }

    let docIndex = 0;

    function getHashParam(key: string): string | undefined {
        const params = new URLSearchParams(window.location.hash.slice(1));
        return params.get(key) ?? undefined;
    }

    function setHashParam(key: string, value: string | number) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        params.set(key, value.toString());
        window.location.hash = params.toString();
    }

    const props: FolderDisplayProps = {
        title: folder.title,
        docIndex,
        docs: folder.docs,
        prevClick: () => {
            if (docIndex > 0) {
                updatePage(docIndex - 1, true);
            }
        },
        nextClick: () => {
            if (docIndex < folder.docs.length - 1) {
                updatePage(docIndex + 1, true);
            }
        },
        pageSelectChange: (index) => {
            if (index >= 0 && index <= folder.docs.length - 1) {
                updatePage(index, true);
            }
        }
    };

    function updatePage(newDocIndex: number, setHash: boolean = false) {
        docIndex = newDocIndex;
        if (setHash) {
            setHashParam('page', docIndex + 1);
        }

        //get mode from document extension
        const mode = folder.docs[docIndex].href.endsWith('.idoc.md') ? 'markdown' : 'json';

        host.toolbar.mode = mode;
        host.toolbar.addChildren(<FolderDisplay {...{ ...props, docIndex }} />);

        const pageSelect = document.querySelector('#pageSelect') as HTMLSelectElement;
        if (pageSelect) {
            pageSelect.value = (docIndex + 1).toString();
        }

        const title = folder.docs[docIndex].title || `Page ${docIndex + 1}`;
        resolveUrl(title, folderUrl, folder.docs[docIndex].href, host);
    }

    // Set initial hash and handle hash navigation
    function goToPageFromHash() {
        const pageStr = getHashParam('page');
        let newIndex = 0;
        if (pageStr) {
            const page = parseInt(pageStr, 10);
            if (page >= 1 && page <= folder.docs.length) {
                newIndex = page - 1;
            }
        }
        updatePage(newIndex, false);
    }

    window.addEventListener('hashchange', goToPageFromHash);

    // Only set hash param if not already present
    if (!getHashParam('page')) {
        setHashParam('page', docIndex + 1);
    }
    goToPageFromHash();

    //resolveUrl(folderUrl, folder.docUrls[docIndex], host);
}

async function resolveUrl(title: string, base: string, relativeOrAbsolute: string, host: Listener) {
    let url: string;
    try {
        url = base ? new URL(relativeOrAbsolute, base).href : relativeOrAbsolute;
    } catch (error) {
        host.errorHandler(
            'Invalid URL',
            `Invalid URL: ${relativeOrAbsolute} relative to ${base}`
        );
        return;
    }
    const result = await loadViaUrl(url, host, false, false);
    if (result.error) {
        host.errorHandler(
            result.error,
            result.errorDetail
        );
        return;
    }
    if (result.idoc) {
        await host.render(title, undefined, result.idoc, false);
    } else if (result.markdown) {
        await host.render(title, result.markdown, undefined, false);
    } else if (result.folder) {
        await host.render('Error', 'Nested folders are not supported', undefined, false);
    } else {
        host.errorHandler(
            'Invalid document format',
            'The document could not be loaded from the folder.'
        );
    }
}
