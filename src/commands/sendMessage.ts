import * as vscode from 'vscode';
import { CommonMessage } from '../view/messages/messageTypes';
import { ViewLoader } from '../view/ViewLoader';

export default () => {
    vscode.window
      .showInputBox({
        prompt: 'Send message to Webview',
      })
      .then(result => {
        result &&
          ViewLoader.postMessageToWebview<CommonMessage>({
            type: 'COMMON',
            payload: result,
          });
      });
  };