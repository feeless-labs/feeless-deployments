import { Task, TaskMode } from '@src';

export type GaugeSystemDeployment = {
  BPT: string;
  BalancerTokenAdmin: string;
  AuthorizerAdaptor: string;
};

const AuthorizerAdaptor = new Task('20220325-authorizer-adaptor', TaskMode.READ_ONLY);
const BalancerTokenAdmin = new Task('20220325-balancer-token-admin', TaskMode.READ_ONLY);

export default {
  AuthorizerAdaptor,
  BalancerTokenAdmin,
  iotatestnet: {
    BPT: '0x0c3861100485C118f63e50D615E75daD491e19c2' // BPT of the canonical 80-20 BAL-WETH Pool
  }
};

