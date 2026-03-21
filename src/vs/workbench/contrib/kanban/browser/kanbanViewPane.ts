/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { $, append, clearNode, addDisposableListener } from '../../../../base/browser/dom.js';
import { localize } from '../../../../nls.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { ViewPane, IViewPaneOptions } from '../../../browser/parts/views/viewPane.js';
import { IKanbanService, IKanbanTicket, KanbanColumn } from '../common/kanban.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';

const COLUMN_LABELS: Record<string, string> = {
	[KanbanColumn.Backlog]: localize('backlog', "Backlog"),
	[KanbanColumn.InProgress]: localize('inProgress', "In Progress"),
	[KanbanColumn.Done]: localize('done', "Done"),
};

export class KanbanViewPane extends ViewPane {

	static readonly ID = 'workbench.view.kanban';

	private bodyContainer!: HTMLElement;
	private readonly renderDisposables = this._register(new DisposableStore());

	constructor(
		options: IViewPaneOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService,
		@IKanbanService private readonly kanbanService: IKanbanService,
		@ICommandService private readonly commandService: ICommandService,
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);

		this._register(this.kanbanService.onDidChangeTickets(() => this.renderBody()));
	}

	protected override renderBody(container?: HTMLElement): void {
		if (container) {
			this.bodyContainer = container;
			super.renderBody(container);
		}

		if (!this.bodyContainer) {
			return;
		}

		this.renderDisposables.clear();
		clearNode(this.bodyContainer);

		this.bodyContainer.style.padding = '12px';

		// Open board button
		const openBoardBtn = append(this.bodyContainer, $('button', {
			style: 'width: 100%; padding: 8px 12px; margin-bottom: 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px; background-color: var(--vscode-button-background); color: var(--vscode-button-foreground);'
		}));
		const icon = $('span');
		icon.classList.add(...ThemeIcon.asClassNameArray(Codicon.project));
		openBoardBtn.appendChild(icon);
		append(openBoardBtn, $('span', undefined, localize('openFullBoard', "Open Full Board")));
		this.renderDisposables.add(addDisposableListener(openBoardBtn, 'click', () => {
			this.commandService.executeCommand('workbench.action.openKanbanBoard');
		}));

		// Render ticket summary per column
		const columns = [KanbanColumn.Backlog, KanbanColumn.InProgress, KanbanColumn.Done];
		for (const column of columns) {
			this.renderColumnSummary(column);
		}
	}

	private renderColumnSummary(column: KanbanColumn): void {
		const tickets = this.kanbanService.getTicketsByColumn(column);
		const label = COLUMN_LABELS[column] ?? column;

		const section = append(this.bodyContainer, $('div', {
			style: 'margin-bottom: 12px;'
		}));

		// Column header
		const header = append(section, $('div', {
			style: 'display: flex; align-items: center; justify-content: space-between; padding: 4px 0; margin-bottom: 4px;'
		}));
		append(header, $('span', {
			style: 'font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--vscode-foreground);'
		}, label));
		append(header, $('span', {
			style: 'font-size: 11px; color: var(--vscode-descriptionForeground); background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); padding: 1px 6px; border-radius: 8px;'
		}, `${tickets.length}`));

		// Ticket list
		if (tickets.length === 0) {
			append(section, $('div', {
				style: 'font-size: 12px; color: var(--vscode-descriptionForeground); font-style: italic; padding: 4px 0;'
			}, localize('noTickets', "No tickets")));
		} else {
			for (const ticket of tickets) {
				this.renderTicketItem(section, ticket);
			}
		}
	}

	private renderTicketItem(container: HTMLElement, ticket: IKanbanTicket): void {
		const item = append(container, $('div', {
			style: 'display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 4px; cursor: default; font-size: 12px;'
		}));

		// Status icon
		let statusIcon: ThemeIcon;
		if (ticket.column === KanbanColumn.Done) {
			statusIcon = Codicon.pass;
		} else if (ticket.column === KanbanColumn.InProgress) {
			statusIcon = Codicon.loading;
		} else {
			statusIcon = Codicon.circle;
		}
		const iconSpan = $('span');
		iconSpan.classList.add(...ThemeIcon.asClassNameArray(statusIcon));
		item.appendChild(iconSpan);

		// Title
		append(item, $('span', {
			style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;'
		}, ticket.title));

		// Agent badge
		if (ticket.assignedAgentName) {
			const badge = $('span');
			badge.classList.add(...ThemeIcon.asClassNameArray(Codicon.copilot));
			badge.title = ticket.assignedAgentName;
			item.appendChild(badge);
		}
	}

	protected override layoutBody(height: number, width: number): void {
		super.layoutBody(height, width);
	}
}
