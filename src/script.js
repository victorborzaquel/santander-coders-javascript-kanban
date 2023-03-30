const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const taskDatabase = {};
const sectionDatabase = {};

const initialSectionData = {
  currentId: 1,

  sections: [
    {
      id: 1,
      title: 'A fazer',
      status: 'todo',
    },
    {
      id: 2,
      title: 'Fazendo',
      status: 'doing',
    },
    {
      id: 3,
      title: 'Feito',
      status: 'done',
    },
  ],
}

const initialTaskData = {
  currentId: 1,

  tasks:[
    {
  id: 1,
  title: 'Primeira Tarefa',
  description: 'Descrição da primeira tarefa',
  status: 'todo',
  editing: false,
  }
]
}

const taskService = {
  database: taskDatabase,

  isEditing() {
    return this.database.tasks.some(task => task.editing);
  },

  getEditingTask() {
    return this.database.tasks.find(task => task.editing);
  },

  getTasks() {
    return this.database.tasks;
  },

  getTask(id) {
    return this.database.tasks.find(task => task.id === id);
  },

  createTaskEdit(status = 'todo') {
    const task = {
      id: ++this.database.currentId,
      title: '',
      description: '',
      status,
      editing: true,
    };

    this.database.tasks.push(task);
    this.save();
  },

  createTask(title, description) {
    const task = {
      id: ++this.database.currentId,
      title,
      description,
      status: 'todo',
      editing: false,
    };

    this.database.tasks.push(task);
    this.save();
  },

  updateTask(id, task) {
    const taskIndex = this.database.tasks.findIndex(task => task.id === id);
    this.database.tasks[taskIndex] = task;
    this.save();
  },

  editTask(id) {
    const task = this.getTask(id);
    taskService.updateTask(task.id, { ...task, editing: true });
  },

  deleteTask(id) {
    const taskIndex = this.database.tasks.findIndex(task => task.id === id);
    this.database.tasks.splice(taskIndex, 1);
    this.save();
  },

  save() {
    localStorage.setItem('tasks', JSON.stringify(this.database));
    this.render.tasks();
  },

  cancelTaskEditing() {
    const task = this.getEditingTask();
    
        if (task) {
          if (task.title === '' && task.description === '') {
            this.deleteTask(task.id);
            return;
          }
          
          this.updateTask(task.id, { 
            ...task,
              editing: false 
          });
        }
      },

  render: {
      task(task) {
        const card = document.createElement('div');
      card.classList.add('card', 'mt-3', 'bg-white', 'shadow', 'border-0', 'rounded');
      card.id = `task-${task.id}`;
      card.setAttribute('draggable', true);
     
      const string = `
        <div class="card-body">
          <header class="d-flex justify-content-between">
            <h5 class="card-title">${task.title}</h5>
              <div>
                <i task-edit class="bi bi-pen-fill text-primary me-2"></i>
                <i task-delete class="bi bi-trash3-fill text-danger"></i>
              </div>
            </header>
                    
            <p class="card-text">${task.description}</p>
        </div>
      `;
    
      card.innerHTML = string;

      card.addEventListener('dragstart', e => e.dataTransfer.setData('data-draggable-id', e.target.id));

      card.querySelector('[task-edit]').addEventListener('click', () => {
        taskService.cancelTaskEditing();
        taskService.editTask(task.id);
      });

      card.querySelector('[task-delete]').addEventListener('click', () =>  taskService.deleteTask(task.id));
    
      return card;
      },

      taskEdit(task) {
        const card = document.createElement('div');
        card.classList.add('card', 'mt-3', 'bg-white', 'shadow', 'border-0', 'rounded');
        card.setAttribute('data-task-edit', true);
      
        const string = `
                    <div class="card-body">
                      <form>
                        <div class="form-group pb-3">
                          <label for="title-input">Titulo*</label>
                          <input type="text" class="form-control" id="title-input" aria-describedby="title" value="${task.title}">
                          <small id="title-input-danger" class="form-text text-danger d-none">Obrigatório!</small>
                        </div>
                        
                        <div class="form-group pb-3">
                          <label for="description-input">Descrição*</label>
                          <textarea class="form-control " id="description-input" rows="3">${task.description}</textarea>
        
                          <small id="description-input-danger" class="form-text text-danger d-none">Obrigatório!</small>
                        </div>
                        
                        <div class="d-flex justify-content-end">
                          <i form-cancel="${task.id}" class="bi bi-x-circle-fill me-3 text-secondary fs-4"></i>
                          <i form-confirm="${task.id}" class="bi bi-check-circle-fill text-success fs-4"></i>
                        </div>
                      </form>
                    </div>
        `;
      
        card.innerHTML = string;

        card.querySelector('[form-cancel]').addEventListener('click', () => taskService.cancelTaskEditing());

        card.querySelector('[form-confirm]').addEventListener('click', () => {
          const title = card.querySelector('#title-input').value;
          const description = card.querySelector('#description-input').value;

          if (title === '' || description === '') {
            if (title === '') {
              card.querySelector('#title-input-danger').classList.remove('d-none');
            }

            if (description === '') {
              card.querySelector('#description-input-danger').classList.remove('d-none');
            }

            return;
          }

          const updatedTask = {
            ...task,
            title,
            description,
            editing: false,
          };
          taskService.updateTask(task.id, updatedTask);
        });

        card.querySelector('#title-input').addEventListener('input', () => {
          card.querySelector('#title-input-danger').classList.add('d-none');
        });

        card.querySelector('#description-input').addEventListener('input', () => {
          card.querySelector('#description-input-danger').classList.add('d-none');
        });

        

        return card;
      },

      tasks() {
        const tasks = taskService.getTasks();

        const taskContainers = $$('[data-dropzone]');
        
        if (!tasks) {
          taskContainers.forEach(taskContainer => taskContainer.innerHTML = `
          <div class="d-flex justify-content-center py-5">
            <img height="50" src = "./assets/load.svg" alt="Load"/>
          </div>
          `);
          return;
        }

        taskContainers.forEach(taskContainer => taskContainer.innerHTML = '');
    
        tasks.forEach(task => {
          const taskElement = task.editing ? this.taskEdit(task) : this.task(task);
          const taskContainer = document.querySelector(`[data-dropzone="${task.status}"]`);
          taskContainer.appendChild(taskElement);
        });
      }
  }
}

