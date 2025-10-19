# Message Aggregator

This project is a message aggregator application that collects messages from various platforms including LinkedIn, Twitter (X), WhatsApp, Discord, Facebook, and Telegram. The application is built using React.js with Vite for the frontend and FastAPI for the backend.

## Project Structure

The project is organized into two main directories: `frontend` and `backend`.

### Frontend

- **src/**: Contains the source code for the React application.
  - **App.tsx**: Main component that sets up routing and layout.
  - **main.tsx**: Entry point for the React application.
  - **components/**: Contains reusable components.
    - **MessageList.tsx**: Displays a list of aggregated messages.
    - **MessageCard.tsx**: Represents an individual message card.
    - **PlatformSelector.tsx**: Allows users to select platforms for message aggregation.
    - **Sidebar.tsx**: Provides navigation options.
  - **services/**: Contains functions for API interaction.
    - **api.ts**: Handles API requests to the FastAPI backend.
    - **websocket.ts**: Manages WebSocket connections for real-time updates.
  - **types/**: Defines TypeScript types and interfaces.
    - **index.ts**: Contains type definitions.
  - **hooks/**: Custom hooks for managing state and logic.
    - **useMessages.ts**: Manages fetching and displaying messages.
  - **styles/**: Contains global styles.
    - **index.css**: Global CSS styles.

### Backend

- **app/**: Contains the FastAPI application code.
  - **main.py**: Entry point for the FastAPI application.
  - **api/**: Contains API-related code.
    - **__init__.py**: Marks the directory as a package.
    - **routes.py**: Defines API routes.
    - **websocket.py**: Manages WebSocket connections.
  - **services/**: Contains logic for interacting with different platforms.
    - **__init__.py**: Marks the directory as a package.
    - **linkedin.py**: LinkedIn API integration.
    - **twitter.py**: Twitter API integration.
    - **whatsapp.py**: WhatsApp API integration.
    - **discord.py**: Discord API integration.
    - **facebook.py**: Facebook API integration.
    - **telegram.py**: Telegram API integration.
    - **aggregator.py**: Logic for aggregating messages.
  - **models/**: Contains data models.
    - **__init__.py**: Marks the directory as a package.
    - **message.py**: Defines the message data model.
  - **config/**: Contains configuration settings.
    - **__init__.py**: Marks the directory as a package.
    - **settings.py**: Configuration settings for the backend.
  - **utils/**: Contains utility functions.
    - **__init__.py**: Marks the directory as a package.
    - **auth.py**: Utility functions for authentication.

### Root

- **docker-compose.yml**: Defines services and configurations for Docker containers.
- **README.md**: General documentation for the entire project.

## Setup Instructions

1. **Create the project directory:**
   ```
   mkdir message-aggregator
   cd message-aggregator
   ```

2. **Set up the frontend:**
   ```
   mkdir frontend
   cd frontend
   npm create vite@latest . --template react-ts
   npm install
   ```

3. **Set up the backend:**
   ```
   cd ..
   mkdir backend
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install fastapi uvicorn
   touch requirements.txt
   echo "fastapi\nuvicorn" > requirements.txt
   ```

4. **Create necessary directories and files for the backend:**
   ```
   mkdir -p app/api app/services app/models app/config app/utils
   touch app/main.py app/api/__init__.py app/api/routes.py app/api/websocket.py
   touch app/services/__init__.py app/services/linkedin.py app/services/twitter.py app/services/whatsapp.py app/services/discord.py app/services/facebook.py app/services/telegram.py app/services/aggregator.py
   touch app/models/__init__.py app/models/message.py
   touch app/config/__init__.py app/config/settings.py
   touch app/utils/__init__.py app/utils/auth.py
   touch .env.example README.md
   ```

5. **Create the Docker Compose file:**
   ```
   touch docker-compose.yml
   ```

6. **Install additional dependencies for the frontend as needed:**
   ```
   npm install axios
   ```

7. **Start the backend server:**
   ```
   uvicorn app.main:app --reload
   ```

8. **Start the frontend development server:**
   ```
   npm run dev
   ```

This setup provides a foundational structure for your message aggregator application. You can expand upon it by implementing the necessary logic for each platform's API integration and message aggregation.