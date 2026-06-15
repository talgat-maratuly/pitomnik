export enum TaskStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.ASSIGNED]: 'Назначена',
  [TaskStatus.IN_PROGRESS]: 'В работе',
  [TaskStatus.COMPLETED]: 'Выполнена',
  [TaskStatus.VERIFIED]: 'Проверена',
  [TaskStatus.REJECTED]: 'Отклонена',
};
