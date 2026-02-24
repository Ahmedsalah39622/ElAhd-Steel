const { Sequelize } = require('sequelize');
const s = new Sequelize('orca_steel','orca_steel','orca2007',{
  host:'AHMED_MAHMOUD',
  dialect:'mssql',
  dialectOptions:{ options:{ encrypt:true, trustServerCertificate:true } }
});
s.authenticate().then(()=>console.log('DB OK')).catch(e=>console.error('DB ERR', e.message));