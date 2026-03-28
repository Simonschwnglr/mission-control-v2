# Mission Control V2 - Deployment

## Backend Deployment (Render/Railway)

1. Push backend to GitHub
2. Connect Render/Railway
3. Set environment variable: ANTHROPIC_API_KEY
4. Deploy

## Frontend Deployment (Vercel)

1. Push frontend to GitHub  
2. Connect Vercel
3. Set environment variable: NEXT_PUBLIC_API_URL
4. Deploy

## Local Development

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## Testing

1. Open http://localhost:3000
2. Click "New Agent"
3. Enter: name="Test Agent", task="Say hello", command="echo Hello World"
4. Watch live logs
