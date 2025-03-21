# Expense Tracker

A modern, secure, and user-friendly expense tracking application built with Node.js, Express, and Tailwind CSS.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)
![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen.svg)

## Features

- 📊 Real-time expense tracking and budgeting
- 💰 Multiple currency support
- 📱 Responsive design for all devices
- 🔒 Secure authentication and data protection
- 📈 Interactive charts and reports
- 🔄 Data import/export functionality
- 📶 Offline support (PWA)
- 🌓 Dark mode support
- 🔔 Push notifications
- 🔄 Automatic backups

## Quick Start

```bash
# Clone the repository
git clone https://github.com/username/expense-tracker.git

# Navigate to project directory
cd expense-tracker

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f
```

## Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=sqlite:/path/to/db.sqlite
JWT_SECRET=your-secret-key
```

## Project Structure

```
expense-tracker/
├── public/           # Static files
├── src/             # Source code
│   ├── models/      # Database models
│   ├── routes/      # API routes
│   ├── views/       # EJS templates
│   └── config/      # Configuration files
├── tests/           # Test files
└── docs/            # Documentation
```

## API Documentation

### Authentication

```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
```

### Transactions

```http
GET /api/transactions
POST /api/transactions
PUT /api/transactions/:id
DELETE /api/transactions/:id
```

### Budgets

```http
GET /api/budgets
POST /api/budgets
PUT /api/budgets/:id
DELETE /api/budgets/:id
```

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT
);

-- Transactions table
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  amount DECIMAL,
  category TEXT,
  date DATE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test-file.js
```

## Security

- HTTPS enforced
- Input validation
- XSS protection
- CSRF protection
- Rate limiting
- SQL injection prevention
- Security headers
- Regular dependency updates

See [SECURITY.md](SECURITY.md) for more details.

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Deployment

### Vercel

```bash
vercel deploy
```

### Netlify

```bash
netlify deploy
```

### Docker

```bash
docker build -t expense-tracker .
docker run -p 3000:3000 expense-tracker
```

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Performance

- Lighthouse score: 98/100
- First contentful paint: < 1s
- Time to interactive: < 2s
- Performance budget: < 200KB

## Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Mobile apps
- [ ] AI-powered insights
- [ ] Cryptocurrency support

## Support

- 📧 Email: support@example.com
- 💬 Discord: [Join our server](https://discord.gg/example)
- 📚 Documentation: [Read the docs](https://docs.example.com)
- 🐛 Issues: [GitHub Issues](https://github.com/username/expense-tracker/issues)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/)
- [SQLite](https://www.sqlite.org/)

## Authors

- **Your Name** - *Initial work* - [GitHub](https://github.com/username)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for details.

---

Made with ❤️ by [Your Name](https://github.com/username)