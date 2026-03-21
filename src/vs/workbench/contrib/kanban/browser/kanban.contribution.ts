/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize, localize2 } from '../../../../nls.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { EditorExtensions, EditorsOrder, IEditorFactoryRegistry } from '../../../common/editor.js';
import { registerAction2, Action2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { KanbanEditorInput } from './kanbanInput.js';
import { KanbanEditorPane, KanbanEditorInputSerializer } from './kanbanBoard.js';
import { KanbanService } from './kanbanService.js';
import { IKanbanService } from '../common/kanban.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { kanbanBoardIcon } from './kanbanIcons.js';
import { IViewContainersRegistry, IViewsRegistry, Extensions as ViewContainerExtensions, ViewContainerLocation } from '../../../common/views.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { KanbanViewPane } from './kanbanViewPane.js';

const KANBAN_VIEWLET_ID = 'workbench.view.kanbanContainer';

// Register Service
registerSingleton(IKanbanService, KanbanService, InstantiationType.Delayed);

// --- Activity Bar: View Container + View ---

const viewContainer = Registry.as<IViewContainersRegistry>(ViewContainerExtensions.ViewContainersRegistry).registerViewContainer({
	id: KANBAN_VIEWLET_ID,
	title: localize2('kanban', 'Kanban'),
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [KANBAN_VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }]),
	icon: kanbanBoardIcon,
	order: 5,
}, ViewContainerLocation.Sidebar);

Registry.as<IViewsRegistry>(ViewContainerExtensions.ViewsRegistry).registerViews([{
	id: KanbanViewPane.ID,
	name: localize2('kanbanBoard', 'Kanban Board'),
	containerIcon: kanbanBoardIcon,
	ctorDescriptor: new SyncDescriptor(KanbanViewPane),
	canToggleVisibility: true,
	canMoveView: true,
	order: 0,
}], viewContainer);

// --- Editor Pane (full board in editor area) ---

Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(
		KanbanEditorPane,
		KanbanEditorPane.ID,
		localize('kanbanBoardEditor', "Kanban Board")
	),
	[new SyncDescriptor(KanbanEditorInput)]
);

Registry.as<IEditorFactoryRegistry>(EditorExtensions.EditorFactory).registerEditorSerializer(
	KanbanEditorInput.ID,
	KanbanEditorInputSerializer
);

// --- Commands ---

// "Open Kanban Board" - opens full board in editor area
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.openKanbanBoard',
			title: localize2('openKanbanBoard', 'Open Kanban Board'),
			category: Categories.View,
			f1: true,
			keybinding: {
				weight: KeybindingWeight.WorkbenchContrib,
				primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyK,
			},
			icon: kanbanBoardIcon,
		});
	}

	run(accessor: ServicesAccessor) {
		const editorService = accessor.get(IEditorService);
		return editorService.openEditor(new KanbanEditorInput(), { pinned: true, revealIfOpened: true });
	}
});

// "Toggle Kanban View" - switch between kanban and last editor
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.toggleKanbanView',
			title: localize2('toggleKanbanView', 'Toggle Kanban Board'),
			category: Categories.View,
			f1: true,
		});
	}

	run(accessor: ServicesAccessor) {
		const editorService = accessor.get(IEditorService);
		const activeEditor = editorService.activeEditor;

		if (activeEditor instanceof KanbanEditorInput) {
			// Switch back to most recent non-Kanban editor
			const editors = editorService.getEditors(EditorsOrder.MOST_RECENTLY_ACTIVE);
			const nonKanban = editors.find(e => !(e.editor instanceof KanbanEditorInput));
			if (nonKanban) {
				return editorService.openEditor(nonKanban.editor, nonKanban.groupId);
			}
		} else {
			return editorService.openEditor(new KanbanEditorInput(), { pinned: true, revealIfOpened: true });
		}
		return undefined;
	}
});
