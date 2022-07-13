export type MessageType = 'RELOAD' | 'COMMON' | 'INIT' | string;

export interface Message {
  type: MessageType;
  payload?: any;
}

export interface CommonMessage extends Message {
  type: 'COMMON';
  payload: string;
}

export interface ReloadMessage extends Message {
  type: 'RELOAD';
}
export interface TranlateOneMessage extends Message {
  type: 'TranlateOne';
  payload: any;
}
export interface SaveTodoList extends Message {
  type: 'SaveTodoList';
  payload: any;
}