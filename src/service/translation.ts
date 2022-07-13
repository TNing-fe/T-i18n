import axios from 'axios';
import CryptoJS from 'crypto-js';
import * as querystring from 'querystring';

export const tranlate = (text: string,to:string='en'): Promise<any>=> {
    const youdao = {
      appkey: "03937b17d2ade648",
      key: "9CzFrro0t62ergiohZdP33z3DAFR6MOm"
    };
    function truncate(q: string): string {
        var len = q.length;
        if (len <= 20) {
          return q;
        }    
        return q.substring(0, 10) + len + q.substring(len - 10, len);
      
      }
      const salt = (new Date).getTime();
      const curtime = Math.round(new Date().getTime()/1000);
      const key = youdao.key;
      const str1 = youdao.appkey + truncate(text) + salt + curtime + key;
      const sign = CryptoJS.SHA256(str1).toString(CryptoJS.enc.Hex);
      return axios.post("https://openapi.youdao.com/api",querystring.stringify({
        appKey:youdao.appkey,
        q: text,
        salt,
        from: "AUTO",
        to: to,
        sign: sign,
        signType: "v3",
        curtime,
      }));
};
