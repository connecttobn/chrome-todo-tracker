# Simple Todo Tracker Chrome Extension

A lightweight Chrome extension for tracking your tasks and todos locally in your browser.

## Features

- Add, complete, and delete todos
- Clear completed tasks with one click
- Persistent storage using Chrome's local storage API
- Clean, modern UI

## Installation Instructions

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked" and select the `chrome-todo-tracker` folder
4. The Todo Tracker extension should now appear in your extensions list
5. Click the extension icon in your toolbar to open the todo list

## Usage

- Type a task in the input field and press Enter or click "Add" to create a new todo
- Click the checkbox next to a todo to mark it as completed
- Click the "×" button to delete a todo
- Click "Clear Completed" to remove all completed todos at once

## Development

This extension uses vanilla JavaScript, HTML, and CSS. All todos are stored in Chrome's local storage.

## File Structure

```
chrome-todo-tracker/
├── manifest.json      # Extension configuration
├── popup.html         # Main UI
├── popup.js           # Todo functionality
├── popup.css          # Styles
└── images/            # Extension icons
    ├── icon16.svg
    ├── icon48.svg
    └── icon128.svg
```
