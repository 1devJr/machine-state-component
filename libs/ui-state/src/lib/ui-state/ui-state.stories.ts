import type { Meta, StoryObj } from '@storybook/angular';
import { UiStatePanel } from './ui-state';

const meta: Meta<UiStatePanel> = {
  component: UiStatePanel,
  title: 'State/UiStatePanel',
};
export default meta;

type Story = StoryObj<UiStatePanel>;

export const Primary: Story = {
  args: {},
};
