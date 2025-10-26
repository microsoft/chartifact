/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */
import { InteractiveDocument, InteractiveElement, PageElement } from '@microsoft/chartifact-schema';
import { ElementType, ELEMENT_CONFIGS, ELEMENT_TYPES } from '../types/elementTypes.js';
import { EditElementModal } from './EditElementModal.js';

export interface TreeViewProps {
    page: InteractiveDocument;
    onPageChange: (page: InteractiveDocument) => void;
}

export interface ElementInsertMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (elementType: ElementType) => void;
    position: { x: number; y: number };
}

function ElementInsertMenu({ isOpen, onClose, onInsert, position }: ElementInsertMenuProps) {
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside as EventListener);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside as EventListener);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                background: 'white',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                boxShadow: '0 8px 24px rgba(149, 157, 165, 0.2)',
                zIndex: 1000,
                minWidth: '280px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '8px 0'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={{ 
                padding: '8px 16px', 
                borderBottom: '1px solid #e1e5e9', 
                fontWeight: '600',
                fontSize: '14px',
                color: '#24292f'
            }}>
                Insert Element
            </div>
            {ELEMENT_TYPES.map((elementConfig) => (
                <button
                    key={elementConfig.type}
                    onClick={() => {
                        onInsert(elementConfig.type);
                        onClose();
                    }}
                    style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f6f8fa';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <div style={{ fontWeight: '500', color: '#24292f' }}>
                        {elementConfig.icon} {elementConfig.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#656d76' }}>
                        {elementConfig.description}
                    </div>
                </button>
            ))}
        </div>
    );
}

