# Kura

Kura is a full-stack real-time chat application built with React, Vite, Tailwind CSS, Express, MongoDB, and Socket.IO. It supports authentication, friend discovery and requests, direct messaging, group chats, profile/settings management, image uploads through Cloudinary, and live presence updates.

## Current Scope

- Email/password authentication with JWT
- Registration with optional profile image upload
- Demo password-reset flow
- Friend search, suggestions, requests, accept/reject flow
- Direct messaging with typing indicators and seen state
- Group creation, group messaging, member management, and admin controls
- User settings for profile, password, status, notifications, mute/block, and account deletion
- Support report submission
- Responsive React UI with dashboard, contacts, chat, and settings experiences
- Socket-driven live presence and chat updates

## Tech Stack

- Frontend: React 18, React Router, Vite, Tailwind CSS, Axios, Socket.IO client, Lucide icons
- Backend: Node.js, Express, Socket.IO, Mongoose, JWT, bcrypt, multer, nodemailer
- Database: MongoDB
- Media: Cloudinary

## Monorepo Layout

```text
Project_Kura/
├── README.md
├── .env.example
├── package.json
├── client/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       ├── styles/
│       └── utils/
└── server/
    ├── .env.example
    ├── package.json
    └── src/
        ├── config/
        ├── controllers/
        ├── middleware/
        ├── models/
        ├── routes/
        ├── seed/
        ├── socket/
        ├── utils/
        └── index.js
```

## File Summary

### Root

- `package.json`: convenience scripts to run client and server together
- `.env.example`: reminder to copy environment templates from `client/` and `server/`

### Client

- `client/package.json`: frontend dependencies and Vite scripts
- `client/index.html`: app shell and Google Fonts include
- `client/tailwind.config.js`: theme colors, fonts, shadows, animations
- `client/postcss.config.js`: Tailwind and autoprefixer wiring
- `client/vite.config.js`: Vite React setup on port `5173`
- `client/src/main.jsx`: React bootstrap with router, auth, and theme providers
- `client/src/App.jsx`: route definitions for auth, dashboard, chat, contacts, reset flow, and settings entry
- `client/src/utils/api.js`: Axios instance with bearer token injection
- `client/src/context/AuthContext.jsx`: login, register, logout, session restore, and shared auth state
- `client/src/context/ThemeContext.jsx`: dark/light theme persistence
- `client/src/hooks/useSocket.js`: Socket.IO connection and presence listeners
- `client/src/styles/index.css`: Tailwind base styles and reusable utility classes

### Client Pages

- `AuthPage.jsx`: login/register switching and submit handling
- `ForgotPasswordPage.jsx`: demo reset-link generation page
- `ResetPasswordPage.jsx`: password reset form
- `Dashboard.jsx`: overview screen with recent activity, favorites, and demo schedule cards
- `ContactsPage.jsx`: friends, suggestions, incoming requests, search, and online filter
- `ChatPage.jsx`: main messaging workspace, socket listeners, direct/group chat actions, modals, and settings overlay

### Client Components

- `components/auth/*`: auth layout and auth form UI
- `components/common/Loader.jsx`: blocking loading state
- `components/common/ProtectedRoute.jsx`: auth gate for private routes
- `components/layout/TopBar.jsx`: global top bar with profile menu and theme toggle
- `components/layout/SidebarRail.jsx`: left rail navigation
- `components/UserCard.jsx`: reusable contact/friend/request card
- `components/chat/ConversationList.jsx`: inbox sidebar, search, requests, and group create entry
- `components/chat/ChatArea.jsx`: message thread and composer
- `components/chat/ProfilePanel.jsx`: direct chat actions and group management tools
- `components/settings/SettingsPanel.jsx`: settings modal for profile, password, notifications, status, support, and danger zone

### Server

- `server/package.json`: API scripts for dev, start, and seed
- `server/src/index.js`: Express app bootstrap, CORS, route mounting, Socket.IO, DB startup, and error handlers
- `server/src/config/db.js`: MongoDB connection helper
- `server/src/config/cloudinary.js`: Cloudinary client configuration

### Server Models

- `User.js`: account profile, auth fields, friend relationships, notifications, mute/block/starred state
- `Message.js`: direct and group messages with text, image, and seen flag
- `Group.js`: group metadata, members, admins, and optional image
- `SupportReport.js`: support ticket submissions

### Server Controllers

- `authController.js`: register, login, session lookup, forgot password, reset password
- `userController.js`: search, favorites, and suggestion logic
- `friendRequestController.js`: send/accept/reject requests, pending list, and friends list
- `messageController.js`: recent messages, direct thread fetch, send message, mark seen, delete chat
- `groupController.js`: create group, fetch groups/messages, send group messages, add/remove members, manage admins, delete group
- `userSettingsController.js`: profile edits, password changes, status, notifications, mute/unmute, block/unblock, delete account
- `supportController.js`: support report creation

