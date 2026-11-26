/* Integrated AI roster: originals, Evil Ken, the Ryu prototype and the Final Fight guest Damnd. */
'use strict';
window.SF2AI_ROSTER={
  schemaVersion:1,
  baseRoster:[
    {key:'ce:ryu',fighterId:0,name:'Ryu',ready:true},
    {key:'ce:honda',fighterId:1,name:'E.Honda',ready:true},
    {key:'ce:blanka',fighterId:2,name:'Blanka',ready:true},
    {key:'ce:guile',fighterId:3,name:'Guile',ready:true},
    {key:'ce:balrog',fighterId:10,name:'Balrog',ready:true},
    {key:'ce:vega',fighterId:11,name:'Vega',ready:true},
    {key:'ce:ken',fighterId:4,name:'Ken',ready:true},
    {key:'ce:chun-li',fighterId:5,name:'Chun-Li',ready:true},
    {key:'ce:zangief',fighterId:6,name:'Zangief',ready:true},
    {key:'ce:dhalsim',fighterId:7,name:'Dhalsim',ready:true},
    {key:'ce:sagat',fighterId:9,name:'Sagat',ready:true},
    {key:'ce:bison',fighterId:8,name:'M.Bison',ready:true}
  ],
  additions:[...Object.entries(window.SF2AIHeroes.specs).map(([key,p])=>({key:"ai:"+key,baseFighterId:10,name:p.name,origin:"Final Fight",district:"Slum Courtyard",status:"playable",ready:true,selectable:true,maxHP:p.hp})),...Object.entries(window.SF2AIFF.specs).map(([key,p])=>({key:"ai:"+key,baseFighterId:10,name:p.name,origin:"Final Fight",district:p.district,status:"playable",ready:true,selectable:true,maxHP:p.hp})),{key:'ai:damnd',baseFighterId:10,name:'Damnd',origin:'Final Fight',status:'playable',ready:true,selectable:true,maxHP:360},{key:'ai:evil-ken',baseFighterId:4,name:'Evil Ken',status:'playable',ready:true,selectable:true,maxHP:272}],
  evilVariants:SF2AIEVIL.all().map(v=>({...v,baseFighterId:v.fid,selectable:true,nativeController:v.base})),
  futureEvilVariants:SF2AIEVIL.future,
  developmentProfiles:[
    {key:'ai:evil-ryu',baseFighterId:0,name:'Evil Ryu',status:'prototype',ready:false,selectablePrototype:true,maxHP:272}
  ]
};
