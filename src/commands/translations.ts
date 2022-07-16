import * as vscode from 'vscode';
import { ViewLoader } from '../view/ViewLoader';

export default (storageManager,context) => {
    return () => {
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
  };
};
