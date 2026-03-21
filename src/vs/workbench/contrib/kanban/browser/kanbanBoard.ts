/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/kanban.css';
import { $, addDisposableListener, Dimension, clearNode, append } from '../../../../base/browser/dom.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { localize } from '../../../../nls.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { IEditorOpenContext, IEditorSerializer } from '../../../common/editor.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { IEditorGroup } from '../../../services/editor/common/editorGroupsService.js';
import { IKanbanService, IKanbanTicket, KanbanColumn } from '../common/kanban.js';
import { KanbanEditorInput } from './kanbanInput.js';
import { IContextKeyService, RawContextKey } from '../../../../platform/contextkey/common/contextkey.js';
import { IEditorOptions } from '../../../../platform/editor/common/editor.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { ThemeIcon } from '../../../../base/common/themables.js';

export const inKanbanBoardContext = new RawContextKey<boolean>('inKanbanBoard', false);

const COLUMN_CONFIG: { column: KanbanColumn; label: string; showAdd: boolean }[] = [
	{ column: KanbanColumn.Backlog, label: localize('backlog', "Backlog"), showAdd: true },
	{ column: KanbanColumn.InProgress, label: localize('inProgress', "In Progress"), showAdd: false },
	{ column: KanbanColumn.Done, label: localize('done', "Done"), showAdd: false },
];

export class KanbanEditorPane extends EditorPane {

	static readonly ID = 'workbench.editor.kanban';

	private container!: HTMLElement;
	private columnsContainer!: HTMLElement;
	private readonly renderDisposables = this._register(new DisposableStore());
	private inKanbanContext: ReturnType<typeof inKanbanBoardContext.bindTo>;

	constructor(
		group: IEditorGroup,
		@IKanbanService private readonly kanbanService: IKanbanService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IInstantiationService _instantiationService: IInstantiationService,
		@IContextKeyService contextKeyService: IContextKeyService,
	) {
		super(KanbanEditorPane.ID, group, telemetryService, themeService, storageService);
		this.inKanbanContext = inKanbanBoardContext.bindTo(contextKeyService);
	}

	protected override createEditor(parent: HTMLElement): void {
		this.container = append(parent, $('.kanban-container'));

		// Header
		const header = append(this.container, $('.kanban-header'));
		append(header, $('h2', undefined, localize('kanbanBoardTitle', "Kanban Board")));

		// Columns container
		this.columnsContainer = append(this.container, $('.kanban-columns'));
	}

	override async setInput(input: KanbanEditorInput, options: IEditorOptions | undefined, context: IEditorOpenContext, token: CancellationToken): Promise<void> {
		await super.setInput(input, options, context, token);
		if (token.isCancellationRequested) {
			return;
		}
		this.renderBoard();

		this.renderDisposables.add(this.kanbanService.onDidChangeTickets(() => {
			this.renderBoard();
		}));
	}

	override setEditorVisible(visible: boolean): void {
		super.setEditorVisible(visible);
		this.inKanbanContext.set(visible);
	}

	override layout(dimension: Dimension): void {
		this.container.style.width = `${dimension.width}px`;
		this.container.style.height = `${dimension.height}px`;
	}

	private renderBoard(): void {
		this.addTicketFormVisible = false;
		this.renderDisposables.clear();

		// Re-subscribe to changes after clear
		this.renderDisposables.add(this.kanbanService.onDidChangeTickets(() => {
			this.renderBoard();
		}));

		clearNode(this.columnsContainer);

		for (const config of COLUMN_CONFIG) {
			this.renderColumn(config.column, config.label, config.showAdd);
		}
	}

	private renderColumn(column: KanbanColumn, label: string, showAdd: boolean): void {
		const columnEl = append(this.columnsContainer, $('.kanban-column'));
		columnEl.dataset.column = column;

		// Column header
		const headerEl = append(columnEl, $('.column-header'));
		const tickets = this.kanbanService.getTicketsByColumn(column);
		const titleContainer = append(headerEl, $('div', { style: 'display: flex; align-items: center;' }));
		append(titleContainer, $('h3', undefined, label));
		append(titleContainer, $('span.column-count', undefined, `(${tickets.length})`));

		// Cards container (created before add button so we can pass it to the handler)
		const cardsContainer = append(columnEl, $('.column-cards'));

		if (showAdd) {
			const addBtn = append(headerEl, $('button.add-ticket-button', { title: localize('addTicket', "Add Ticket") }));
			addBtn.appendChild(renderCodicon(Codicon.add));
			this.renderDisposables.add(addDisposableListener(addBtn, 'click', () => {
				this.showAddTicketForm(cardsContainer);
			}));
		}

		// Drop zone
		this.renderDisposables.add(addDisposableListener(cardsContainer, 'dragover', (e: DragEvent) => {
			e.preventDefault();
			if (e.dataTransfer) {
				e.dataTransfer.dropEffect = 'move';
			}
			columnEl.classList.add('drag-over');
		}));

		this.renderDisposables.add(addDisposableListener(cardsContainer, 'dragleave', (e: DragEvent) => {
			// Only remove if we're truly leaving the column
			const relatedTarget = e.relatedTarget as HTMLElement | null;
			if (!relatedTarget || !columnEl.contains(relatedTarget)) {
				columnEl.classList.remove('drag-over');
			}
		}));

		this.renderDisposables.add(addDisposableListener(cardsContainer, 'drop', (e: DragEvent) => {
			e.preventDefault();
			columnEl.classList.remove('drag-over');
			const ticketId = e.dataTransfer?.getData('text/plain');
			if (ticketId) {
				this.kanbanService.moveTicket(ticketId, column);
			}
		}));

		// Render cards
		if (tickets.length === 0) {
			append(cardsContainer, $('div.column-empty', undefined, localize('noTickets', "No tickets")));
		} else {
			for (const ticket of tickets) {
				this.renderCard(cardsContainer, ticket);
			}
		}
	}

