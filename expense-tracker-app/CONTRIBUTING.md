# Contributing to Expense Tracker

First off, thank you for considering contributing to Expense Tracker! It's people like you that make Expense Tracker such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful
* List some other applications where this enhancement exists

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Include screenshots and animated GIFs in your pull request whenever possible
* Follow our [coding standards](#coding-standards)
* End all files with a newline
* Avoid platform-dependent code

## Development Process

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Commit your changes
4. Push to your fork
5. Submit a Pull Request

### Setting up Development Environment

```bash
# Clone your fork
git clone https://github.com/your-username/expense-tracker.git

# Navigate to the project directory
cd expense-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test-file.js

# Run tests with coverage
npm run test:coverage
```

## Coding Standards

### JavaScript

* Use ES6+ features
* Use meaningful variable and function names
* Add comments for complex logic
* Follow the existing code style
* Use async/await for asynchronous operations
* Properly handle errors

### CSS/Tailwind

* Follow BEM naming convention for custom CSS
* Use Tailwind utility classes when possible
* Keep stylesheets organized and modular
* Maintain responsive design principles

### HTML

* Use semantic HTML elements
* Ensure accessibility standards
* Include proper ARIA attributes
* Maintain proper heading hierarchy

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

## Documentation

* Keep README.md updated
* Document all new features
* Update API documentation
* Include JSDoc comments for functions
* Update changelog

## Review Process

The core team looks at Pull Requests on a regular basis. After feedback has been given we expect responses within two weeks. After two weeks we may close the pull request if it isn't showing any activity.

## Community

* Join our [Discord server](https://discord.gg/example)
* Follow us on [Twitter](https://twitter.com/example)
* Read our [blog](https://example.com/blog)

## Financial Contributions

We also accept financial contributions through:
* [Open Collective](https://opencollective.com/example)
* [GitHub Sponsors](https://github.com/sponsors/example)

## License

By contributing, you agree that your contributions will be licensed under its MIT License.