# Message Aggregator Frontend

This project is a React application that aggregates messages from various platforms including LinkedIn, Twitter (X), WhatsApp, Discord, Facebook, and Telegram. The application is built using Vite for fast development and build processes.

## Project Structure

- **src/**: Contains the source code for the application.
  - **components/**: Reusable components for the application.
    - `MessageList.tsx`: Displays a list of aggregated messages.
    - `MessageCard.tsx`: Represents an individual message card.
    - `PlatformSelector.tsx`: Allows users to select platforms for message aggregation.
    - `Sidebar.tsx`: Provides navigation options.
  - **services/**: Contains functions for API interactions.
    - `api.ts`: Handles API requests to the FastAPI backend.
    - `websocket.ts`: Manages WebSocket connections for real-time updates.
  - **types/**: TypeScript types and interfaces.
    - `index.ts`: Defines types used throughout the application.
  - **hooks/**: Custom hooks for managing state and logic.
    - `useMessages.ts`: Manages fetching and displaying messages.
  - **styles/**: Global styles for the application.
    - `index.css`: Contains CSS styles.

## Getting Started

1. **Install Dependencies**: Make sure to run `npm install` in the frontend directory to install all necessary packages.
2. **Run the Application**: Use `npm run dev` to start the development server and view the application in your browser.

## Future Enhancements

- Implement authentication for each platform.
- Add error handling and loading states for API requests.
- Enhance the UI/UX for better user experience.

## License

This project is licensed under the MIT License.