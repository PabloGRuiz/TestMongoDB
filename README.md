# Employee Dashboard - MongoDB App

This is a complete full-stack web application for managing employees, featuring an authentication system, role-based access control, dark/light mode toggle, soft-deletion (recycle bin), and backup export/import capabilities.

The backend is built with **Node.js, Express, and Mongoose (MongoDB)**. The frontend uses plain **HTML, JavaScript, and Tailwind CSS**.

---

## 📋 Prerequisites

Before running the application, make sure you have the following installed on your system:

1. **Node.js**: [Download and install Node.js](https://nodejs.org/) (Version 16 or higher is recommended).
2. **MongoDB**: You must have a MongoDB server running locally on the default port (`27017`). 
   - You can install [MongoDB Community Server](https://www.mongodb.com/try/download/community).
   - Alternatively, you can run MongoDB via Docker: `docker run -d -p 27017:27017 --name mongo-local mongo`

---

## 🚀 Installation & Setup

Follow these steps to get the app running:

### 1. Install Dependencies
Open your terminal in the root directory of the project and run:
```bash
npm install
```
This will install all required packages: `express`, `mongoose`, `bcryptjs`, and `jsonwebtoken`.

### 2. Initialize the Database
The app comes with a built-in script that automatically cleans the database and seeds it with an Admin user, a Standard user, and 100 sample employees.

Run the initializer script:
```bash
node app.js
```
*Wait until the script finishes and prints `=> [APP INITIALIZER] PROCESS COMPLETED SUCCESSFULLY.`*

**Default Credentials Created:**
- **Admin**: `admin@system.com` / `adminpassword123`
- **User**: `user@system.com` / `userpassword123`

### 3. Start the Server
Once the database is initialized, start the web server:
```bash
node server.js
```
You should see: `=> Web server running at http://localhost:3000`

---

## 💻 How to Test the App

1. **Open the App**: Open your web browser and navigate to [http://localhost:3000](http://localhost:3000).
2. **Login**: Use the Admin credentials (`admin@system.com` / `adminpassword123`) to access all features.
3. **Explore Features**:
   - **Dark Mode**: Click the 🌙/☀️ icon in the navbar.
   - **Search**: Use the search bar to find employees in real-time.
   - **Add Employees**: Use the left panel to insert a new employee. Try using the "+ Add Field" button to inject dynamic unstructured data.
   - **Details View**: Click the "Details" button on an employee to see their full profile. If you are an Admin, you can click "Modify Data" to edit their fields.
   - **Trash/Recycle Bin**: Delete an employee from the dashboard. They won't be permanently lost. Click the "Trash 🗑️" button in the navbar to view soft-deleted records, restore them, or delete them permanently.
   - **Backups**: Use the "Export Backup" button to save your collection to a `.json` file, and "Import Backup" to restore the entire collection later.

## 👥 Role Permissions
- **Admin**: Can create, edit, delete, access the Recycle Bin, and restore backups.
- **HR/User/Viewer**: Can view the dashboard, search, and export backups, but cannot modify records or access the Trash.