const sectionService = {
  database: sectionDatabase,

  getSections() {
    return this.database.sections;
  },

  render: {
    section(section) {
      const sectionElement = document.createElement('div');
      sectionElement.classList.add('border', 'p-4', 'mx-2', 'pt-3', 'bg-light', 'mt-3', 'rounded');
      sectionElement.id = `section-${section.id}`;
      sectionElement.setAttribute('data-section', true);

      const string = `
        <header class="border-bottom d-flex justify-content-between align-items-baseline">
          <h2 class="fs-5 mb-0">${section.title}</h2>
          <i create-task-button="${section.id}" class="bi bi-plus-circle-fill text-success fs-4"></i>
        </header>
  
        <section id="dropzone-${section.id}" dropzone="move" data-dropzone="${section.status}" class="h-100"></section>
      `;

      sectionElement.innerHTML = string;

      sectionElement.querySelector('[create-task-button]').addEventListener('click', () => {
        taskService.cancelTaskEditing();
      
        taskService.createTaskEdit(section.status);
      });

      const dropzone = sectionElement.querySelector('[data-dropzone]');
      
      dropzone.addEventListener('dragover', e => e.preventDefault());

      dropzone.addEventListener('drop', e => {
        e.preventDefault();
        taskService.cancelTaskEditing();
        
        const dataId = e.dataTransfer.getData('data-draggable-id');
        const taskId = Number.parseInt(dataId.split('-')[1]);
        
        const task = taskService.getTask(taskId);
        
        taskService.updateTask(taskId, { ...task, status: section.status });
      });

      return sectionElement;
    },

    sections() {
      const sections = sectionService.getSections();

      const sectionContainer = document.querySelector('[data-section-container]');

      if (!sections) {
        sectionContainer.innerHTML = `
        <div class="d-flex justify-content-center py-5">
          <img height="200" src = "./assets/load.svg" alt="Load"/>
        </div>
        `;
        return;
      }

      sectionContainer.innerHTML = '';

      sections.forEach(section => {
        const sectionElement = this.section(section);
        sectionContainer.appendChild(sectionElement);
      });
    }
  }
}

const getDatabase = (databaseName, initialData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const data = JSON.parse(localStorage.getItem(databaseName));

      resolve(data || initialData);
    }, 1000);
  });
}

getDatabase('sections', initialSectionData).then(data => {
  sectionDatabase.currentId = data.currentId;
  sectionDatabase.sections = data.sections;
  sectionService.render.sections();
  taskService.render.tasks();

  getDatabase('tasks', initialTaskData).then(data => {
    taskDatabase.currentId = data.currentId;
    taskDatabase.tasks = data.tasks;
    taskService.render.tasks();
  });
});

sectionService.render.sections();
taskService.render.tasks();
