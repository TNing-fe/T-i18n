import * as vscode from 'vscode';
import { ViewLoader } from './view/ViewLoader';
import { CommonMessage } from './view/messages/messageTypes';
import { LocalStorageService } from './storage/dataStorage';
import quickTranslate from './commands/quick-translate';

export function activate(context: vscode.ExtensionContext) {
  const storageManager = new LocalStorageService(context.workspaceState);

  // vscode.window.registerWebviewPanelSerializer('catCoding',new CatCodingSerializer());
  const translation = vscode.commands.registerCommand('termix-i18n.translation', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor && editor.document.getText(editor.selection) === '') {
      vscode.window.showInformationMessage(`未选中有效字符`);
      return;
    } else {
      const selection = editor.selection;
      const focusText = editor.document.getText(selection);
      ViewLoader.showWebview(context);
      const todoList = (storageManager.getValue('todoList') || []) as [{}];
      ViewLoader.postMessageToWebview({
        type: 'INIT',
        payload: { focusText, todoList: todoList.map(item => ({ ...item, targetValue: '' })) },
      });
    }
  });
  const sendMessage = vscode.commands.registerCommand('extension.sendMessage', () => {
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
  });
  const quickTranslation = vscode.commands.registerCommand(
    'termix-i18n.quickTranslate',
    quickTranslate
  );
  context.subscriptions.push(translation, sendMessage, quickTranslation);
}

export function deactivate() {}