### Server Routes

- `authRoutes.js`: `/api/auth/*`
- `userRoutes.js`: `/api/users/*` and `/api/user/*` friend/suggestion/search endpoints
- `friendRequestRoutes.js`: `/api/friend-request/*`
- `friendRoutes.js`: `/api/friends`
- `messageRoutes.js`: `/api/messages/*`
- `groupRoutes.js`: `/api/group/*`
- `userSettingsRoutes.js`: `/api/user/*` settings endpoints
- `supportRoutes.js`: `/api/support/*`

### Server Middleware, Socket, Utils, Seed

- `authMiddleware.js`: bearer-token protection
- `errorMiddleware.js`: 404 and generic API error responses
- `uploadMiddleware.js`: in-memory image upload validation with 5 MB limit
- `socket/socketState.js`: online user tracking, targeted emits, and visibility-aware presence updates
- `socket/socketHandler.js`: socket event wiring for presence, typing, direct messages, and group room joins
- `utils/generateToken.js`: JWT signing helper
- `utils/sendEmail.js`: console/SMTP/Ethereal email transport helper for password-reset mail
- `utils/uploadImage.js`: Cloudinary upload helper


## Environment Variables

### Server

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/kura
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
EMAIL_MODE=console
MAIL_FROM=Kura <no-reply@kura.local>
SMTP_SERVICE=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Client

Create `client/.env` from `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Local Setup

1. Install dependencies:

```bash
npm install --prefix server
npm install --prefix client
```

2. Copy env files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Start both apps:

```bash
npm run dev
```

4. Open:

- Client: `http://localhost:5173`
- Server: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

### Optional Commands

```bash
npm run dev:server
npm run dev:client
npm run build
npm run seed --prefix server
```

## API Summary

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password/:token`

### Users, Friends, Requests

- `GET /api/users/search?q=`
- `GET /api/users/favorites`
- `GET /api/users/suggestions`
- `GET /api/users/friends`
- `POST /api/users/add-friend/:id`
- `POST /api/users/accept/:id`
- `GET /api/friends`
- `GET /api/friend-request/pending`
- `POST /api/friend-request/send/:id`
- `POST /api/friend-request/accept/:id`
- `POST /api/friend-request/reject/:id`

### Messages

- `GET /api/messages/recent`
- `GET /api/messages/:userId`
- `POST /api/messages`
- `PATCH /api/messages/seen/:userId`
- `DELETE /api/messages/:userId`

### Groups

- `POST /api/group/create`
- `GET /api/group`
- `GET /api/group/:id/messages`
- `POST /api/group/message`
- `POST /api/group/:groupId/add-member`
- `POST /api/group/:groupId/remove-member`
- `POST /api/group/:groupId/make-admin`
- `POST /api/group/:groupId/remove-admin`
- `DELETE /api/group/:groupId`

### Settings and Support

- `PUT /api/user/update-profile`
- `PUT /api/user/change-password`
- `PUT /api/user/status`
- `PUT /api/user/notifications`
- `POST /api/user/mute/:id`
- `POST /api/user/unmute/:id`
- `POST /api/user/block/:id`
- `POST /api/user/unblock/:id`
- `DELETE /api/user/delete`
- `POST /api/support/report`

## Socket Events

### Client emits

- `user:online`
- `typing:start`
- `typing:stop`
- `message:send`
- `group:join`
- `group:joinMany`

### Server emits

- `presence:update`
- `userOnline`
- `userOffline`
- `typing:start`
- `typing:stop`
- `message:new`
- `friend-request:new`
- `friend-request:accepted`
- `friend-request:rejected`
- `friend-request:updated`
- `statusChanged`
- `status:changed`
- `group:created`
- `groupUpdated`
- `groupRemoved`
- `newGroupMessage`

## Product Notes

- Password reset currently returns a reset URL in the API response for demo use. The email helper exists, but `authController.js` is not yet wired to send real reset emails.
- Image upload requires valid Cloudinary credentials. Without them, image-related routes return configuration errors.
- Several settings sections such as appearance, privacy, and integrations are UI placeholders for future work.
- Dashboard recent activity and starred items fall back to demo content when API data is empty.
- `client/src/components/chat/FriendRequests.jsx` is present but not part of the active main chat layout.
- There is an extra `client/client/package-lock.json` file that does not appear to be used by the app.

## Seed Data

The seed script clears existing `User` and `Message` documents, then creates:

- Alice Cooper
- Bob Martin
- Clara Smith

with a small friend/request graph and sample direct messages.

Run:

```bash
npm run seed --prefix server
```

## Suggested Next Cleanup

- Wire password reset to `sendPasswordResetEmail`
- Remove debug `console.log` calls from message controllers
- Add tests for auth, messaging, and group permissions
- Decide whether starred chats should be editable in the UI
- Remove unused files and duplicate lockfile artifacts
