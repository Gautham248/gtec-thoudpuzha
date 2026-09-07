# 🪟 Windows Developer Setup & Instruction Manual

This guide provides step-by-step instructions for Windows developers to seamlessly set up and run the **G-TEC Thodupuzha** development server locally with **zero hassle**.

---

## 🧰 Prerequisites

Before getting started, make sure you have the following installed on Windows:

1. **Docker Desktop for Windows**:
   - Download & install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
   - Ensure **WSL 2 Backend** is enabled (*Settings ➔ General ➔ Use the WSL 2 based engine*).
2. **Git for Windows**:
   - Download & install [Git for Windows](https://gitforwindows.org/).
3. **VS Code** *(Optional, recommended)*:
   - Install the **WSL** and **Docker** extensions in VS Code for an integrated dev environment.

---

## 🚀 Quick Start: 1-Command Setup (Docker)

### Step 1: Clone the Repository
Open **PowerShell**, **Windows Terminal**, or **Git Bash** and run:

```powershell
git clone https://github.com/LeedsDigital-Dev/gtec-thoudpuzha.git
cd gtec-thoudpuzha
```

### Step 2: Start the Development Environment
Run a single command:

```powershell
docker compose up
```
*(Or if you have Node installed locally: `npm run dev:docker`)*

### What Happens Automatically:
1. **PostgreSQL Container (`gtec_postgres_dev`)** starts on `localhost:5432`.
2. **Database Schema Sync**: Prisma pushes all tables and relations.
3. **Database Seeding**: Sample courses, news, students, job postings, and site settings are populated automatically.
4. **Next.js Dev Server** starts on **`http://localhost:3000`** with live hot-reloading enabled.

### Step 3: Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)** to view the application with populated seed data!

---

## 🐧 Option B: WSL 2 (Ubuntu) Setup (Recommended for Best Performance)

For maximum file system speed on Windows, run the repo directly inside WSL 2:

1. Open **Ubuntu / WSL 2** terminal.
2. Clone the repo into your Linux home directory (avoid `/mnt/c/` for faster I/O):
   ```bash
   cd ~
   git clone https://github.com/LeedsDigital-Dev/gtec-thoudpuzha.git
   cd gtec-thoudpuzha
   ```
3. Run Docker Compose:
   ```bash
   docker compose up
   ```

---

## 🛠️ Windows Troubleshooting & Gotchas

### 1. Line Endings (`CRLF` vs `LF`)
- **Problem**: Windows Git converts LF line endings to CRLF (`\r\n`), causing Linux containers to fail when executing shell scripts.
- **Solution**: The project repository contains a `.gitattributes` file and `Dockerfile.dev` uses `dos2unix` to strip carriage returns automatically. You do **not** need to change line endings manually.

### 2. Port Conflicts (`5432` or `3000` Already in Use)
- **Problem**: If you have a local PostgreSQL installation running on Windows, port `5432` may be occupied.
- **Solution**: Stop local Windows PostgreSQL before starting Docker:
  ```powershell
  net stop postgresql-x64-16
  ```
  Or change the mapped port in `docker-compose.yml` (`"5433:5432"`).

### 3. Hot Reloading & CPU Performance Optimization
- **Problem**: Polling for file changes on Windows mounted drives (`C:\...`) can cause high CPU usage if thousands of dependency files are watched.
- **Solution**:
   - `docker-compose.yml` mounts only the source and development configuration directories into the container, while dependencies and `.next` remain in the image. File watching **only monitors your actual source code** (`src/`, `prisma/`, `public/`). This keeps CPU usage below 1%.
  - `WATCHPACK_POLLING=true` & `CHOKIDAR_USEPOLLING=true` are pre-configured in `docker-compose.yml` for instant live reload when saving files in VS Code on Windows.

### 4. Network Host Binding (`HOSTNAME=0.0.0.0`)
- **Solution**: `HOSTNAME=0.0.0.0` is pre-configured in `docker-compose.yml` so Next.js binds to all container network interfaces, ensuring Windows host browsers (`http://localhost:3000` or `http://127.0.0.1:3000`) never receive connection refused errors.

### 5. Clerk Auth Error (`host_invalid`)
- **Solution**: Working Clerk Development Sandbox keys are pre-configured in `.env.example` and `docker-compose.yml`. Copy `.env.example` to `.env.local` if running outside Docker:
  - **PowerShell**:
    ```powershell
    Copy-Item .env.example .env.local
    ```
  - **Command Prompt (CMD)**:
    ```cmd
    copy .env.example .env.local
    ```

---

## 💡 Daily Workflow for Windows Frontend Developers

1. Create a feature branch for your UI work:
   ```bash
   git checkout -b feat/my-ui-change
   ```
2. Start the container:
   ```bash
   docker compose up
   ```
3. Make UI edits in VS Code. Save files ➔ Browser auto-refreshes at `http://localhost:3000`.
4. Commit your changes and push to remote:
   ```bash
   git add .
   git commit -m "feat(ui): update course teaser section"
   git push origin feat/my-ui-change
   ```
