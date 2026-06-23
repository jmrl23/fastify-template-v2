import { create } from 'node:domain';
import z from 'zod';

export const task = z.object({
  id: z.uuidv4(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  title: z.string(),
  description: z.string(),
  completed: z.boolean(),
});
export type Task = z.infer<typeof task>;
export const taskSchema = task.toJSONSchema({
  target: 'draft-07',
});

export const createTaskBody = task.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completed: true,
});
export type CreateTaskBody = z.infer<typeof createTaskBody>;
export const createTaskBodySchema = createTaskBody.toJSONSchema({
  target: 'draft-07',
});

export const getTasksQuery = task
  .pick({
    id: true,
    title: true,
    description: true,
    completed: true,
  })
  .extend({
    createdAtFrom: z.iso.datetime().optional(),
    createdAtTo: z.iso.datetime().optional(),
    updatedAtFrom: z.iso.datetime().optional(),
    updatedAtTo: z.iso.datetime().optional(),
  })
  .partial();
export type GetTasksQuery = z.infer<typeof getTasksQuery>;
export const getTasksQuerySchema = getTasksQuery.toJSONSchema({
  target: 'draft-07',
});

export const updateTaskParams = z.object({
  taskId: z.uuidv4(),
});
export type UpdateTaskParams = z.infer<typeof updateTaskParams>;
export const updateTaskParamsSchema = updateTaskParams.toJSONSchema({
  target: 'draft-07',
});

export const updateTaskBody = task
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();
export type UpdateTaskBody = z.infer<typeof updateTaskBody>;
export const updateTaskBodySchema = updateTaskBody.toJSONSchema({
  target: 'draft-07',
});

export const deleteTaskParams = z.object({
  taskId: z.uuidv4(),
});
export type DeleteTaskParams = z.infer<typeof deleteTaskParams>;
export const deleteTaskParamsSchema = deleteTaskParams.toJSONSchema({
  target: 'draft-07',
});