export function TreeView({ page, onPageChange }: TreeViewProps) {
    const [insertMenu, setInsertMenu] = React.useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        groupIndex?: number;
        elementIndex?: number;
    }>({
        isOpen: false,
        position: { x: 0, y: 0 }
    });

    const [editModal, setEditModal] = React.useState<{
        isOpen: boolean;
        groupIndex?: number;
        elementIndex?: number;
        content: string;
        label: string;
    }>({
        isOpen: false,
        content: '',
        label: ''
    });

    const deleteElement = (groupIndex: number, elementIndex: number) => {
        const newPage = {
            ...page,
            groups: page.groups.map((group, gIdx) => {
                if (gIdx === groupIndex) {
                    return {
                        ...group,
                        elements: group.elements.filter((_, eIdx) => eIdx !== elementIndex)
                    };
                }
                return group;
            })
        };
        onPageChange(newPage);
    };

    const deleteGroup = (groupIndex: number) => {
        const newPage = {
            ...page,
            groups: page.groups.filter((_, gIdx) => gIdx !== groupIndex)
        };
        onPageChange(newPage);
    };

    const addGroup = () => {
        const newGroupId = `group_${Date.now()}`;
        const newPage = {
            ...page,
            groups: [
                ...page.groups,
                {
                    groupId: newGroupId,
                    elements: []
                }
            ]
        };
        onPageChange(newPage);
    };

    const createElement = (elementType: ElementType): PageElement => {
        switch (elementType) {
            case ElementType.MARKDOWN:
                return 'New text content here...';
            
            case ElementType.TEXTBOX:
                return {
                    type: ElementType.TEXTBOX,
                    variableId: `textbox_${Date.now()}`,
                    label: 'Text Input'
                } as InteractiveElement;
            
            case ElementType.NUMBER:
                return {
                    type: ElementType.NUMBER,
                    variableId: `number_${Date.now()}`,
                    label: 'Number Input',
                    min: 0,
                    max: 100,
                    step: 1
                } as InteractiveElement;
            
            case ElementType.SLIDER:
                return {
                    type: ElementType.SLIDER,
                    variableId: `slider_${Date.now()}`,
                    label: 'Slider',
                    min: 0,
                    max: 100,
                    step: 1
                } as InteractiveElement;
            
            case ElementType.CHECKBOX:
                return {
                    type: ElementType.CHECKBOX,
                    variableId: `checkbox_${Date.now()}`,
                    label: 'Checkbox'
                } as InteractiveElement;
            
            case ElementType.DROPDOWN:
                return {
                    type: ElementType.DROPDOWN,
                    variableId: `dropdown_${Date.now()}`,
                    label: 'Dropdown',
                    options: ['Option 1', 'Option 2', 'Option 3']
                } as InteractiveElement;
            
            case ElementType.CHART:
                return {
                    type: ElementType.CHART,
                    chartKey: 'chart_placeholder'
                } as InteractiveElement;
            
            case ElementType.TABULATOR:
                return {
                    type: ElementType.TABULATOR,
                    dataSourceName: 'data_placeholder'
                } as InteractiveElement;
            
            case ElementType.IMAGE:
                return {
                    type: ElementType.IMAGE,
                    url: 'https://via.placeholder.com/300x200',
                    alt: 'Placeholder image'
                } as InteractiveElement;
            
            case ElementType.MERMAID:
                return {
                    type: ElementType.MERMAID,
                    diagramText: 'graph TD\n    A[Start] --> B[End]'
                } as InteractiveElement;
            
            case ElementType.TREEBARK:
                return {
                    type: ElementType.TREEBARK,
                    template: { 
                        type: 'div', 
                        content: 'Template content',
                        children: []
                    }
                } as any;
            
            case ElementType.PRESETS:
                return {
                    type: ElementType.PRESETS,
                    presets: []
                } as InteractiveElement;
            
            default:
                return 'New element';
        }
    };

    const insertElement = (elementType: ElementType) => {
        const newElement = createElement(elementType);
        
        if (insertMenu.groupIndex !== undefined) {
            const newPage = {
                ...page,
                groups: page.groups.map((group, gIdx) => {
                    if (gIdx === insertMenu.groupIndex) {
                        const insertIndex = insertMenu.elementIndex !== undefined 
                            ? insertMenu.elementIndex + 1 
                            : group.elements.length;
                        
                        const newElements = [...group.elements];
                        newElements.splice(insertIndex, 0, newElement);
                        
                        return {
                            ...group,
                            elements: newElements
                        };
                    }
                    return group;
                })
            };
            onPageChange(newPage);
        }
    };

    const openInsertMenu = (event: any, groupIndex: number, elementIndex?: number) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        setInsertMenu({
            isOpen: true,
            position: { x: rect.right + 8, y: rect.top },
            groupIndex,
            elementIndex
        });
    };

    const closeInsertMenu = () => {
        setInsertMenu({
            isOpen: false,
            position: { x: 0, y: 0 }
        });
    };

    const getElementContent = (element: PageElement): string => {
        if (typeof element === 'string') {
            return element;
        }
        return JSON.stringify(element, null, 2);
    };

    const openEditModal = (groupIndex: number, elementIndex: number) => {
        const element = page.groups[groupIndex].elements[elementIndex];
        setEditModal({
            isOpen: true,
            groupIndex,
            elementIndex,
            content: getElementContent(element),
            label: getElementLabel(element)
        });
    };

    const closeEditModal = () => {
        setEditModal({
            isOpen: false,
            content: '',
            label: ''
        });
    };

    const saveEditedElement = (newContent: string) => {
        if (editModal.groupIndex === undefined || editModal.elementIndex === undefined) {
            return;
        }

        const currentElement = page.groups[editModal.groupIndex].elements[editModal.elementIndex];
        let updatedElement: PageElement;

        if (typeof currentElement === 'string') {
            // For markdown strings, just use the new content directly
            updatedElement = newContent;
        } else {
            // For objects, try to parse JSON
            try {
                updatedElement = JSON.parse(newContent);
            } catch (e) {
                // If JSON parsing fails, treat it as a markdown string
                updatedElement = newContent;
            }
        }

        const newPage = {
            ...page,
            groups: page.groups.map((group, gIdx) => {
                if (gIdx === editModal.groupIndex) {
                    return {
                        ...group,
                        elements: group.elements.map((el, eIdx) => 
                            eIdx === editModal.elementIndex ? updatedElement : el
                        )
                    };
                }
                return group;
            })
        };
        onPageChange(newPage);
    };

    const getElementIcon = (element: PageElement): string => {
        if (typeof element === 'string') {
            return ELEMENT_CONFIGS[ElementType.MARKDOWN].icon;
        }
        
        const elementType = element.type as ElementType;
        return ELEMENT_CONFIGS[elementType]?.icon || '🎨';
    };

    const getElementLabel = (element: PageElement): string => {
        if (typeof element === 'string') {
            return element.slice(0, 30) + (element.length > 30 ? '...' : '');
        }
        
        const label = (element as any).label || (element as any).variableId || element.type;
        return label.slice(0, 30) + (label.length > 30 ? '...' : '');
    };

    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid #e1e5e9',
                background: '#f6f8fa'
            }}>
                <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#24292f',
                    marginBottom: '4px'
                }}>
                    Document Structure
                </div>
                <div style={{ fontSize: '12px', color: '#656d76' }}>
                    {page.title}
                </div>
            </div>

            {/* Tree Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {page.groups.map((group, groupIndex) => (
                    <div key={groupIndex} style={{ marginBottom: '12px' }}>
                        {/* Group Header */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            background: '#f6f8fa',
                            marginBottom: '4px'
                        }}>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#24292f' }}>
                                📁 {group.groupId}
                            </span>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                                <button
                                    onClick={(e) => openInsertMenu(e, groupIndex)}
                                    style={{
                                        background: '#2da44e',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                    title="Insert element"
                                >
                                    + Insert
                                </button>
                                <button
                                    onClick={() => deleteGroup(groupIndex)}
                                    style={{
                                        background: '#da3633',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                    title="Delete group"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        {/* Group Elements */}
                        <div style={{ marginLeft: '16px' }}>
                            {group.elements.map((element, elementIndex) => (
                                <div 
                                    key={elementIndex} 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        marginBottom: '2px',
                                        background: 'white',
                                        border: '1px solid #d1d9e0'
                                    }}
                                >
                                    <span style={{ fontSize: '13px', color: '#24292f', flex: 1 }}>
                                        {getElementIcon(element)} {getElementLabel(element)}
                                    </span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            onClick={(e) => openInsertMenu(e, groupIndex, elementIndex)}
                                            style={{
                                                background: '#0969da',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                padding: '2px 6px',
                                                fontSize: '10px',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                            title="Insert after"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => openEditModal(groupIndex, elementIndex)}
                                            style={{
                                                background: 'white',
                                                color: '#24292f',
                                                border: '1px solid #d1d9e0',
                                                borderRadius: '3px',
                                                padding: '2px 6px',
                                                fontSize: '10px',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                            title="Edit element"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => deleteElement(groupIndex, elementIndex)}
                                            style={{
                                                background: '#da3633',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                padding: '2px 6px',
                                                fontSize: '10px',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                            title="Delete element"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Add Group Button */}
                <button
                    onClick={addGroup}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: '2px dashed #d1d9e0',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: '#656d76',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#0969da';
                        e.currentTarget.style.color = '#0969da';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#d1d9e0';
                        e.currentTarget.style.color = '#656d76';
                    }}
                >
                    + Add Group
                </button>
            </div>

            {/* Insert Menu */}
            <ElementInsertMenu
                isOpen={insertMenu.isOpen}
                onClose={closeInsertMenu}
                onInsert={insertElement}
                position={insertMenu.position}
            />

            {/* Edit Modal */}
            <EditElementModal
                isOpen={editModal.isOpen}
                onClose={closeEditModal}
                onSave={saveEditedElement}
                initialContent={editModal.content}
                elementLabel={editModal.label}
            />
        </div>
    );
}