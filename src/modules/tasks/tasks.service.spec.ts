import { beforeEach, describe, expect, it } from '@jest/globals';
import { Task } from './tasks.dto';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(() => {
    service = new TasksService();
  });

  describe('createTask', () => {
    it('creates a task with generated id, defaults and timestamps', () => {
      const task = service.createTask({ title: 'a', description: 'b' });

      expect(task).toMatchObject({ title: 'a', description: 'b', completed: false });
      expect(task.id).toEqual(expect.any(String));
      expect(task.createdAt).toEqual(expect.any(String));
      expect(task.updatedAt).toEqual(expect.any(String));
    });
  });

  describe('getTasks', () => {
    let task: Task;

    beforeEach(() => {
      task = service.createTask({ title: 'hello', description: 'world' });
    });

    it('returns every task when no filter is given', () => {
      expect(service.getTasks({})).toHaveLength(1);
    });

    it('filters by id', () => {
      expect(service.getTasks({ id: task.id })).toHaveLength(1);
      expect(service.getTasks({ id: 'no-match' })).toHaveLength(0);
    });

    it('filters by createdAtFrom', () => {
      expect(
        service.getTasks({ createdAtFrom: '2000-01-01T00:00:00.000Z' }),
      ).toHaveLength(1);
    });

    it('filters by createdAtTo', () => {
      expect(
        service.getTasks({ createdAtTo: '2999-01-01T00:00:00.000Z' }),
      ).toHaveLength(1);
    });

    it('filters by updatedAtFrom', () => {
      expect(
        service.getTasks({ updatedAtFrom: '2000-01-01T00:00:00.000Z' }),
      ).toHaveLength(1);
    });

    it('filters by updatedAtTo', () => {
      expect(
        service.getTasks({ updatedAtTo: '2999-01-01T00:00:00.000Z' }),
      ).toHaveLength(1);
    });

    it('filters by title prefix', () => {
      expect(service.getTasks({ title: 'hel' })).toHaveLength(1);
    });

    it('filters by description prefix', () => {
      expect(service.getTasks({ description: 'wor' })).toHaveLength(1);
    });

    it('filters by completed', () => {
      expect(service.getTasks({ completed: true })).toHaveLength(0);
    });
  });

  describe('updateTask', () => {
    it('updates all provided fields', () => {
      const task = service.createTask({ title: 'a', description: 'b' });

      const updated = service.updateTask(task.id, {
        title: 'x',
        description: 'y',
        completed: true,
      });

      expect(updated).toMatchObject({
        title: 'x',
        description: 'y',
        completed: true,
      });
    });

    it('leaves fields untouched when body is empty', () => {
      const task = service.createTask({ title: 'a', description: 'b' });

      const updated = service.updateTask(task.id, {});

      expect(updated).toMatchObject({
        title: 'a',
        description: 'b',
        completed: false,
      });
    });

    it('throws NotFound when the task does not exist', () => {
      expect(() => service.updateTask('missing', {})).toThrow('Task not found');
    });
  });

  describe('deleteTask', () => {
    it('removes and returns the task', () => {
      const task = service.createTask({ title: 'a', description: 'b' });

      const deleted = service.deleteTask(task.id);

      expect(deleted.id).toBe(task.id);
      expect(service.getTasks({})).toHaveLength(0);
    });

    it('throws NotFound when the task does not exist', () => {
      expect(() => service.deleteTask('missing')).toThrow('Task not found');
    });
  });
});
