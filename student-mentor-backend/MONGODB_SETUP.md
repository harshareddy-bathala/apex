# MongoDB Atlas Setup Guide

## Prerequisites
- MongoDB Atlas account (free tier available)
- Python 3.11+

## 1. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Choose "Free" tier when setting up
4. Set cluster name (e.g., `student-mentor-cluster`)
5. Choose a cloud provider and region (e.g., AWS, us-east-1)

## 2. Set up Database User

1. In Atlas dashboard, go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username: `studentmentor`
5. Set password: (choose a strong password)
6. Set user privileges: "Read and write to any database"
7. Click "Add User"

## 3. Configure Network Access

1. Go to "Network Access" in Atlas dashboard
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
4. For production, restrict to your server's IP address

## 4. Get Connection String

1. Go to "Clusters" in Atlas dashboard
2. Click "Connect" button
3. Choose "Connect your application"
4. Copy the connection string

It should look like:
```
mongodb+srv://studentmentor:<password>@student-mentor-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Replace `<password>` with your actual password.

## 5. Environment Variables

Create a `.env` file in the backend directory:

```bash
MONGODB_URL=mongodb+srv://studentmentor:yourpassword@student-mentor-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=student_mentor
```

## 6. Install Dependencies

```bash
pip install -r requirements.txt
```

## 7. Run the Application

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 8. Verify Connection

Check the health endpoint:
```bash
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "version": "2.0.0"
}
```

## Troubleshooting

- **Connection failed**: Check your MongoDB URL and network access rules
- **Authentication failed**: Verify username/password in connection string
- **Timeout**: Check if IP whitelist includes your server's IP

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for database users
- Restrict IP access in production
- Consider using MongoDB Atlas's built-in encryption
