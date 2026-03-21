/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { DisposableStore } from '../../../../../base/common/lifecycle.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { IStorageService, StorageScope } from '../../../../../platform/storage/common/storage.js';
import { Memento } from '../../../../common/memento.js';
import { TestStorageService } from '../../../../test/common/workbenchTestServices.js';
import { KanbanService } from '../../browser/kanbanService.js';
import { KanbanColumn } from '../../common/kanban.js';

suite('KanbanService', () => {
	const disposables = new DisposableStore();
	let service: KanbanService;

	setup(() => {
		const storageService: IStorageService = disposables.add(new TestStorageService());
		Memento.clear(StorageScope.WORKSPACE);
		service = disposables.add(new KanbanService(storageService));
	});

	teardown(() => {
		disposables.clear();
	});

	ensureNoDisposablesAreLeakedInTestSuite();

	test('addTicket creates a ticket in Backlog', () => {
		const ticket = service.addTicket('Test ticket', 'A description');

		assert.deepStrictEqual({
			title: ticket.title,
			description: ticket.description,
			column: ticket.column,
		}, {
			title: 'Test ticket',
			description: 'A description',
			column: KanbanColumn.Backlog,
		});
		assert.ok(ticket.id);
		assert.ok(ticket.createdAt > 0);
	});

	test('getTickets returns all tickets', () => {
		service.addTicket('Ticket 1', '');
		service.addTicket('Ticket 2', '');

		assert.strictEqual(service.getTickets().length, 2);
	});

	test('getTicketsByColumn filters correctly', () => {
		const t1 = service.addTicket('Ticket 1', '');
		service.addTicket('Ticket 2', '');
		service.moveTicket(t1.id, KanbanColumn.InProgress);

		assert.strictEqual(service.getTicketsByColumn(KanbanColumn.Backlog).length, 1);
		assert.strictEqual(service.getTicketsByColumn(KanbanColumn.InProgress).length, 1);
		assert.strictEqual(service.getTicketsByColumn(KanbanColumn.Done).length, 0);
	});

	test('moveTicket changes column', () => {
		const ticket = service.addTicket('Test', '');
		service.moveTicket(ticket.id, KanbanColumn.Done);

		const tickets = service.getTicketsByColumn(KanbanColumn.Done);
		assert.strictEqual(tickets.length, 1);
		assert.strictEqual(tickets[0].id, ticket.id);
	});

	test('deleteTicket removes the ticket', () => {
		const ticket = service.addTicket('To delete', '');
		assert.strictEqual(service.getTickets().length, 1);

		service.deleteTicket(ticket.id);
		assert.strictEqual(service.getTickets().length, 0);
	});

	test('updateTicket modifies ticket fields', () => {
		const ticket = service.addTicket('Original', 'Desc');
		service.updateTicket(ticket.id, { title: 'Updated' });

		const updated = service.getTickets().find(t => t.id === ticket.id);
		assert.strictEqual(updated?.title, 'Updated');
		assert.strictEqual(updated?.description, 'Desc');
	});

	test('assignAgent and unassignAgent', () => {
		const ticket = service.addTicket('Agent task', '');
		service.assignAgent(ticket.id, 'agent-1', 'Copilot');

		let found = service.getTickets().find(t => t.id === ticket.id);
		assert.strictEqual(found?.assignedAgentId, 'agent-1');
		assert.strictEqual(found?.assignedAgentName, 'Copilot');

		service.unassignAgent(ticket.id);
		found = service.getTickets().find(t => t.id === ticket.id);
		assert.strictEqual(found?.assignedAgentId, undefined);
		assert.strictEqual(found?.assignedAgentName, undefined);
	});

	test('onDidChangeTickets fires on mutations', () => {
		let fireCount = 0;
		disposables.add(service.onDidChangeTickets(() => fireCount++));

		const ticket = service.addTicket('Test', '');
		assert.strictEqual(fireCount, 1);

		service.updateTicket(ticket.id, { title: 'Changed' });
		assert.strictEqual(fireCount, 2);

		service.moveTicket(ticket.id, KanbanColumn.InProgress);
		assert.strictEqual(fireCount, 3);

		service.deleteTicket(ticket.id);
		assert.strictEqual(fireCount, 4);
	});
});
