# Phase 1 Backend Verification - Quick Tutorial

This guide provides the exact commands to verify your Phase 1 backend implementation.

## Prerequisites

You have already set up the backend foundation with:
- ✅ FastAPI server structure
- ✅ SQLite database with models (users, plans, tasks, reports, chats)
- ✅ Authentication system with bcrypt hashing
- ✅ Password change functionality
- ✅ JWT token generation
- ✅ User data isolation framework

## Quick Test Script

### 1. Make the verification script executable

```bash
cd /home/kevin/Desktop/Github/StudyLoop
chmod +x verify_phase1.sh
```

### 2. Run the Phase 1 verification

```bash
./verify_phase1.sh
```

## What the verification script does:

### Test 1: FastAPI Server Startup
- Starts the server on port 8000
- Checks if server responds with status 200
- **Expected:** "StudyLoop API" with "status": "running"

### Test 2 & 3: Database Initialization & Structure
- Creates SQLite database (studyloop.db)
- Verifies all 5 required tables exist
- **Expected:** Tables: users, plans, tasks, reports, chats

### Test 4: User Registration
- Tests POST /api/auth/register endpoint
- Registers test user: testuser_verify
- **Expected:** "User registered successfully" response

### Test 5: Password Hashing
- Checks that passwords are stored hashed, not plaintext
- **Expected:** Hash length > 20 characters (bcrypt)

### Test 6: User Login
- Tests POST /api/auth/login with valid credentials
- **Expected:** Returns access_token and user data

### Test 7: Invalid Credentials Rejection
- Tests wrong password handling (returns 401)
- Tests non-existent user handling (returns 401)
- **Expected:** Both return "Incorrect username or password"

### Test 8: User Token Isolation
- Creates two different users with different tokens
- **Expected:** Different users receive different authentication tokens

### Test 9: Framework Readiness
- Confirms authentication framework is ready for Phase 2
- **Expected:** Security and isolation principles in place

## Alternative: Manual Testing

If you prefer manual testing, use these curl commands:

### 1. Test server startup
```bash
uvicorn src.main:app --host 127.0.0.1 --port 8000 --log-level critical &
SERVER_PID=$!
sleep 3
curl -s http://127.0.0.1:8000/
kill $SERVER_PID
```

### 2. Test user registration
```bash
uvicorn src.main:app --host 127.0.0.1 --port 8000 --log-level critical &
SERVER_PID=$!
sleep 3

curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "test123@example.com",
    "password": "testpassword123"
  }'

kill $SERVER_PID
```

### 3. Test login
```bash
uvicorn src.main:app --host 127.0.0.1 --port 8000 --log-level critical &
SERVER_PID=$!
sleep 3

curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "password": "testpassword123"
  }'

kill $SERVER_PID
```

### 4. Test database structure
```bash
# Start server briefly to create database
uvicorn src.main:app --host 127.0.0.1 --port 8000 --log-level critical --shutdown-timeout 1 &
SERVER_PID=$!
sleep 2

python3 -c "
import sqlite3
conn = sqlite3.connect('studyloop.db')
cursor = conn.cursor()
cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\" ORDER BY name')
tables = [row[0] for row in cursor.fetchall()]
print('Database tables:', tables)
conn.close()
"

kill $SERVER_PID
```

## Expected Results

All tests should pass with ✅ indicators. If any test fails:

### Common Issues and Solutions:

1. **Server won't start**
   - Check if port 8000 is already in use
   - Run `pkill -f uvicorn` to kill existing processes
   - Try a different port: `uvicorn src.main:app --host 127.0.0.1 --port 8001`

2. **Database file not created**
   - Ensure FastAPI server has write permissions
   - Check database URL in settings
   - Verify table creation logic

3. **User registration fails**
   - Check for duplicate usernames
   - Verify email format
   - Ensure password meets requirements

4. **Password not hashed**
   - Check bcrypt installation: `uv add passlib[bcrypt]`
   - Verify security implementation

5. **Invalid credentials not rejected**
   - Check authentication logic
   - Verify password verification

## Troubleshooting

### Can't run the script?
```bash
# Check if uv is available
uv --version

# If not installed, install it:
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.cargo/bin/uv

# Then run the verification script
./verify_phase1.sh
```

### Dependencies missing?
```bash
source .venv/bin/activate
uv sync  # or pip install -r requirements.txt
./verify_phase1.sh
```

### Tests passing but server errors?
```bash
# Check server logs
uvicorn src.main:app --host 127.0.0.1 --port 8000 --log-level debug
```

## Success Indicators

Your Phase 1 backend is complete when you see:

```
✅ All Phase 1 verification tests completed
✅ Backend foundation is COMPLETE and READY for Phase 2
```

And the system meets all requirements:
- [x] FastAPI server structure
- [x] SQLite database with all required tables
- [x] Secure password hashing (bcrypt)
- [x] User registration and authentication
- [x] Invalid credentials rejection
- [x] User token isolation
- [x] Security framework for user data isolation

## Next Steps

Once Phase 1 is verified, move to **Phase 2**:

1. **Implement database service layer** - Centralize database operations
2. **Create API endpoints** - Implement actual API functionality
3. **Add user-specific endpoints** - User isolation and authorization
4. **Implement error handling** - Robust error responses
5. **Add logging and monitoring** - Production-ready logging

**Phase 1 foundation is ready!** Run the verification script to confirm everything works correctly.