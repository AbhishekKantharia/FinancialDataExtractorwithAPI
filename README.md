# 📄 Invoice Extractor

An AI-powered invoice extraction application built with Django REST Framework and React. It allows users to upload invoices and extract text using Google Cloud Vision API.

## 🚀 Features

✅ User authentication (JWT-based)
✅ Invoice upload and validation (PDF, JPEG, PNG, TIFF)
✅ AI-based text extraction using Google Vision API
✅ Secure token-based API requests
✅ Frontend built with React & Tailwind CSS

## 📂 Project Structure


```
invoice-extractor/
│── backend/               # Django Backend
│   ├── api/               # API Endpoints
│   ├── users/             # Authentication System
│   ├── invoices/          # Invoice Uploads & Processing
│   ├── settings.py        # Django Settings
│   ├── urls.py            # API Routes
│   └── wsgi.py            # WSGI Entry Point
│
│── frontend/              # React Frontend
│   ├── src/
│   │   ├── components/    # UI Components
│   │   ├── context/       # Auth Context
│   │   ├── services/      # API Calls (Axios)
│   │   ├── App.tsx        # Main App
│   │   ├── main.tsx       # Entry Point
│   │   └── index.css      # Styles
│   ├── public/            # Static Files
│   └── package.json       # Frontend Dependencies
│
│── .env                   # Environment Variables
│── manage.py              # Django Management Script
│── requirements.txt        # Backend Dependencies
│── README.md               # Project Documentation
└── Dockerfile              # Containerization Setup
```

## 🔧 Installation

### 1️⃣ Backend (Django + PostgreSQL)

#### Clone the repo

```sh
git clone https://github.com/your-username/invoice-extractor.git
cd invoice-extractor/backend
```

#### Create a virtual environment

```sh
python -m venv venv
source venv/bin/activate  # (Windows: venv\Scripts\activate)
```

#### Install dependencies

```sh
pip install -r requirements.txt
```

#### Apply migrations

```sh
python manage.py migrate
```

#### Start the Django server

```sh
python manage.py runserver
```

### 2️⃣ Frontend (React)

```sh
cd ../frontend
```

#### Install dependencies

```bash
npm install
```

#### Start the React app

```bash
npm run dev
```

### 🌍 Environment Variables

Create a .env file in the backend directory:

```env
SECRET_KEY=your-secret-key
DEBUG=True

DB_NAME=invoice_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

## Google Cloud API Key

```env
GOOGLE_APPLICATION_CREDENTIALS=path/to/your-service-account.json
```

## 🔥 API Endpoints

```ini
Method	Endpoint	Description
POST	/api/register/	User Registration
POST	/api/token/	User Login (JWT)
GET	/api/profile/	Get User Profile
POST	/api/invoices/	Upload Invoice
GET	/api/invoices/{id}/	Get Invoice Details
```

## 🛠 Tech Stack

****Backend****: __Django REST Framework, PostgreSQL, JWT__

****Frontend****: __React, TypeScript, Tailwind CSS__

****AI Model****: __Google Cloud Vision API__

****Auth****: __JWT (djangorestframework-simplejwt)__


## 📝 License

This project is open-source under the MIT License.
