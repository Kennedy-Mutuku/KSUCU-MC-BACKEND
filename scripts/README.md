# Database Setup Scripts

This directory contains scripts to create test users and admin accounts for the KSUCU-MC application.

## Available Scripts

### 1. Create Regular User
Creates a test user account that can submit feedback.

```bash
npm run create-user
```

**Default User Credentials:**
- Email: `john.doe@student.ksucu.ac.ke`
- Password: `user123`
- Username: John Doe
- Ministry: Praise & Worship
- Year of Study: 3

### 2. Create Message Admin
Creates a super admin account that can view all feedback messages.

```bash
npm run create-message-admin
```

**Default Admin Credentials:**
- Email: `messages@ksucu.admin.co.ke`
- Password: `messages123`
- Phone: +254700111222

### 3. Create Super Admin (Existing)
Creates the main super admin account.

```bash
npm run create-admission-admin
```

## How to Use

### Step 1: Create Test Accounts

In the backend directory, run:

```bash
# Create a regular user
npm run create-user

# Create a message admin
npm run create-message-admin
```

### Step 2: Test User Login Flow

1. **Login as User:**
   - Go to `http://localhost:5173/signIn`
   - Email: `john.doe@student.ksucu.ac.ke`
   - Password: `user123`

2. **Submit Feedback:**
   - Click "Quick Links" → "Feedback"
   - Fill in the form
   - Uncheck "Anonymous" to see your user info attached
   - Submit feedback

3. **Logout:**
   - Click your username in header → Logout

### Step 3: Test Admin Login Flow

1. **Login as Admin:**
   - Go to `http://localhost:5173/admin`
   - Email: `messages@ksucu.admin.co.ke`
   - Password: `messages123`

2. **View Messages:**
   - You'll see the super admin dashboard
   - Feedback messages are displayed
   - Can view both anonymous and identified messages

## Message System Architecture

### User Submission Flow:
```
User → Quick Links → Feedback → Fill Form → Submit
                                              ↓
                                     POST /messages
                                              ↓
                                      MongoDB (messages)
```

### Admin View Flow:
```
Admin → Login → Super Admin Dashboard
                         ↓
                  GET /sadmin/feedback
                         ↓
                View all messages
```

## Customizing Credentials

To customize the default credentials, edit the respective script files:

- `scripts/createUser.js` - Modify `userData` object
- `scripts/createMessageAdmin.js` - Modify `adminData` object

## Notes

- Scripts check if accounts already exist and update them if they do
- All passwords are hashed using bcrypt before storage
- MongoDB connection uses fallback to `mongodb://127.0.0.1:27017/ksucu-mc`
- Scripts automatically close database connection after completion

## Troubleshooting

**Error: "Cannot connect to MongoDB"**
- Ensure MongoDB is running: `mongod` or start MongoDB service
- Check connection string in `.env` file

**Error: "User already exists"**
- Script will update existing user with new password
- No action needed, this is expected behavior

**Error: "Module not found"**
- Run `npm install` in the backend directory
- Ensure you're in the correct directory
