function boot(data){if(data&&data.S){S=data.S}else S=load();showCover();requestAnimationFrame(loop)}
const hot=window.claude&&window.claude.hot;
if(hot&&hot.snapshot)try{hot.snapshot(()=>({S}))}catch(e){}
if(hot&&hot.ready)hot.ready(boot);else boot((hot&&hot.data)||{});
})();
