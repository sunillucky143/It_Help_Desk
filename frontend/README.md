Frontend scaffold: React three-pane workspace

Quickstart

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start dev server:

```bash
npm start
```

Notes

- The frontend expects backend at `http://localhost:4000` by default. Override with `REACT_APP_API_BASE` and `REACT_APP_SOCKET_URL` environment variables.
- For demo the app uses a hardcoded `currentUser` id=1 and orgId=1. Replace with proper auth in your integration.
