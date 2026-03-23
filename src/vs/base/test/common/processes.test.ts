/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import * as processes from '../../common/processes.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from './utils.js';

suite('Processes', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('sanitizeProcessEnvironment', () => {
		const env = {
			FOO: 'bar',
			ELECTRON_ENABLE_STACK_DUMPING: 'x',
			ELECTRON_ENABLE_LOGGING: 'x',
			ELECTRON_NO_ASAR: 'x',
			ELECTRON_NO_ATTACH_CONSOLE: 'x',
			ELECTRON_RUN_AS_NODE: 'x',
			CODEENGINE_CLI: 'x',
			CODEENGINE_DEV: 'x',
			CODEENGINE_IPC_HOOK: 'x',
			CODEENGINE_NLS_CONFIG: 'x',
			CODEENGINE_PORTABLE: '3',
			CODEENGINE_PID: 'x',
			CODEENGINE_SHELL_LOGIN: '1',
			CODEENGINE_CODE_CACHE_PATH: 'x',
			CODEENGINE_NEW_VAR: 'x',
			GDK_PIXBUF_MODULE_FILE: 'x',
			GDK_PIXBUF_MODULEDIR: 'x',
			CODEENGINE_PYTHON_BASH_ACTIVATE: 'source /path/to/venv/bin/activate',
			CODEENGINE_PYTHON_ZSH_ACTIVATE: 'source /path/to/venv/bin/activate',
			CODEENGINE_PYTHON_PWSH_ACTIVATE: '. /path/to/venv/Scripts/Activate.ps1',
			CODEENGINE_PYTHON_FISH_ACTIVATE: 'source /path/to/venv/bin/activate.fish',
			CODEENGINE_PYTHON_AUTOACTIVATE_GUARD: '1'
		};
		processes.sanitizeProcessEnvironment(env);
		assert.strictEqual(env['FOO'], 'bar');
		assert.strictEqual(env['CODEENGINE_SHELL_LOGIN'], '1');
		assert.strictEqual(env['CODEENGINE_PORTABLE'], '3');
		assert.strictEqual(env['CODEENGINE_PYTHON_BASH_ACTIVATE'], undefined);
		assert.strictEqual(env['CODEENGINE_PYTHON_ZSH_ACTIVATE'], undefined);
		assert.strictEqual(env['CODEENGINE_PYTHON_PWSH_ACTIVATE'], undefined);
		assert.strictEqual(env['CODEENGINE_PYTHON_FISH_ACTIVATE'], undefined);
		assert.strictEqual(env['CODEENGINE_PYTHON_AUTOACTIVATE_GUARD'], undefined);
		assert.strictEqual(Object.keys(env).length, 3);
	});
});
