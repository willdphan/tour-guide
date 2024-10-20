# Web Tour Guide

This project is an AI-powered web navigation assistant that guides users through websites based on their queries or requests. It uses advanced language models and web interaction techniques to analyze web pages and perform actions.

## Project Structure

```
├── README.md
├── src/
│   └── app/
│       └── api/
│           ├── api.py
│           ├── extract.py
│           ├── mark_page.js
│           ├── mark.py
│           ├── prompts.py
│           ├── tools.py
│           ├── types.py
│           ├── web_tour_html.py
│           └── web_tour_html_bb.py
```

One implementation is using BrowserBase, the other is without.

## File Descriptions

1. `web_tour_html.py`: The main application file containing:

   - Agent setup and configuration
   - Web interaction tools (click, type, scroll, etc.)
   - Graph initialization for the agent's decision-making process

2. `web_tour_html_bb.py`: A variation of the main application with BrowserBase.

3. `api.py`: Main entry point for the API, containing route definitions and request handling logic.

4. `extract.py`: Utility functions for web scraping and content analysis.

5. `mark_page.js`: Client-side JavaScript for marking or annotating web pages.

6. `mark.py`: Server-side logic for marking or processing web pages.

7. `prompts.py`: Predefined text prompts or templates used in the application.

8. `tools.py`: Utility functions and standalone tools supporting various operations.

9. `types.py`: Custom type definitions and data structure declarations.

10. `experiments/`: Directory containing experimental versions and variations of the web tour guide.

## Setup and Installation

1. Clone the repository:

```
git clone https://github.com/yourusername/web-tour-guide.git
cd web-tour-guide
```

2. Install dependencies:

Create a conda or python environement and install the required dependencies.

```
pip install -r requirements.txt
```

## Running the Application

To run the api:

```
uvicorn src.app.api.api:app --reload --port 8000
```

To run the frontend:

```
npm run dev
```

## API Usage

The application exposes endpoints for web navigation. Detailed API documentation will be provided in the future.

## Deployment

Deployment instructions will be added in future updates.

## TODO

- [ ] Improve metadata reading for components and elements
- [ ] Enhance answer relevance
- [ ] Implement efficient website exploration/crawling
- [ ] Optimize loading times for better agent exploration
- [ ] Improve navigation between routes
- [ ] Enhance context awareness of user's current location

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
