import { FastifyInstance, FastifyRequest } from 'fastify';
import z from 'zod';
import {
  CreateTaskBody,
  createTaskBodySchema,
  DeleteTaskParams,
  deleteTaskParamsSchema,
  GetTasksQuery,
  getTasksQuery,
  task,
  UpdateTaskBody,
  updateTaskBodySchema,
  UpdateTaskParams,
  updateTaskParamsSchema,
} from './tasks.dto';

// export const autoConfig = {
//   prefix: '/app',
// };
// export const autoPrefix = 'tasks';

export default async function (app: FastifyInstance) {
  app
    .route({
      method: 'POST',
      url: '/',
      schema: {
        description: 'Create a task',
        tags: ['Tasks'],
        body: createTaskBodySchema,
        response: {
          201: z.toJSONSchema(z.object({ data: task }), {
            target: 'draft-07',
          }),
        },
      },
      handler(
        request: FastifyRequest<{
          Body: CreateTaskBody;
        }>,
        reply,
      ) {
        const task = this.tasksService.createTask(request.body);
        reply.status(201);
        return { data: task };
      },
    })

    .route({
      method: 'GET',
      url: '/',
      schema: {
        description: 'Get tasks',
        tags: ['Tasks'],
        querystring: z.toJSONSchema(getTasksQuery, { target: 'draft-07' }),
        response: {
          200: z.toJSONSchema(z.object({ data: z.array(task) }), {
            target: 'draft-07',
          }),
        },
      },
      handler(
        request: FastifyRequest<{
          Querystring: GetTasksQuery;
        }>,
      ) {
        const tasks = this.tasksService.getTasks(request.query);
        return { data: tasks };
      },
    })

    .route({
      method: 'PATCH',
      url: '/:taskId',
      schema: {
        description: 'Update a task',
        tags: ['Tasks'],
        params: updateTaskParamsSchema,
        body: updateTaskBodySchema,
        response: {
          200: z.toJSONSchema(z.object({ data: task }), {
            target: 'draft-07',
          }),
        },
      },
      handler(
        request: FastifyRequest<{
          Params: UpdateTaskParams;
          Body: UpdateTaskBody;
        }>,
      ) {
        const task = this.tasksService.updateTask(
          request.params.taskId,
          request.body,
        );
        return { data: task };
      },
    })

    .route({
      method: 'DELETE',
      url: '/:taskId',
      schema: {
        description: 'Delete a task',
        tags: ['Tasks'],
        params: deleteTaskParamsSchema,
        response: {
          200: z.toJSONSchema(z.object({ data: task }), {
            target: 'draft-07',
          }),
        },
      },
      handler(request: FastifyRequest<{ Params: DeleteTaskParams }>) {
        const task = this.tasksService.deleteTask(request.params.taskId);
        return { data: task };
      },
    });
}
