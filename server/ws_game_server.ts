import * as sktio from "socket.io";
import cookie_parse from 'cookie-parser';
import session from 'express-session';
import connectMongo from 'connect-mongo';
import config from '../config/config'
const MongoStore = connectMongo(session);
const ses_midleware=session({
    secret: config.session_secret,
    resave: false,
    saveUninitialized: true,
    name: "session",
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000,              //use secure: true
      sameSite: 'lax'
    },
    store: new MongoStore({
      url: config.mongodb_url+'TicTacToeX?authSource=admin',
      ttl: 14 * 24 * 60 * 60
    }) // = 14 days. Default
  })
const socketio=sktio.listen(8443)
const cookieParser = cookie_parse(config.session_secret);
// const username_by_socket_id=new Map()
socketio.use(function (socket: any, next) { //CHANGE ERROR CODES
  cookieParser((socket.handshake as any), ({} as any), function (err: any) {
    if (err) {
      err = new Error("Can't parse cookie");
      return next(err);
    }
    if ((socket.handshake as any).signedCookies.session){
      ses_midleware((socket.handshake as any), ({} as any), function (err: any) {
        if (err) {
          err = new Error("ses_midleware_error");
          return next(err);
        }
        if((socket.handshake as any).session.username===undefined){
          err = new Error("not authed");
          return next(err);
        }
        socket.username = (socket.handshake as any).session.username
        return next()
      })
    }
  });
  // next()
});

socketio.on('connection', function(socket:any) {
  socket.afk = 0;
  console.log("============CONNECTION");
  socket.leave(socket.id);
  socket.join("fqwf",function(){
    console.log(socket.rooms)
  })
  console.log(socket.username)
  console.log(socket.handshake.address);
 
 
  socket.on('send_message', function(payload:any) {
    const msg=payload.msg
    const room=payload.room_name
    if(socket.rooms.includes(room)){
      socketio.in(room).emit('message_received', socket.username, msg);
    }
});
socket.on("start_game",function(query:any){
  if(query?.gm===1||query?.gm===2){
    if(query?.duel===1){
      
    }
  }
  console.log(query)
})

// socket.on('disconnect', function() {
//   SocketbyName[socket.username] = undefined;
//   console.log('Got disconnect!');
//   if (socket.room === undefined) {
//       return
//   }
//   var Playing = socket.array_play
//   var Opened = socket.array_open
//   socketio.in(socket.room).emit('message_received', "Server", socket.username + " disconnected");
//   if (Playing[socket.room] !== undefined) {
//       var UsernameofLooser = querystring.stringify({
//           'usernames': '["' + socket.username + '"]'
//       });
//       Send_Post_req(UsernameofLooser, '/hujfhmatch_end');
//       if (Playing[socket.room].Turn === socket.id) {
//           Move_transition(socket);
//           console.log("After_leave ", Playing[socket.room].Turn);
//       }
//       Playing[socket.room].names.splice(Playing[socket.room].names.indexOf(socket.id), 1);
//       Playing[socket.room].players -= 1;
//       if (Playing[socket.room].players === 0) {
//           Playing[socket.room] = undefined;
//           return;
//       };
//       socketio.in(socket.room).emit('player_left', socket.id);
//   };
//   if ((Opened[socket.room] !== undefined) && (Opened[socket.room].names.indexOf(socket.id) > -1)) {
//       Opened[socket.room].names.splice(Opened[socket.room].names.indexOf(socket.id), 1);
//       Opened[socket.room].players -= 1;
//       socketio.in(socket.room).emit('players_waiting', Opened[socket.room].players);
//   }
//   socket.room = undefined;
// });

  
})