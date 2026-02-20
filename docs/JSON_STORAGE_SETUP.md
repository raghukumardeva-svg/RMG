# RMG Portal - JSON File Storage Setup

## Overview

This application stores all data directly in JSON files located in `src/data/`. A Node.js/Express backend server handles read/write operations to these files, eliminating the need for localStorage or MongoDB.

## Architecture

```
Frontend (React)
     ↓
Zustand Stores (in-memory state)
     ↓
API Calls (http://localhost:3001/api)
     ↓
Express Backend Server
     ↓
JSON Files (src/data/*.json)
```

## Setup Instructions

### 1. Install Backend Dependencies

```powershell
cd server
npm install
```

### 2. Start the Backend Server

```powershell
cd server
npm run dev
```

The server will run on `http://localhost:3001`

### 3. Start the Frontend

In a separate terminal:

```powershell
# From project root
npm run dev
```

The frontend will run on `http://localhost:5173`

## Data Files

All data is stored in `src/data/`:

| File | Purpose | API Endpoint |
|------|---------|-------------|
| `employees.json` | Employee master data | `/api/employees` |
| `announcements.json` | Company announcements | `/api/announcements` |
| `holidays.json` | Company holidays | `/api/holidays` |
| `celebrations.json` | Birthdays & anniversaries | `/api/celebrations` |
| `newJoiners.json` | Recent hires | `/api/new-joiners` |
| `leaves.json` | Leave requests | `/api/leaves` |

## API Endpoints

### Announcements
- `GET /api/announcements` - Fetch all
- `POST /api/announcements` - Create new
- `PUT /api/announcements/:id` - Update
- `DELETE /api/announcements/:id` - Delete
- `POST /api/announcements/:id/like` - Toggle like
- `POST /api/announcements/:id/comment` - Add comment

### Holidays
- `GET /api/holidays` - Fetch all
- `POST /api/holidays` - Create new
- `PUT /api/holidays/:id` - Update
- `DELETE /api/holidays/:id` - Delete

### Celebrations
- `GET /api/celebrations` - Fetch all (filter by `?type=birthday` or `?type=anniversary`)
- `POST /api/celebrations` - Create new
- `PUT /api/celebrations/:id` - Update
- `DELETE /api/celebrations/:id` - Delete

### New Joiners
- `GET /api/new-joiners` - Fetch all
- `POST /api/new-joiners` - Create new
- `PUT /api/new-joiners/:id` - Update
- `DELETE /api/new-joiners/:id` - Delete

### Leaves
- `GET /api/leaves` - Fetch all
- `POST /api/leaves` - Create new
- `PUT /api/leaves/:id` - Update
- `PATCH /api/leaves/:id/approve` - Approve leave
- `PATCH /api/leaves/:id/reject` - Reject leave
- `DELETE /api/leaves/:id` - Delete

### Employees
- `GET /api/employees` - Fetch all
- `GET /api/employees/:id` - Fetch by ID
- `POST /api/employees` - Create new
- `PUT /api/employees/:id` - Update
- `DELETE /api/employees/:id` - Delete

## How It Works

1. **On Page Load**: Frontend fetches data from API
2. **API Response**: Backend reads JSON file and returns data
3. **User Actions**: Add/Edit/Delete operations
4. **API Call**: Frontend sends request to backend
5. **File Update**: Backend writes changes to JSON file
6. **State Update**: Frontend updates Zustand store
7. **UI Refresh**: Components re-render with new data

## Key Changes from Previous Version

### Removed
- ❌ `localStorage` persistence (zustand persist middleware)
- ❌ "Export to JSON" button
- ❌ Manual data sync requirements
- ❌ MongoDB dependency for basic operations

### Added
- ✅ Express backend server
- ✅ Direct JSON file read/write
- ✅ RESTful API endpoints
- ✅ Automatic file updates
- ✅ Real-time data persistence

## Testing

### 1. Test Backend Server

```powershell
# Check server health
Invoke-WebRequest -Uri http://localhost:3001/health

# Fetch announcements
Invoke-WebRequest -Uri http://localhost:3001/api/announcements | Select-Object -Expand Content | ConvertFrom-Json
```

### 2. Test CRUD Operations

Open the application and:
1. Add a new announcement → Check `src/data/announcements.json`
2. Edit an announcement → Verify changes in JSON file
3. Delete an announcement → Confirm removal from JSON file
4. Refresh the page → Data persists

### 3. Verify File Updates

```powershell
# Watch JSON file for changes
Get-Content src\data\announcements.json -Wait
```

## Troubleshooting

### Server Won't Start
```powershell
# Check if port 3001 is in use
Get-NetTCPConnection -LocalPort 3001

# Kill the process if needed
Stop-Process -Id <PID>
```

### CORS Errors
- Ensure backend server is running on `http://localhost:3001`
- Check `server/src/index.ts` has `cors()` middleware

### File Permission Errors
- Ensure Node.js has write permissions to `src/data/` directory
- Run VSCode as administrator if needed

### Data Not Persisting
1. Check server logs for errors
2. Verify JSON file format is valid
3. Ensure API endpoints are responding (check Network tab in DevTools)

## Development Workflow

1. **Start both servers**:
   - Terminal 1: `cd server && npm run dev`
   - Terminal 2: `npm run dev` (from root)

2. **Make changes in UI**:
   - Add/edit/delete data through the interface
   - Changes automatically saved to JSON files

3. **Verify changes**:
   - Open `src/data/*.json` files
   - See changes reflected immediately

4. **Reset data**:
   - Edit JSON files directly
   - Refresh browser to see changes

## Production Deployment

For production, you would:
1. Build the frontend: `npm run build`
2. Serve static files from Express
3. Use environment variables for API_URL
4. Add authentication/authorization
5. Consider migrating to a database for better concurrency handling

## Notes

- **No localStorage**: All data is server-side in JSON files
- **No manual export**: Changes are automatic
- **File-based**: Simple, readable, version-control friendly
- **Development-friendly**: Easy to inspect and modify data
- **Not for high concurrency**: JSON files are best for development/small teams

## Next Steps

- Add authentication to protect API endpoints
- Implement data validation schemas
- Add file backup mechanism
- Consider migrating to SQLite or PostgreSQL for production
