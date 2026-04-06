# Kura - Online Social Chatting Website

Kura is a full-stack real-time messaging platform built with React (Vite), Tailwind CSS, Node.js/Express, MongoDB, Socket.io, JWT auth, and Cloudinary image uploads.

## Features

- JWT authentication with bcrypt password hashing
- Register/login with profile image upload
- Protected frontend routes
- Friend request system (send/accept/reject)
- Real-time chat via Socket.io
- Online/offline presence and typing indicator
- File/image message upload via Cloudinary
- Messenger-style 3-column UI with dark mode
- Local seed script for demo data

## Project Structure

```text
kura/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       ├── hooks/
│       └── utils/
└── server/
    └── src/
        ├── models/
        ├── routes/
        ├── controllers/
        ├── middleware/
        ├── socket/
        └── seed/
```

## Setup

1. Install dependencies:

```bash
npm install --prefix server
npm install --prefix client
```

2. Configure environment variables:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Start development servers:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Seed Demo Data

```bash
npm run seed --prefix server
```

Demo users (password for all: `password123`):

- `alice@kura.dev`
- `bob@kura.dev`
- `clara@kura.dev`

## API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users/search?q=`
- `GET /api/users/friends`
- `GET /api/users/friend-requests`
- `POST /api/users/friend-request`
- `POST /api/users/friend-request/respond`
- `GET /api/messages/:userId`
- `POST /api/messages`
- `PATCH /api/messages/seen/:userId`

## Deployment Notes

- Set production `CLIENT_URL`, MongoDB URI, JWT secret, and Cloudinary credentials.
- Build client with `npm run build --prefix client` and serve static output via your hosting provider.
- Run server with `npm run start --prefix server`.

