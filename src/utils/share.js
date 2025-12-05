export const initWechatShare = () => {
  const setWechatShareInfo = () => {
    if (!window.WeixinJSBridge) {
      return;
    }
     window.WeixinJSBridge?.on('menu:share:appmessage', () => {
      // @ts-ignore
      window.WeixinJSBridge?.invoke('sendAppMessage',{
        "appid": "",
        "img_url": '',
        // "img_width":	"120",//图片宽度
        // "img_height":	"120",//图片高度
        //分享附带链接地址
        "link": location.href,
        //分享内容介绍
        "desc": '体验经典纸牌游戏，与AI对手一较高下',
        "title": '德州扑克',
        }, () => {/*** 回调函数，最好设置为空 ***/});
    });
  }

  if (window.WeixinJSBridge) {
    setWechatShareInfo();
    return;
  }
  
  document.addEventListener(
    'WeixinJSBridgeReady',
    () => {
      setWechatShareInfo();
    }
  );
}