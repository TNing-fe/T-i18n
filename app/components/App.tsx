import React, { useEffect, useState, useCallback } from 'react';
import { MemoryRouter as Router, Link, Switch } from 'react-router-dom';
import { routes } from '../routes/config';
import { VSCodeTextField,VSCodeButton,VSCodeOption, VSCodeDropdown } from '@vscode/webview-ui-toolkit/react';
import { RouteWithSubRoutes } from '../routes/RouteWithSubRoutes';
import { MessagesContext } from '../context/MessageContext';
import { CommonMessage, Message, ReloadMessage, TranlateOneMessage, SaveTodoList } from '../../src/view/messages/messageTypes';

export const App = () => {
  const checkLan = [{name: '选择语言',type:''},{name: '英语',type:'en'},{name: '西班牙语',type:'es'},{name: '泰语',type:'th'},{name: '繁体中文',type:'zh-CHT'}];
  const [isOnSave, setIsOnSave] = useState(false);
  const [messagesFromExtension, setMessagesFromExtension] = useState<string[]>([]);
  const [needTranslate, setNeedTranslate] = useState('');
  const [log, setLog] = useState('zhangle');
  const [log2, setLog2] = useState('lelele');
  const [text, setText] = useState('Terminus');
  const [todoList, updateTodoList] = useState([{ targetValue:"", optionValue:"",fileType:"",filePath:""}]);
  const handleMessagesFromExtension = useCallback(
    (event: MessageEvent<Message>) => {
      if (event.data.type === 'COMMON') {
        const message = event.data as CommonMessage;
        setMessagesFromExtension([...messagesFromExtension, message.payload]);
      }
      if (event.data.type === 'INIT') {
        const message = event.data;
        setText(message.payload.focusText);
        // setLog2(JSON.stringify(message.payload.todoList));
        updateTodoList(message.payload.todoList);
      }
      if (event.data.type === 'TRANSLATEONE') {
        updateTodoList(todoList.map( (item,index) => {
          if (index === event.data.payload.todoindex) {
            item.targetValue = event.data.payload.targetValue;
          }
          return item;
        }));
      }
      if (event.data.type === 'TRANSLATEALL') {
        setLog2(JSON.stringify(event.data));
        updateTodoList(event.data.payload);
      }
    },
    [messagesFromExtension, todoList]
  );

  useEffect(() => {
    setLog(JSON.stringify(todoList));
  },[todoList]);

  useEffect(() => {
    window.addEventListener('message', (event: MessageEvent<Message>) => {
      handleMessagesFromExtension(event);
    });
    return () => {
      window.removeEventListener('message', handleMessagesFromExtension);
    };
  }, [handleMessagesFromExtension]);

  const translationResChange = (e :any,todoIndex:number) => {
      updateTodoList(todoList.map((item,index) => {
        if (index === todoIndex) {
          item.targetValue = e.target.value;
        }
        return item;
      }));
  };

  const handleReloadWebview = () => {
    vscode.postMessage<ReloadMessage>({
      type: 'RELOAD',
    });
  };

  const translateAll = () => {
    vscode.postMessage({type:'TRANSLATEALL',payload:{todoList,needTranslate}});
  };

  const addItemTolist = () => {
    updateTodoList([...todoList,{ targetValue:"", optionValue:"",fileType:"",filePath:""}]);
  };
  const changeProp = (todoindex:number,value:any,prop:any) => {
      updateTodoList(todoList.map((item,_index) =>  {
        if (_index === todoindex) {
          item[prop] = value;
        }
        return item;
      }));
  };
  const onInsert = () => {
    vscode.postMessage({type:"INSERT",payload:{todoList,text}});
  };
  const delOne = (index:number) => {
    updateTodoList(todoList.filter((_,_index) => _index !== index ));
  };
  const translateOne = (index:any,todoIndex:number) => {
    setLog2(needTranslate);
    vscode.postMessage<TranlateOneMessage>({ type:'TranlateOne', payload:{needTranslate,to:todoList[index].optionValue,todoindex:index}});
  };
  const onSave = () => {
    setLog(JSON.stringify(todoList));
    vscode.setState({todoList});
    vscode.postMessage<SaveTodoList>({ type: "SaveTodoList",payload:{ todoList }},);
  };

  
  return (
    <Router
      initialEntries={['/', '/about', '/message', '/message/received', '/message/send']}
    >
      <button onClick={handleReloadWebview}>Reload Webview</button>
      <br />
      <VSCodeTextField  value={text} onInput={e => setText(e.target.value)} style={{width:'400px'}} >添加的键名</VSCodeTextField> 
      <br />
      <VSCodeTextField  value={needTranslate} onInput={e => setNeedTranslate(e.target.value)}  placeholder='需要翻译的语句'/>
      <VSCodeButton disabled={isOnSave} style={{position:'relative',bottom:"12px"}} onClick={addItemTolist}>+</VSCodeButton>
      <br />   
        {
          todoList.map((item,todoindex) => (
          <div>
            <VSCodeTextField  placeholder="翻译结果(添加的键值)" value={item.targetValue} onChange={(e) => translationResChange(e,todoindex)}>
            </VSCodeTextField>
            <VSCodeDropdown disabled={isOnSave} value={item?.optionValue || '选择语言'}>
              {
                checkLan.map((item,index) => (
                  <VSCodeOption key={item.type}  value={item.type} onClick={() => changeProp(todoindex,item.type,'optionValue')}>{item.name}</VSCodeOption>
                ))
              }
            </VSCodeDropdown>
            <VSCodeDropdown disabled={isOnSave} value={item?.fileType || '选择文件类型'}>
              <VSCodeOption value='' onClick={() => changeProp(todoindex,'object','fileType')}>选择文件类型</VSCodeOption>
              <VSCodeOption value='object' onClick={() => changeProp(todoindex,'object','fileType')}>Object</VSCodeOption>
              <VSCodeOption value='json' onClick={() => changeProp(todoindex,'json','fileType')}>JSON</VSCodeOption>
            </VSCodeDropdown>
            <br />
            <VSCodeTextField disabled={isOnSave} value={item.filePath} placeholder="目标文件绝对路径" type="text" onChange={(e) => changeProp(todoindex,e.target.value,'filePath')} id={`file${todoindex}`} style={{color:'#fff',backgroundColor:"#000"}}/>
            <VSCodeButton style={{ position:'relative',bottom:"12px"}} onClick={() => translateOne(todoindex,todoindex)} >翻译</VSCodeButton>
            <VSCodeButton style={{ position:'relative',bottom:"12px"}} onClick={() => delOne(todoindex)}>删除</VSCodeButton>
          </div>
          ))
        }
        <div style={{float:"right"}}>
          <VSCodeButton onClick={onSave}>{isOnSave?'编辑':'保存'}</VSCodeButton>
          <VSCodeButton onClick={translateAll}>一键翻译</VSCodeButton>
          <VSCodeButton onClick={onInsert}>插入</VSCodeButton>
        </div>
        <br />
        {log}
        <br />
        {log2}
      <MessagesContext.Provider value={messagesFromExtension}>
        <Switch>
          {routes.map((route, i) => (
            <RouteWithSubRoutes key={i} {...route} />
          ))}
        </Switch>
      </MessagesContext.Provider>
    </Router>
  );
};
