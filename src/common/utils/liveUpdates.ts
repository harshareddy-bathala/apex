import type { AssignmentRecord } from '@/api/client';

export type AssignmentBroadcast =
  | { type: 'assignment-created'; assignment: AssignmentRecord }
  | { type: 'assignment-deleted'; assignmentId: string };

const CHANNEL_NAME = 'student-mentor-assignment-feed';

const isBroadcastSupported = (): boolean =>
  typeof window !== 'undefined' && 'BroadcastChannel' in window;

export const emitAssignmentBroadcast = (payload: AssignmentBroadcast): void => {
  if (!isBroadcastSupported()) {
    return;
  }
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage(payload);
  channel.close();
};

export const subscribeToAssignmentBroadcast = (
  handler: (payload: AssignmentBroadcast) => void,
): (() => void) => {
  if (!isBroadcastSupported()) {
    return () => undefined;
  }
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<AssignmentBroadcast>) => {
    handler(event.data);
  };
  return () => channel.close();
};

