# Message Aggregator Backend Documentation

## Overview

The Message Aggregator application is designed to collect and display messages from various social media and messaging platforms, including LinkedIn, Twitter (X), WhatsApp, Discord, Facebook, and Telegram. This backend is built using FastAPI, providing a robust and efficient API for the frontend application.

## Project Structure

The backend is organized into several directories, each serving a specific purpose:

- **app/**: Contains the main application code.
  - **api/**: Defines the API routes and WebSocket connections.
  - **services/**: Contains logic for interacting with external APIs of different platforms.
  - **models/**: Defines data models used in the application.
  - **config/**: Contains configuration settings for the application.
  - **utils/**: Contains utility functions, including authentication helpers.

## Setup Instructions

1. **Clone the Repository**: 
   Clone the repository to your local machine.

2. **Create a Virtual Environment**:
   Navigate to the `backend` directory and create a virtual environment:
   ```
   python -m venv venv
   ```

3. **Activate the Virtual Environment**:
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```
   - On Windows:
     ```
     venv\Scripts\activate
     ```

4. **Install Dependencies**:
   Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```

5. **Run the Application**:
   Start the FastAPI application using Uvicorn:
   ```
   uvicorn app.main:app --reload
   ```

## Environment Variables

An example of the required environment variables can be found in the `.env.example` file. Make sure to create a `.env` file in the `backend` directory with the necessary configurations.

## API Documentation

The API documentation can be accessed at `http://localhost:8000/docs` once the server is running. This provides an interactive interface to test the API endpoints.

## Contribution

Contributions to the project are welcome. Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.