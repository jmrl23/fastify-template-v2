import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import fastify, { FastifyInstance } from 'fastify';
import globalsAutohooks from '../globals.autohooks';
import { Task } from './tasks.dto';
import tasksRoute from './tasks.route';

function buildApp(): FastifyInstance {
  const app = fastify();
  void app.register(globalsAutohooks);
  void app.register(tasksRoute, { prefix: '/tasks' });
  return app;
}

async function createTask(app: FastifyInstance): Promise<Task> {
  const res = await app.inject({
    method: 'POST',
    url: '/tasks',
    payload: { title: 'a', description: 'b' },
  });
  return res.json<{ data: Task }>().data;
}

describe('tasks routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /tasks creates a task', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'a', description: 'b' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json<{ data: Task }>().data).toMatchObject({
      title: 'a',
      description: 'b',
      completed: false,
    });
  });

  it('GET /tasks returns the tasks', async () => {
    await createTask(app);

    const res = await app.inject({ method: 'GET', url: '/tasks' });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: Task[] }>().data).toHaveLength(1);
  });

  it('PATCH /tasks/:taskId updates a task', async () => {
    const task = await createTask(app);

    const res = await app.inject({
      method: 'PATCH',
      url: `/tasks/${task.id}`,
      payload: { title: 'updated' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: Task }>().data.title).toBe('updated');
  });

  it('DELETE /tasks/:taskId deletes a task', async () => {
    const task = await createTask(app);

    const res = await app.inject({
      method: 'DELETE',
      url: `/tasks/${task.id}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ data: Task }>().data.id).toBe(task.id);
  });
});
