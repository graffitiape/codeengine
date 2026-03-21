/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from '../../../../base/common/event.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

export const enum KanbanColumn {
	Backlog = 'backlog',
	InProgress = 'in-progress',
	Done = 'done'
}

export interface IKanbanTicket {
	id: string;
	title: string;
	description: string;
	column: KanbanColumn;
	assignedAgentId?: string;
	assignedAgentName?: string;
	createdAt: number;
	updatedAt: number;
	order: number;
}

export const IKanbanService = createDecorator<IKanbanService>('kanbanService');

export interface IKanbanService {
	readonly _serviceBrand: undefined;
	readonly onDidChangeTickets: Event<void>;

	getTickets(): IKanbanTicket[];
	getTicketsByColumn(column: KanbanColumn): IKanbanTicket[];
	addTicket(title: string, description: string): IKanbanTicket;
	updateTicket(id: string, changes: Partial<IKanbanTicket>): void;
	moveTicket(id: string, targetColumn: KanbanColumn, targetOrder?: number): void;
	deleteTicket(id: string): void;
	assignAgent(ticketId: string, agentId: string, agentName: string): void;
	unassignAgent(ticketId: string): void;
}
