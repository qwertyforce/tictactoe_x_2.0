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
socketio.use(function (socket, next) { //CHANGE ERROR CODES
    cookieParser((socket.handshake as any), ({} as any), function(err:any){
        console.log(err)
        if((socket.handshake as any).session)
        ses_midleware((socket.handshake as any),({} as any),function(err:any){
            console.log((socket.handshake as any).session)
            console.log(err)
        })
    });
    next()
});