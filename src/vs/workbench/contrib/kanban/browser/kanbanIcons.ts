/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from '../../../../base/common/codicons.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { localize } from '../../../../nls.js';

export const kanbanBoardIcon = registerIcon(
	'kanban-board-label-icon',
	Codicon.project,
	localize('kanbanBoardIcon', 'Icon for the Kanban board editor.')
);
