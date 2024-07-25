import { Task, TaskRunOptions } from '@src';
import { GaugeAdderMigrationCoordinatorDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as GaugeAdderMigrationCoordinatorDeployment;

  const args = [
    input.AuthorizerAdaptor,
    input.NewGaugeAdder,
    input.OldGaugeAdder,
    input.LiquidityGaugeFactory,
    input.PolygonRootGaugeFactory,
    input.ArbitrumRootGaugeFactory,
    input.OptimismRootGaugeFactory,
    input.GnosisRootGaugeFactory,
    input.PolygonZkEVMRootGaugeFactory,
    input.LiquidityMiningMultisig,
    input.GaugeCheckpointingMultisig,
  ];
  await task.deployAndVerify('GaugeAdderMigrationCoordinator', args, from, force);
};