	private renderCard(container: HTMLElement, ticket: IKanbanTicket): void {
		const card = append(container, $('.kanban-card'));
		card.draggable = true;
		card.dataset.ticketId = ticket.id;

		// Drag events
		this.renderDisposables.add(addDisposableListener(card, 'dragstart', (e: DragEvent) => {
			if (e.dataTransfer) {
				e.dataTransfer.setData('text/plain', ticket.id);
				e.dataTransfer.effectAllowed = 'move';
			}
			card.classList.add('dragging');
		}));

		this.renderDisposables.add(addDisposableListener(card, 'dragend', () => {
			card.classList.remove('dragging');
		}));

		// Card content
		append(card, $('div.card-title', undefined, ticket.title));

		if (ticket.description) {
			append(card, $('div.card-description', undefined, ticket.description));
		}

		// Footer
		const footer = append(card, $('div.card-footer'));

		// Agent badge
		if (ticket.assignedAgentName) {
			const badge = append(footer, $('div.card-agent-badge'));
			badge.appendChild(renderCodicon(Codicon.copilot));
			append(badge, $('span', undefined, ticket.assignedAgentName));
		} else {
			append(footer, $('div')); // spacer
		}

		// Actions
		const actions = append(footer, $('div.card-actions'));

		// Assign agent button
		const assignBtn = append(actions, $('button', { title: localize('assignAgent', "Assign Agent") }));
		assignBtn.appendChild(renderCodicon(Codicon.personAdd));
		this.renderDisposables.add(addDisposableListener(assignBtn, 'click', (e: MouseEvent) => {
			e.stopPropagation();
			// Phase 2: Agent assignment via quick pick
		}));

		// Play button (only if agent is assigned)
		if (ticket.assignedAgentId) {
			const playBtn = append(actions, $('button.play-button', { title: localize('startAgent', "Start Agent") }));
			playBtn.appendChild(renderCodicon(Codicon.play));
			this.renderDisposables.add(addDisposableListener(playBtn, 'click', (e: MouseEvent) => {
				e.stopPropagation();
				// Phase 2: Start agent session
				this.kanbanService.moveTicket(ticket.id, KanbanColumn.InProgress);
			}));
		}

		// Delete button
		const deleteBtn = append(actions, $('button.delete-button', { title: localize('deleteTicket', "Delete Ticket") }));
		deleteBtn.appendChild(renderCodicon(Codicon.trash));
		this.renderDisposables.add(addDisposableListener(deleteBtn, 'click', (e: MouseEvent) => {
			e.stopPropagation();
			this.kanbanService.deleteTicket(ticket.id);
		}));
	}

	private addTicketFormVisible = false;

	private showAddTicketForm(cardsContainer: HTMLElement): void {
		if (this.addTicketFormVisible) {
			return;
		}
		this.addTicketFormVisible = true;

		const form = $('div.add-ticket-form');
		const titleInput = append(form, $('input', {
			type: 'text',
			placeholder: localize('ticketTitle', "Ticket title"),
		})) as HTMLInputElement;

		const descInput = append(form, $('textarea', {
			placeholder: localize('ticketDescription', "Description (optional)"),
		})) as HTMLTextAreaElement;

		const formActions = append(form, $('div.form-actions'));

		const cancelBtn = append(formActions, $('button.cancel-button', undefined, localize('cancel', "Cancel")));
		const saveBtn = append(formActions, $('button.save-button', undefined, localize('save', "Save")));

		const removeForm = () => {
			form.remove();
			this.addTicketFormVisible = false;
		};

		const saveTicket = () => {
			const title = titleInput.value.trim();
			if (title) {
				this.kanbanService.addTicket(title, descInput.value.trim());
			}
			removeForm();
		};

		this.renderDisposables.add(addDisposableListener(cancelBtn, 'click', removeForm));
		this.renderDisposables.add(addDisposableListener(saveBtn, 'click', saveTicket));

		this.renderDisposables.add(addDisposableListener(titleInput, 'keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				saveTicket();
			} else if (e.key === 'Escape') {
				removeForm();
			}
		}));

		this.renderDisposables.add(addDisposableListener(descInput, 'keydown', (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				removeForm();
			}
		}));

		// Insert form at top of cards container
		cardsContainer.insertBefore(form, cardsContainer.firstChild);
		titleInput.focus();
	}

	override dispose(): void {
		this.inKanbanContext.reset();
		super.dispose();
	}
}

export class KanbanEditorInputSerializer implements IEditorSerializer {
	canSerialize(): boolean {
		return true;
	}

	serialize(): string {
		return '{}';
	}

	deserialize(instantiationService: IInstantiationService): EditorInput {
		return instantiationService.createInstance(KanbanEditorInput);
	}
}

function renderCodicon(icon: ThemeIcon): HTMLSpanElement {
	const span = $('span');
	span.classList.add(...ThemeIcon.asClassNameArray(icon));
	return span;
}
