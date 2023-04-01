const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const taskService = {
  database: {},

  findEditingTask() {
    return this.database.tasks.find(task => task.editing);
  },

  findAll() {
    return this.database.tasks;
  },

  findById(id) {
    return this.database.tasks.find(task => task.id === id);
  },

  create(status) {
    const task = {
      id: ++this.database.currentId,
      title: '',
      description: '',
      status,
      editing: true,
    };

    this.database.tasks.push(task);
    this.save();
    $(`[data-dropzone="${status}"]`).appendChild(this.render(task));
  },

  update(id, task) {
    const taskIndex = this.database.tasks.findIndex(task => task.id === id);
    const taskOldStatus = this.database.tasks[taskIndex].status;

    this.database.tasks[taskIndex] = {...task, id};
    this.save();
    
    const taskCard = $(`#task-${id}`);

    if ((taskOldStatus === task.status) || task.editing) {
      $(`#task-${id}`).replaceWith(this.render(task));
    } else {
      $(`[data-dropzone="${taskOldStatus}"]`).removeChild(taskCard);
      $(`[data-dropzone="${task.status}"]`).appendChild(taskCard);
    }
  },

  delete(id) {
    const taskIndex = this.database.tasks.findIndex(task => task.id === id);
    this.database.tasks.splice(taskIndex, 1);
    this.save();
    $(`#task-${id}`).remove();
  },

  save() {
    localStorage.setItem('tasks', JSON.stringify(this.database));
  },

  load() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = JSON.parse(localStorage.getItem('tasks'));
        const initialData = {
          currentId: 3,

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

        resolve(data || initialData);
      }, 1000);
    });
  },

  cancelTaskEditing() {
    const task = this.findEditingTask();

    if (!task) return;

    if (task.title === '' && task.description === '') {
      this.delete(task.id);
      return;
    }

    this.update(task.id, {
      ...task,
      editing: false
    });
  },

  render(task) {
    const taskCard = () => {
      const card = document.createElement('div');
      card.classList.add('card', 'mt-3', 'bg-white', 'shadow', 'border-0', 'rounded');
      card.id = `task-${task.id}`;
      card.setAttribute('draggable', true);

      card.innerHTML = `
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

      card.addEventListener('dragstart', e => e.dataTransfer.setData('data-draggable-id', e.target.id));

      card.querySelector('[task-edit]').addEventListener('click', () => {
        taskService.cancelTaskEditing();
        taskService.update(task.id, { ...task, editing: true });
      });

      card.querySelector('[task-delete]').addEventListener('click', () => taskService.delete(task.id));

      return card;
    }

    const taskEdit = () => {
      const card = document.createElement('div');
      card.classList.add('card', 'mt-3', 'bg-white', 'shadow', 'border-0', 'rounded');
      card.id = `task-${task.id}`;
      card.setAttribute('data-task-edit', true);

      card.innerHTML = `
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
        taskService.update(task.id, updatedTask);
      });

      card.querySelector('#title-input').addEventListener('input', () => {
        card.querySelector('#title-input-danger').classList.add('d-none');
      });

      card.querySelector('#description-input').addEventListener('input', () => {
        card.querySelector('#description-input-danger').classList.add('d-none');
      });

      return card;
    }

    return task.editing ? taskEdit() : taskCard();
  },

  renderAll() {
    const tasks = this.findAll();

    $$('[data-dropzone]').forEach(taskContainer => taskContainer.innerHTML = tasks ? '' : this.renderLoading());

    tasks?.forEach(task => $(`[data-dropzone="${task.status}"]`).appendChild(this.render(task)));
  },

  renderLoading() {
    return `
      <div class="d-flex justify-content-center py-5">
        <img height="50" src = "./assets/load.svg" alt="Load"/>
      </div>
    `;
  }
}

const sectionService = {
  database: {},

  findAll() {
    return this.database.sections;
  },

  save() {
    localStorage.setItem('sections', JSON.stringify(this.database));
  },

  load() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = JSON.parse(localStorage.getItem('sections'));
        const initialData = {
          currentId: 3,

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

        resolve(data || initialData);
      }, 1000);
    });
  },

  render(section) {
    const sectionElement = document.createElement('div');
    sectionElement.classList.add('section-container', 'border', 'p-4', 'mx-2', 'pt-3', 'bg-light', 'mt-3', 'rounded');
    sectionElement.id = `section-${section.id}`;

    sectionElement.innerHTML = `
        <header class="border-bottom d-flex justify-content-between align-items-baseline">
          <h2 class="fs-5 mb-0">${section.title}</h2>
          <i create-task-button="${section.id}" class="bi bi-plus-circle-fill text-success fs-4"></i>
        </header>
  
        <section id="dropzone-${section.id}" dropzone="move" data-dropzone="${section.status}" class="h-100"></section>
      `;

    sectionElement.querySelector('[create-task-button]').addEventListener('click', () => {
      if (!taskService.database.currentId)  return;

      taskService.cancelTaskEditing();
      taskService.create(section.status);
    });

    const dropzone = sectionElement.querySelector('[data-dropzone]');

    dropzone.addEventListener('dragover', e => e.preventDefault());

    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      taskService.cancelTaskEditing();

      const dataId = e.dataTransfer.getData('data-draggable-id');
      const taskId = Number.parseInt(dataId.split('-')[1]);

      const task = taskService.findById(taskId);

      taskService.update(taskId, { ...task, status: section.status });
    });

    return sectionElement;
  },

  renderAll() {
    const sections = this.findAll();
    const sectionContainer = $('[data-section-container]');

    sectionContainer.innerHTML = sections ? '' : this.renderLoading();

    sections?.forEach(section => sectionContainer.appendChild(this.render(section)));
  },

  renderLoading() {
    return `
      <div class="d-flex justify-content-center py-5">
        <img height="200" src = "./assets/load.svg" alt="Load"/>
      </div>
    `;
  }
}

  ; (renderItens = () => {
    sectionService.renderAll();

    sectionService.load().then(sectionData => {
      sectionService.database = sectionData;
      sectionService.renderAll();
      taskService.renderAll();
    }).then(() => {
      taskService.load().then(data => {
        taskService.database = data;
        taskService.renderAll();
        taskService.cancelTaskEditing();
      });
    });
  })();
