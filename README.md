# MCQ Snip olve

A Spring Boot application that extracts multiple-choice questions from screenshots and provides AI-generated answers using Google's Gemini AI.

## Features

- Paste screenshots directly from clipboard or upload image files
- Process images directly with Google's Gemini 2.5 Flash AI in "flashmode"
- Extract questions, options, and generate answers in a single step
- Display results with explanations
- Clean and responsive user interface with React and Tailwind

## Prerequisites

- Java 17 or higher
- Gradle
- Google Gemini API key (for image processing and answer generation)

## Project Structure

```bash
SnapSolve/
│
├── backend/      # Spring Boot API server
└── frontend/     # React UI
```

## Backend Setup (/backend)

### 1. Clone the repository

```bash
git clone https://github.com/manirajyadav-1/SnapSolve.git
cd SnapSolve
```

### 2. Configure API Keys

Edit `src/main/resources/application.properties` and replace the API key placeholder with your actual key:

```properties
# Google Gemini API key
gemini.api.key=your-gemini-api-key-here
```

You can get a Gemini API key from the [Google AI Studio](https://makersuite.google.com/app/apikey).

### 3. Build the application

```bash
mvn clean install
```

### 5. Run the application

```bash
mvn spring-boot:run
```

The backend application will be available at `http://localhost:8080`

## OR
### Docker Image
The Docker image for this project is available on Docker Hub:https://hub.docker.com/repository/docker/maniraj1/snapsolve

Pull the image

```bash
   docker pull maniraj1/snapsolve
```

Run the container
```bash
   docker run -p 8080:8080 maniraj1/snapsolve
```

This maps the container's port 8080 to your local machine's port 8080. Once running, the application will be available at: http://localhost:8080


## Frontend Setup (/frontend)

### 1. Navigate to the frontend directory

```bash
cd ../frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the React app

```bash
npm start
```
Frontend will be available at: `http://localhost:5173`

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Take a screenshot of MCQ questions
3. Choose one of the following methods:
   - **Paste directly**: Copy the screenshot to your clipboard (Ctrl+C or Print Screen), then paste it (Ctrl+V) into the paste area
   - **Upload file**: Click the "Upload File" tab and select the screenshot file using the file picker
4. Wait for the processing to complete
5. View the extracted questions and AI-generated answers

## Technical Details

### Architecture

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Spring Boot application
- **AI**: Google Gemini 2.5 Flash API for image processing and answer generation

### Key Components

- **GeminiService**: Processes images directly with Google's Gemini 2.5 Flash AI to extract questions and generate answers in one step
- **MCQController**: Handles HTTP requests and coordinates the services
- **Question Model**: Represents MCQ questions with their options, answers, and explanations

## Limitations

- AI-generated answers may not always be correct
- Performance depends on the quality of the screenshot
- Requires an active internet connection to access the Gemini API
- The Gemini API has rate limits and usage quotas

## Output
![App Screenshot](https://raw.githubusercontent.com/manirajyadav-1/SnapSolve/refs/heads/main/output/SnapSolveOutput.png)


