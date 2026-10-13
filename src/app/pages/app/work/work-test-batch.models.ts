export type WorkTestQuestionType = 'boolean' | 'text' | 'number' | 'single-select';

export interface WorkTestQuestionOption {
  id: string;
  label: string;
}

export interface WorkTestQuestion {
  id: string;
  label: string;
  type: WorkTestQuestionType;
  required: boolean;
  helperText: string;
  options?: WorkTestQuestionOption[];
}

export interface WorkTestBatch {
  id: string;
  name: string;
  description: string;
  active: boolean;
  questions: WorkTestQuestion[];
  updatedAt: string;
}

export type WorkTestTriggerMode = 'always' | 'only-high-priority';

export interface WorkTestFlowRule {
  id: string;
  name: string;
  fromStatusId: string;
  toStatusId: string;
  batchIds: string[];
  requiredToContinue: boolean;
  triggerMode: WorkTestTriggerMode;
  active: boolean;
  updatedAt: string;
}

export interface WorkTestBatchState {
  batches: WorkTestBatch[];
  flowRules: WorkTestFlowRule[];
}

export interface WorkTestTransitionPrompt {
  fromStatusId: string;
  toStatusId: string;
  rules: WorkTestFlowRule[];
  batches: WorkTestBatch[];
}

export interface WorkTestBatchRun {
  id: string;
  fromStatusId: string;
  toStatusId: string;
  fromStatusLabel: string;
  toStatusLabel: string;
  executedAt: string;
  executedBy: string;
  ruleIds: string[];
  ruleNames: string[];
  batchIds: string[];
  batchNames: string[];
  answers: Record<string, string>;
}