import { describe, expect, it } from 'vitest';
import { UiStatePanel, type Task } from './ui-state';

describe('UiStatePanel machine', () => {
  it('moves from idle to ready after load', async () => {
    const panel = new UiStatePanel();
    expect(panel.taskList.length).toBe(0);
    await panel.load();
    expect(panel.taskList.length).toBeGreaterThan(0);
  });

  it('can confirm and approve a task', async () => {
    const panel = new UiStatePanel();
    await panel.load();
    const task: Task = panel.taskList[0];
    panel.confirm(task);
    expect(panel.pending?.id).toEqual(task.id);
    await panel.approve(task);
    expect(panel.taskList.find((t) => t.id === task.id)).toBeUndefined();
  });
});
