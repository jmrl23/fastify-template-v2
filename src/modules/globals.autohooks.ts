import fastifyPlugin from 'fastify-plugin';
import { TasksService } from './tasks/tasks.service';

declare module 'fastify' {
  export interface FastifyInstance {
    tasksService: TasksService;
  }
}

export default fastifyPlugin(async function (app) {
  const taskService = new TasksService();
  app.decorate('tasksService', taskService);
});
