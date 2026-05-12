# Deep Detect & Deep Shield

A full-stack deepfake detection system using React Native, Node.js (Express), Flask, and MongoDB. The system allows users to upload images/videos and receive AI-based authenticity predictions with explainable visual results.

---

## 🚀 Features
- Deepfake image & video detection
- Explainable AI (XAI) heatmaps
- Secure authentication system
- User profile management
- Detection history tracking
- REST APIs + ML inference server

---

## 🧱 Tech Stack
- Frontend: React Native
- Backend: Node.js + Express
- ML Service: Flask (Python)
- Database: MongoDB

## ⚙️ Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/<your-username>/Deep-Detect-Deep-Shield.git
cd Deep-Detect-Deep-Shield
cd server
npm install
```
Create .env file:
```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```
Run Server
```bash
npm run start
```
### 2. ML Service Setup (Flask)
```bash
cd "python server"
pip install -r requirements.txt
```
Run Flask server:
```bash
python app.py
```
### 3. Frontend Setup (React Native)
```bash
cd client
npm install
```
Run App
```bash
npx expo start
```
# Demo
Url: https://drive.google.com/drive/folders/1Er4cw4410qhait8VkYgiZqMN_i5ne77S?usp=sharing
