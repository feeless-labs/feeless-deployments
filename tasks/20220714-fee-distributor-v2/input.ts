import { Task, TaskMode } from '@src';

export type FeeDistributorDeployment = {
  VotingEscrow: string;
  startTime: number;
};

const VotingEscrow = new Task('20220325-gauge-controller', TaskMode.READ_ONLY);

export default {
  VotingEscrow,
  iotatestnet: {
    startTime: 1727740800, // 6 giugno 2024
  }
};
