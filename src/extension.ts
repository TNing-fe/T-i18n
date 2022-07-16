import * as vscode from 'vscode';
import quickTranslate from './commands/quick-translate';
import { LocalStorageService } from './storage/dataStorage';
import translations from './commands/translations';
import sendMessages from './commands/sendMessage';

export function activate(context: vscode.ExtensionContext) {
  
  const storageManager = new LocalStorageService(context.workspaceState);
  // vscode.window.registerWebviewPanelSerializer('catCoding',new CatCodingSerializer());
  const translation = vscode.commands.registerCommand(
    'termix-i18n.translation', 
    translations(storageManager,context)
  );
  const quickTranslation = vscode.commands.registerCommand(
    'termix-i18n.quickTranslate',
    quickTranslate
  );
  const sendMessage = vscode.commands.registerCommand('extension.sendMessage', sendMessages);
  context.subscriptions.push(translation, sendMessage, quickTranslation);
}

export function deactivate() {}
