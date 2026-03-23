# Code Engine

## The Repository

This repository is where we develop [Code Engine](https://github.com/graffitiape/codeengine) together with the community. This source code is available to everyone under the standard [MIT license](https://github.com/graffitiape/codeengine/blob/main/LICENSE.txt).

## About

Code Engine combines the simplicity of a code editor with what developers need for their core edit-build-debug cycle. It provides comprehensive code editing, navigation, and understanding support along with lightweight debugging, a rich extensibility model, and lightweight integration with existing tools.

## Contributing

There are many ways in which you can participate in this project, for example:

* [Submit bugs and feature requests](https://github.com/graffitiape/codeengine/issues), and help us verify as they are checked in
* Review [source code changes](https://github.com/graffitiape/codeengine/pulls)

If you are interested in fixing issues and contributing directly to the code base,
please see the document [How to Contribute](https://github.com/graffitiape/codeengine/wiki/How-to-Contribute), which covers the following:

* [How to build and run from source](https://github.com/graffitiape/codeengine/wiki/How-to-Contribute)
* [The development workflow, including debugging and running tests](https://github.com/graffitiape/codeengine/wiki/How-to-Contribute#debugging)
* [Coding guidelines](https://github.com/graffitiape/codeengine/wiki/Coding-Guidelines)
* [Submitting pull requests](https://github.com/graffitiape/codeengine/wiki/How-to-Contribute#pull-requests)
* [Finding an issue to work on](https://github.com/graffitiape/codeengine/wiki/How-to-Contribute#where-to-contribute)

## Feedback

* [Request a new feature](CONTRIBUTING.md)
* Upvote [popular feature requests](https://github.com/graffitiape/codeengine/issues?q=is%3Aopen+is%3Aissue+label%3Afeature-request+sort%3Areactions-%2B1-desc)
* [File an issue](https://github.com/graffitiape/codeengine/issues)

## Bundled Extensions

Code Engine includes a set of built-in extensions located in the [extensions](extensions) folder, including grammars and snippets for many languages. Extensions that provide rich language support (inline suggestions, Go to Definition) for a language have the suffix `language-features`. For example, the `json` extension provides coloring for `JSON` and the `json-language-features` extension provides rich language support for `JSON`.

## Development Container

This repository includes a Code Engine Dev Containers / GitHub Codespaces development container.

* For [Dev Containers](https://github.com/graffitiape/codeengine), use the **Dev Containers: Clone Repository in Container Volume...** command which creates a Docker volume for better disk I/O on macOS and Windows.

* For Codespaces, install the [GitHub Codespaces](https://marketplace.visualstudio.com/items?itemName=GitHub.codespaces) extension in Code Engine, and use the **Codespaces: Create New Codespace** command.

Docker / the Codespace should have at least **4 Cores and 6 GB of RAM (8 GB recommended)** to run a full build. See the [development container README](.devcontainer/README.md) for more information.

## License

Copyright (c) Microsoft Corporation. All rights reserved.

Licensed under the [MIT](LICENSE.txt) license.
