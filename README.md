# Navi

This project is an AI-powered web navigation assistant that guides users through websites based on their queries or requests. It uses gpt-4o-mini to save on costs. Could/should be improved greatly.

Type Cmd +K with "Go to Analyze Page" or "Where is the Apply Now Button" to try for yourself!

## Project Structure

### Backend

```
├── README.md
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── utils/
│   │   │   │   ├── extract.py
│   │   │   │   ├── mark.py
│   │   │   │   └── tools.py
│   │   │   ├── api.py
│   │   │   ├── prompts.py
│   │   │   ├── types.py
│   │   │   ├── web_tour_html.py
│   │   │   └── web_tour_html_bb.py
│   │   └── mark_page.js
└── ...
```

One implementation is using BrowserBase, the other is without.

## Python Scripts

1. `web_tour_html.py`: The main application file containing:

   - Agent setup and configuration
   - Web interaction tools (click, type, scroll, etc.)
   - Graph initialization for the agent's decision-making process

2. `web_tour_html_bb.py`: A variation of the main application with BrowserBase.

3. `api.py`: Main entry point for the API and request handling logic.

4. `prompts.py`: Predefined text prompts or templates used in the application.

5. `tools.py`: Utility functions and standalone tools supporting various operations.

6. `types.py`: Custom type definitions and data structure declarations.

7. `mark_page.js`: Client-side JavaScript for marking or annotating web pages.

8. `extract.py`: Utility functions for web scraping and content analysis.

9. `mark_page.js`: Client-side JavaScript for marking or annotating web pages.

### Frontend

1. `page.tsx`: The main page, likely serving as the entry point for the application.

2. `NaviWrapper.tsx`: A wrapper component that encapsulates navigation-related functionality.

3. `NaviAssistant.tsx`: This component implements the navigation assistant interface. It includes:

   - A cursor component for visual feedback
   - State management for agent activity and cursor position
   - Integration with a popup component for displaying actions
   - Handling of agent cursor movement and actions

4. `PopupHome.tsx`: A popup component specifically designed for the homepage display.

5. `PopupNavi.tsx`: The main popup component used during navigation assistance. It includes:

   - Dynamic content based on current action and waiting state
   - Progress bar with color-coded phases
   - Animated eye for visual feedback
   - Display of instructions and agent thoughts

6. `SpotLightSearch.tsx`: Implements a command palette-style search interface. Key features include:

   - Keyboard shortcut activation (Cmd/Ctrl + K)
   - Integration with an agent for processing commands
   - Integration with the PopupNavi component for displaying actions

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

The frontend vercel link is [here](https://tour-guide-jw46.vercel.app/), you still have to run backend though.

## TODO

- [ ] Improve metadata reading for components and elements
- [ ] Enhance answer relevance
- [ ] Better ending messages
- [ ] Implement efficient website exploration/crawling
- [ ] Optimize loading times for better agent exploration
- [ ] Improve navigation between routes
- [ ] Implement company knowledge base
- [ ] Speed up loading times
- [ ] Experiment!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
