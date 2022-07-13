import * as vscode from 'vscode';
import * as path from 'path';
import { getAPIUserGender } from '../config';
import { Message, CommonMessage } from './messages/messageTypes';
import { tranlate } from '../service/translation';
import { LocalStorageService } from '../storage/dataStorage';
import { readFile } from 'fs';

export class ViewLoader {
  public static currentPanel?: vscode.WebviewPanel;
  private panel: vscode.WebviewPanel;
  private context: vscode.ExtensionContext;
  private disposables: vscode.Disposable[];
  storageManager: LocalStorageService;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.disposables = [];
    this.panel = vscode.window.createWebviewPanel(
      'Terminus',
      'Terminus-i18n',
      vscode.ViewColumn.Five,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'out', 'app'))],
      }
    );
    this.storageManager = new LocalStorageService(context.workspaceState);
    // render webview
    this.renderWebview();
    // listen messages from webview
    this.panel.webview.onDidReceiveMessage(
      (message: Message) => {
        if (message.type === 'RELOAD') {
          vscode.commands.executeCommand('workbench.action.webview.reloadWebviewAction');
        } else if (message.type === 'COMMON') {
          const text = (message as CommonMessage).payload;
          vscode.window.showInformationMessage(`Received message from Webview: ${text}`);
        } else if (message.type === 'TranlateOne') {
          const optionValue = message.payload.to;
          tranlate(message.payload.needTranslate, optionValue)
            .then(res => {
              this.panel.webview.postMessage({
                type: 'TRANSLATEONE',
                payload: {
                  targetValue: res.data.translation[0],
                  todoindex: message.payload.todoindex,
                },
              });
            })
            .catch(e => {
              console.log('error', e);
            });
          vscode.window.showInformationMessage(`翻译语言 ${optionValue}`);
        } else if (message.type === 'SaveTodoList') {
          const todoList = message.payload.todoList;
          for (const item of todoList) {
            console.log('item: ', item);
            if (item.targeValue === '') {
              vscode.window.showInformationMessage(`翻译结果不可为空`);
              return;
            }
            if (item.optionValue === '') {
              vscode.window.showInformationMessage(`翻译语言类型不可为空`);
              return;
            }
            if (item.fileType === '') {
              vscode.window.showInformationMessage(`文件类型不可为空`);
              return;
            }
            if (item.filePath === '') {
              vscode.window.showInformationMessage(`目标文件的绝对路径不可为空`);
              return;
            }
          }
          try {
            this.storageManager.setValue('todoList', todoList);
          } catch (error) {
            console.log('error: ', error);
          }
          vscode.window.showInformationMessage(`保存成功`);
        } else if (message.type === 'TRANSLATEALL') {
          if (message.payload.needTranslate === '') {
            vscode.window.showInformationMessage(`需要翻译的语句不能为空`);
            return;
          }
          const todoList = message.payload.todoList;
          const promiseList = todoList.map((item, index) =>
            tranlate(message.payload.needTranslate, item.optionValue)
          );
          Promise.all(promiseList)
            .then(resList => {
              return resList.map((_item: Record<string, any>, index) => {
                const [translation = ''] = _item?.data?.translation || [];
                todoList[index].targetValue = translation;
                return translation;
              });
            })
            .then(res => {
              this.panel.webview.postMessage({ type: 'TRANSLATEALL', payload: todoList });
            });
        } else if (message.type === 'INSERT') {
          const folderUri = vscode.workspace.workspaceFolders[0].uri;
          message.payload.todoList.forEach(item => {
            const fileUri = folderUri.with({
              path: path.posix.join(folderUri.path, item.filePath),
            });
            vscode.workspace.fs.readFile(fileUri).then(readBuffer => {
              // 读到的文件内容
              if (item.fileType === 'json') {
                const readContent = JSON.parse(Buffer.from(readBuffer).toString('utf8'));
                console.log('readContent: ', readContent);
                readContent[message.payload.text] = item.targetValue;
                vscode.workspace.fs
                  .writeFile(fileUri, Buffer.from(JSON.stringify(readContent, null, '\t'), 'utf8'))
                  .then(res => {
                    console.log('res+++++', res);
                    vscode.window.showInformationMessage(`插入成功`);
                  });
              }
              if (item.fileType === 'object') {
                const readContent = Buffer.from(readBuffer).toString('utf8');
                const tempContent = readContent.split('{');
                const preContent = tempContent[0];
                console.log('preContent: ', preContent);
                const objectContent = JSON.parse('{' + tempContent[1]);
                console.log('objectContent: ', objectContent);
              }
            });
          });
        }
      },
      null,
      this.disposables
    );

    this.panel.onDidDispose(
      () => {
        this.dispose();
      },
      null,
      this.disposables
    );
  }

  private renderWebview() {
    const html = this.render();
    this.panel.webview.html = html;
  }

  static showWebview(context: vscode.ExtensionContext) {
    const cls = this;
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    if (cls.currentPanel) {
      cls.currentPanel.reveal(column);
    } else {
      cls.currentPanel = new cls(context).panel;
    }
  }

  static postMessageToWebview<T extends Message = Message>(message: T) {
    // post message from extension to webview
    const cls = this;
    cls.currentPanel?.webview.postMessage(message);
  }

  public dispose() {
    ViewLoader.currentPanel = undefined;

    // Clean up our resources
    this.panel.dispose();

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  render() {
    const bundleScriptPath = this.panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, 'out', 'app', 'bundle.js'))
    );

    const gender = getAPIUserGender();

    return `
      <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Terminus-i18n</title>
        </head>
        
        <body>
          <div id="root"></div>
          <script>
            const vscode = acquireVsCodeApi();
            const apiUserGender = "${gender}"
          </script>
          <script>
            console.log('apiUserGender', apiUserGender)
          </script>
          <script src="${bundleScriptPath}"></script>
        </body>
      </html>
    `;
  }
}
