import { NotFound } from 'http-errors';
import {
  CreateTaskBody,
  GetTasksQuery,
  Task,
  UpdateTaskBody,
} from './tasks.dto';

export class TasksService {
  private readonly tasks: Task[] = [];

  constructor() {}

  createTask(body: CreateTaskBody): Task {
    const task: Task = {
      ...body,
      completed: false,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    return task;
  }

  getTasks(body: GetTasksQuery): Task[] {
    const tasks = this.tasks.filter((task) => {
      if (body.id) {
        return task.id === body.id;
      }
      if (body.createdAtFrom) {
        return new Date(task.createdAt) >= new Date(body.createdAtFrom);
      }
      if (body.createdAtTo) {
        return new Date(task.createdAt) <= new Date(body.createdAtTo);
      }
      if (body.updatedAtFrom) {
        return new Date(task.updatedAt) >= new Date(body.updatedAtFrom);
      }
      if (body.updatedAtTo) {
        return new Date(task.updatedAt) <= new Date(body.updatedAtTo);
      }
      if (body.title) {
        return task.title.startsWith(body.title);
      }
      if (body.description) {
        return task.description.startsWith(body.description);
      }
      if (body.completed) {
        return task.completed === body.completed;
      }
      return true;
    });

    return tasks;
  }

  updateTask(id: string, body: UpdateTaskBody): Task {
    const task = this.tasks.find((task) => task.id === id);

    if (!task) {
      throw new NotFound('Task not found');
    }
    if (body.title) {
      task.title = body.title;
    }
    if (body.description) {
      task.description = body.description;
    }
    if (body.completed) {
      task.completed = body.completed;
    }

    task.updatedAt = new Date().toISOString();
    return task;
  }

  deleteTask(id: string): Task {
    const task = this.tasks.find((task) => task.id === id);

    if (!task) {
      throw new NotFound('Task not found');
    }
    this.tasks.splice(this.tasks.indexOf(task), 1);
    return task;
  }
}
