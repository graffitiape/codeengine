/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../nls.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { EditorInputCapabilities, IUntypedEditorInput } from '../../../common/editor.js';
import { URI } from '../../../../base/common/uri.js';
import { Schemas } from '../../../../base/common/network.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { kanbanBoardIcon } from './kanbanIcons.js';

export class KanbanEditorInput extends EditorInput {

	static readonly ID = 'workbench.input.kanban';
	static readonly RESOURCE = URI.from({ scheme: Schemas.vscodeKanban, authority: 'board' });

	override get typeId(): string {
		return KanbanEditorInput.ID;
	}

	override get editorId(): string | undefined {
		return this.typeId;
	}

	override get resource(): URI {
		return KanbanEditorInput.RESOURCE;
	}

	override get capabilities(): EditorInputCapabilities {
		return EditorInputCapabilities.Readonly | EditorInputCapabilities.Singleton;
	}

	override matches(other: EditorInput | IUntypedEditorInput): boolean {
		if (super.matches(other)) {
			return true;
		}
		return other instanceof KanbanEditorInput;
	}

	override getName(): string {
		return localize('kanbanBoard', "Kanban Board");
	}

	override getIcon(): ThemeIcon {
		return kanbanBoardIcon;
	}

	override toUntyped(): IUntypedEditorInput {
		return {
			resource: KanbanEditorInput.RESOURCE,
			options: {
				override: KanbanEditorInput.ID,
				pinned: true
			}
		};
	}
}
