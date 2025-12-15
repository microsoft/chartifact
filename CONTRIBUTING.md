# Contributing to Chartifact

Thank you for your interest in contributing to Chartifact! This document provides guidelines and information to help you contribute effectively.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Community](#community)

## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- npm (comes with Node.js)
- Git
- A code editor (VS Code is recommended for the best development experience)

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/chartifact.git
   cd chartifact
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/microsoft/chartifact.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Build the project**:
   ```bash
   npm run build
   ```

### Project Structure

Chartifact uses a monorepo structure with multiple packages:

- `packages/` - Core packages and components
- `docs/` - Documentation and website content
- `.github/` - GitHub configuration and workflows

## How to Contribute

We welcome contributions in many forms:

- 🐛 **Bug fixes** - Help us squash bugs
- ✨ **New features** - Add new capabilities to Chartifact
- 📝 **Documentation** - Improve our docs, add examples
- 🎨 **Examples** - Create new example documents
- 🧪 **Tests** - Improve test coverage
- 💡 **Ideas** - Share your ideas in discussions or issues

## Development Workflow

### Creating a Branch

Create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### Making Changes

1. Make your changes in your branch
2. Follow the [coding guidelines](#coding-guidelines)
3. Test your changes thoroughly
4. Commit your changes with clear, descriptive commit messages

### Testing Your Changes

Before submitting your changes:

1. Ensure all existing tests pass
2. Add new tests for new functionality
3. Test your changes manually if applicable
4. Verify that the build completes successfully

### Keeping Your Fork Updated

Regularly sync your fork with the upstream repository:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Coding Guidelines

### General Principles

- Write clear, readable code
- Follow existing code style and patterns
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable and function names

### TypeScript Guidelines

- Use TypeScript for type safety
- Define proper interfaces and types
- Avoid using `any` when possible
- Document public APIs with JSDoc comments

### Documentation

- Update documentation when adding or changing features
- Include examples for new features
- Keep the README.md up to date
- Add inline comments for complex code

### Security

- **Never commit secrets or credentials**
- Follow secure coding practices
- Report security vulnerabilities privately (see [SECURITY.md](SECURITY.md))
- Sanitize user inputs appropriately

### Examples

When creating examples in `packages/web-deploy/json/`:

- Use JSON format for examples
- Validate against the schema in `docs/schema/idoc_v1.d.ts`
- Do not use HTML elements (Markdown only)
- Test examples in the viewer before submitting
- Follow existing example patterns and structure

## Submitting Changes

### Pull Request Process

1. **Ensure your code is ready**:
   - All tests pass
   - Code follows style guidelines
   - Documentation is updated
   - Commits are clean and descriptive

2. **Create a pull request**:
   - Push your branch to your fork
   - Open a pull request against the `main` branch
   - Fill out the pull request template completely
   - Link any related issues

3. **Code review**:
   - Address reviewer feedback promptly
   - Make requested changes in new commits
   - Keep the conversation professional and constructive

4. **After approval**:
   - A maintainer will merge your pull request
   - Your branch will be deleted automatically

### Commit Message Guidelines

Write clear, concise commit messages:

```
Short summary (50 characters or less)

More detailed explanation if needed. Wrap at 72 characters.
Explain what and why, not how.

Fixes #123
```

### Pull Request Title

Use a descriptive title that summarizes the change:

- ✨ `Add support for custom chart colors`
- 🐛 `Fix dropdown selection bug in tables`
- 📝 `Update installation documentation`
- ♻️ `Refactor variable binding logic`

## Reporting Issues

### Before Creating an Issue

- Check if the issue already exists
- Verify the issue is reproducible
- Gather relevant information (version, environment, steps to reproduce)

### Creating a Good Issue

Use the appropriate issue template and provide:

- Clear, descriptive title
- Detailed description of the problem or feature
- Steps to reproduce (for bugs)
- Expected vs. actual behavior (for bugs)
- Screenshots or examples if applicable
- Your environment details (OS, Node version, etc.)

## Community

### Getting Help

- 📖 Read the [documentation](https://microsoft.github.io/chartifact/)
- 💬 Start a [discussion](https://github.com/microsoft/chartifact/discussions)
- 🐛 Check existing [issues](https://github.com/microsoft/chartifact/issues)

### Communication Guidelines

- Be respectful and inclusive
- Stay on topic
- Help others when you can
- Follow the [Code of Conduct](https://opensource.microsoft.com/codeofconduct/)

## License

By contributing to Chartifact, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to Chartifact! 🎉
