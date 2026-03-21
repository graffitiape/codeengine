/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { generateUuid } from '../../../../base/common/uuid.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { Memento } from '../../../common/memento.js';
import { IKanbanService, IKanbanTicket, KanbanColumn } from '../common/kanban.js';

interface IKanbanStorageData {
	tickets: IKanbanTicket[];
}

export class KanbanService extends Disposable implements IKanbanService {
	declare readonly _serviceBrand: undefined;

	private readonly _onDidChangeTickets = this._register(new Emitter<void>());
	readonly onDidChangeTickets: Event<void> = this._onDidChangeTickets.event;

	private readonly memento: Memento<IKanbanStorageData>;

	constructor(@IStorageService storageService: IStorageService) {
		super();
		this.memento = new Memento('kanban-board', storageService);
	}

	private getStorage(): IKanbanStorageData {
		const storage = this.memento.getMemento(StorageScope.WORKSPACE, StorageTarget.MACHINE) as IKanbanStorageData;
		if (!storage.tickets) {
			storage.tickets = [];
		}
		return storage;
	}

	private save(): void {
		this.memento.saveMemento();
		this._onDidChangeTickets.fire();
	}

	getTickets(): IKanbanTicket[] {
		return [...this.getStorage().tickets];
	}

	getTicketsByColumn(column: KanbanColumn): IKanbanTicket[] {
		return this.getStorage().tickets
			.filter(t => t.column === column)
			.sort((a, b) => a.order - b.order);
	}

	addTicket(title: string, description: string): IKanbanTicket {
		const storage = this.getStorage();
		const backlogTickets = storage.tickets.filter(t => t.column === KanbanColumn.Backlog);
		const now = Date.now();
		const ticket: IKanbanTicket = {
			id: generateUuid(),
			title,
			description,
			column: KanbanColumn.Backlog,
			createdAt: now,
			updatedAt: now,
			order: backlogTickets.length,
		};
		storage.tickets.push(ticket);
		this.save();
		return ticket;
	}

	updateTicket(id: string, changes: Partial<IKanbanTicket>): void {
		const storage = this.getStorage();
		const index = storage.tickets.findIndex(t => t.id === id);
		if (index === -1) {
			return;
		}
		storage.tickets[index] = {
			...storage.tickets[index],
			...changes,
			id, // ensure id cannot be changed
			updatedAt: Date.now(),
		};
		this.save();
	}

	moveTicket(id: string, targetColumn: KanbanColumn, targetOrder?: number): void {
		const storage = this.getStorage();
		const ticket = storage.tickets.find(t => t.id === id);
		if (!ticket) {
			return;
		}
		ticket.column = targetColumn;
		ticket.updatedAt = Date.now();

		if (targetOrder !== undefined) {
			ticket.order = targetOrder;
		} else {
			// Place at end of target column
			const columnTickets = storage.tickets.filter(t => t.column === targetColumn && t.id !== id);
			ticket.order = columnTickets.length;
		}

		this.save();
	}

	deleteTicket(id: string): void {
		const storage = this.getStorage();
		const index = storage.tickets.findIndex(t => t.id === id);
		if (index === -1) {
			return;
		}
		storage.tickets.splice(index, 1);
		this.save();
	}

	assignAgent(ticketId: string, agentId: string, agentName: string): void {
		this.updateTicket(ticketId, { assignedAgentId: agentId, assignedAgentName: agentName });
	}

	unassignAgent(ticketId: string): void {
		this.updateTicket(ticketId, { assignedAgentId: undefined, assignedAgentName: undefined });
	}
}
