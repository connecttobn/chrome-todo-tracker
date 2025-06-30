document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const newTodoInput = document.getElementById('new-todo');
  const addButton = document.getElementById('add-button');
  const activeTasksList = document.getElementById('active-tasks-list');
  const completedTasksList = document.getElementById('completed-tasks-list');
  const completedTasksSection = document.getElementById('completed-tasks-section');
  const toggleCompletedBtn = document.getElementById('toggle-completed');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const clearCompletedBtn = document.getElementById('clear-completed');
  
  // Set initial toggle button text to match hidden state
  toggleCompletedBtn.textContent = 'Show';
  
  // Load todos from storage
  loadTodos();
  
  // Event listeners
  addButton.addEventListener('click', addTodo);
  newTodoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  });
  clearCompletedBtn.addEventListener('click', clearCompleted);
  toggleCompletedBtn.addEventListener('click', toggleCompletedSection);
  
  // Search functionality
  searchInput.addEventListener('input', performSearch);
  clearSearchBtn.addEventListener('click', clearSearch);
  
  // Perform search on tasks
  function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (searchTerm === '') {
      // If search is empty, show all tasks
      loadTodos();
      return;
    }
    
    // Get all tasks and filter based on search term
    chrome.storage.local.get(['todos'], (result) => {
      const todos = result.todos || [];
      
      // Filter active and completed tasks that match the search term
      const matchingActiveTodos = todos.filter(todo => 
        !todo.completed && todo.text.toLowerCase().includes(searchTerm));
      
      const matchingCompletedTodos = todos.filter(todo => 
        todo.completed && todo.text.toLowerCase().includes(searchTerm));
      
      // Clear both lists
      activeTasksList.innerHTML = '';
      completedTasksList.innerHTML = '';
      
      // Render matching tasks
      matchingActiveTodos.forEach(todo => renderTodo(todo));
      matchingCompletedTodos.forEach(todo => renderTodo(todo));
      
      // Update the count badges
      document.getElementById('active-count').textContent = matchingActiveTodos.length;
      document.getElementById('completed-count').textContent = matchingCompletedTodos.length;
      
      // Show/hide completed section based on if there are matching completed tasks
      if (matchingCompletedTodos.length === 0) {
        completedTasksSection.style.display = 'none';
      } else {
        completedTasksSection.style.display = 'block';
        const isHidden = completedTasksSection.classList.contains('hidden');
        completedTasksList.style.display = isHidden ? 'none' : 'block';
      }
    });
  }
  
  // Clear search
  function clearSearch() {
    searchInput.value = '';
    loadTodos();
    searchInput.focus();
  }
  
  // Toggle completed tasks section visibility
  function toggleCompletedSection() {
    const isCurrentlyHidden = completedTasksSection.classList.contains('hidden');
    
    if (isCurrentlyHidden) {
      // Show the section
      completedTasksSection.classList.remove('hidden');
      toggleCompletedBtn.textContent = 'Hide';
      // Ensure the list is visible with scrolling
      completedTasksList.style.display = 'block';
    } else {
      // Hide the section
      completedTasksSection.classList.add('hidden');
      toggleCompletedBtn.textContent = 'Show';
      // Hide the list
      completedTasksList.style.display = 'none';
    }
  }
  
  // Add a new todo
  function addTodo() {
    const todoText = newTodoInput.value.trim();
    if (todoText === '') return;
    
    // Set today as the default due date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todo = {
      id: Date.now(),
      text: todoText,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: today.toISOString()
    };
    
    chrome.storage.local.get(['todos'], (result) => {
      const todos = result.todos || [];
      // Add new task to the beginning of the array instead of the end
      todos.unshift(todo);
      
      chrome.storage.local.set({ todos }, () => {
        // Reload all todos to ensure proper sorting with the new task
        loadTodos();
        newTodoInput.value = '';
        newTodoInput.focus();
      });
    });
  }
  
  // Render a single todo item
  function renderTodo(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;
    
    // Determine which list to add the task to
    const targetList = todo.completed ? completedTasksList : activeTasksList;
    
    // Checkbox for completion status
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    
    // Task text (editable)
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;
    span.setAttribute('contenteditable', 'true');
    span.addEventListener('blur', () => updateTodoText(todo.id, span.textContent));
    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        span.blur();
      }
    });
    
    // Due date display (clickable)
    const dueDateDisplay = document.createElement('div');
    dueDateDisplay.className = 'due-date-display';
    if (todo.dueDate) {
      dueDateDisplay.textContent = formatDueDate(todo.dueDate);
      dueDateDisplay.classList.add(getDueDateClass(todo.dueDate));
    } else {
      dueDateDisplay.textContent = 'Set date';
      dueDateDisplay.classList.add('no-date');
    }
    
    // Make due date display clickable
    dueDateDisplay.classList.add('clickable');
    dueDateDisplay.title = 'Click to change due date';
    
    // Due date selector
    const dueDateSelector = document.createElement('div');
    dueDateSelector.className = 'due-date-selector';
    
    const todayBtn = document.createElement('button');
    todayBtn.className = 'due-date-option';
    todayBtn.textContent = 'Today';
    todayBtn.addEventListener('click', () => setDueDate(todo.id, getDateString(0)));
    
    const tomorrowBtn = document.createElement('button');
    tomorrowBtn.className = 'due-date-option';
    tomorrowBtn.textContent = 'Tomorrow';
    tomorrowBtn.addEventListener('click', () => setDueDate(todo.id, getDateString(1)));
    
    const thisWeekBtn = document.createElement('button');
    thisWeekBtn.className = 'due-date-option';
    thisWeekBtn.textContent = 'This Week';
    thisWeekBtn.addEventListener('click', () => setDueDate(todo.id, getDateString(7)));
    
    const clearDueBtn = document.createElement('button');
    clearDueBtn.className = 'due-date-option clear-due';
    clearDueBtn.textContent = 'Clear';
    clearDueBtn.addEventListener('click', () => setDueDate(todo.id, null));
    
    dueDateSelector.appendChild(todayBtn);
    dueDateSelector.appendChild(tomorrowBtn);
    dueDateSelector.appendChild(thisWeekBtn);
    dueDateSelector.appendChild(clearDueBtn);
    
    // Make the due date display clickable to show the selector
    dueDateDisplay.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Position the selector near the due date display that was clicked
      const rect = e.target.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const selectorHeight = 180; // Approximate height of the selector
      
      // Check if there's enough space below the element
      if (rect.bottom + selectorHeight > viewportHeight) {
        // Not enough space below, position it above the element
        dueDateSelector.style.top = `${rect.top - selectorHeight - 5}px`;
      } else {
        // Enough space below, position it below the element
        dueDateSelector.style.top = `${rect.bottom + 5}px`;
      }
      
      // Horizontal positioning with bounds checking
      const leftPosition = Math.max(5, rect.left - 60); // Ensure it's not off-screen to the left
      dueDateSelector.style.left = `${leftPosition}px`;
      
      // Toggle visibility
      dueDateSelector.classList.toggle('show');
    });
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-todo';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
    
    // Add all elements to the list item
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(dueDateDisplay);
    li.appendChild(dueDateSelector);
    li.appendChild(deleteBtn);
    
    // Close all date selectors when clicking outside
    document.addEventListener('click', (e) => {
      // If we clicked outside the date selector and outside the date display
      if (!dueDateSelector.contains(e.target) && e.target !== dueDateDisplay) {
        dueDateSelector.classList.remove('show');
      }
    });
    
    targetList.appendChild(li);
  }
  
  // Format due date for display
  function formatDueDate(dateString) {
    if (!dateString) return '';
    
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dueDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
  
  // Get class for styling due date based on urgency
  function getDueDateClass(dateString) {
    if (!dateString) return '';
    
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      return 'overdue';
    } else if (dueDate.getTime() === today.getTime()) {
      return 'due-today';
    } else {
      return 'upcoming';
    }
  }
  
  // Get date string for a number of days from now
  function getDateString(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }
  
  // Set due date for a todo
  function setDueDate(id, dueDate) {
    chrome.storage.local.get(['todos'], (result) => {
      const todos = result.todos || [];
      const todoIndex = todos.findIndex(todo => todo.id === id);
      
      if (todoIndex !== -1) {
        todos[todoIndex].dueDate = dueDate;
        
        chrome.storage.local.set({ todos }, () => {
          // Reload all todos to apply sorting
          loadTodos();
        });
      }
    });
  }
  
  // Update todo text after inline editing
  function updateTodoText(id, newText) {
    chrome.storage.local.get(['todos'], (result) => {
      const todos = result.todos || [];
      const todoIndex = todos.findIndex(todo => todo.id === id);
      
      if (todoIndex !== -1 && newText.trim() !== '') {
        todos[todoIndex].text = newText.trim();
        
        chrome.storage.local.set({ todos }, () => {
          // Reload all todos to maintain consistent sorting
          loadTodos();
        });
      } else if (newText.trim() === '') {
        // If empty, revert to original text
        const todoElement = document.querySelector(`.todo-item[data-id="${id}"] .todo-text`);
        if (todoElement) {
          todoElement.textContent = todos[todoIndex].text;
        }
      }
    });
  }
  
  // Load todos from storage
  function loadTodos() {
    chrome.storage.local.get(['todos'], (result) => {
      const todos = result.todos || [];
      
      // Separate active and completed tasks
      const activeTodos = todos.filter(todo => !todo.completed);
      const completedTodos = todos.filter(todo => todo.completed);
      
      // Sort active todos by due date priority
      activeTodos.sort((a, b) => {
        // First priority: overdue items (oldest first)
        // Second priority: due today items
        // Third priority: upcoming due dates (earliest first)
        // Fourth priority: items with no due date (newest first by creation date)
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const nowTime = now.getTime();
        
        const aDueDate = a.dueDate ? new Date(a.dueDate) : null;
        const bDueDate = b.dueDate ? new Date(b.dueDate) : null;
        
        // If both have due dates
        if (aDueDate && bDueDate) {
          const aTime = aDueDate.getTime();
          const bTime = bDueDate.getTime();
          
          // If both are overdue
          if (aTime < nowTime && bTime < nowTime) {
            // Oldest overdue first
            return aTime - bTime;
          }
          
          // If only a is overdue
          if (aTime < nowTime) return -1;
          
          // If only b is overdue
          if (bTime < nowTime) return 1;
          
          // If both are due today
          if (aTime === nowTime && bTime === nowTime) {
            // Sort by creation date (newest first) if both due today
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          
          // If only a is due today
          if (aTime === nowTime) return -1;
          
          // If only b is due today
          if (bTime === nowTime) return 1;
          
          // Both are future dates, sort by earliest due date
          return aTime - bTime;
        }
        
        // If only a has due date
        if (aDueDate) return -1;
        
        // If only b has due date
        if (bDueDate) return 1;
        
        // If neither has due date, sort by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      // Sort completed todos by completion date (newest first)
      completedTodos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Clear both lists
      activeTasksList.innerHTML = '';
      completedTasksList.innerHTML = '';
      
      const activeTasksToShow = activeTodos; 
      const completedTasksToShow = completedTodos;
      
      // Render tasks in their respective lists
      activeTasksToShow.forEach(todo => renderTodo(todo));
      completedTasksToShow.forEach(todo => renderTodo(todo));
      
      // Update the count badges
      document.getElementById('active-count').textContent = activeTodos.length;
      document.getElementById('completed-count').textContent = completedTodos.length;
      
      // Show/hide completed section based on if there are completed tasks
      if (completedTodos.length === 0) {
        completedTasksSection.style.display = 'none';
      } else {
        completedTasksSection.style.display = 'block';
        
        // Set display of the task list based on hidden state
        const isHidden = completedTasksSection.classList.contains('hidden');
        completedTasksList.style.display = isHidden ? 'none' : 'block';
      }
    });
  }
  
  // Toggle todo completion status
  function toggleTodo(id) {
    chrome.storage.local.get(['todos'], (result) => {
      const todos = result.todos || [];
      const todoIndex = todos.findIndex(todo => todo.id === id);
      
      if (todoIndex !== -1) {
        todos[todoIndex].completed = !todos[todoIndex].completed;
        
        chrome.storage.local.set({ todos }, () => {
          // Reload all todos to apply sorting
          loadTodos();
        });
      }
    });
  }
  
  // Delete a todo
  function deleteTodo(id) {
    chrome.storage.local.get(['todos'], (result) => {
      const todos = result.todos || [];
      const updatedTodos = todos.filter(todo => todo.id !== id);
      
      chrome.storage.local.set({ todos: updatedTodos }, () => {
        const todoElement = document.querySelector(`.todo-item[data-id="${id}"]`);
        todoElement.remove();
        
        // Update the count badges
        chrome.storage.local.get(['todos'], (result) => {
          const todos = result.todos || [];
          const activeTodos = todos.filter(todo => !todo.completed);
          const completedTodos = todos.filter(todo => todo.completed);
          document.getElementById('active-count').textContent = activeTodos.length;
          document.getElementById('completed-count').textContent = completedTodos.length;
        });
      });
    });
  }
  
  // Clear completed todos
  function clearCompleted() {
    chrome.storage.local.get(['todos'], (result) => {
      const todos = result.todos || [];
      const activeTodos = todos.filter(todo => !todo.completed);
      
      chrome.storage.local.set({ todos: activeTodos }, () => {
        loadTodos();
      });
    });
  }
});
