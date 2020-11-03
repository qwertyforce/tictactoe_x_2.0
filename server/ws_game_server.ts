import * as sktio from "socket.io";
import cookie_parse from 'cookie-parser';
import session from 'express-session';
import connectMongo from 'connect-mongo';
import config from '../config/config'
import db_ops from "./helpers/db_ops";
import moment from "moment";
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
const socket_id_by_username=new Map()

const  Maps:Array<any> = []
Maps.push(new Array(21).fill(null).map(() => new Array(21).fill(0)))

/////////////////////////////////////////////////////////////

//STANDARD (4 players)
const Playing_now = new Map();
const Opened_games =new Map();
// //CLASSIC (4 players)
const Playing_now_classic = new Map();
const Opened_games_classic = new Map();

// //DUEL STANDARD (2 players)
const Playing_now_duel = new Map();
const Opened_games_duel = new Map();
// //DUEL CLASSIC (2 players)
const Playing_now_classic_duel = new Map();
const Opened_games_classic_duel = new Map();
// //PRIVATE STANDARD (4 players)
const Playing_now_private = new Map();
const Opened_games_private = new Map();
// //PRIVATE CLASSIC (4 players)
const Playing_now_classic_private = new Map();
const Opened_games_classic_private = new Map();
// //DUEL PRIVATE STANDARD (2 players)
const Playing_now_private_duel = new Map();
const Opened_games_private_duel = new Map();
// //DUEL PRIVATE CLASSIC (2 players)
const Playing_now_classic_private_duel = new Map();
const Opened_games_classic_private_duel = new Map();
//////////////////////////////////////////////////////////////
const bonuses = ["set_block", "destroy_block", "destroy_player_figure", "enemy_figure_transform", "mine"];
let GAME_ID=0
function randomInteger(min:number, max:number) {
  return Math.floor(min + Math.random() * (max + 1 - min));
}

function join_lobby(socket:any, Room:string, Opened:any) {
  Opened[Room].players += 1;
  socket.join(Room);
  socketio.in(Room).emit('players_waiting', Opened[Room].players);
  Opened[Room].names.push(socket.id);
  socket.room = Room;
}

function matchmaking(socket, lobbysize) {
  const Playing = socket.array_play
  const Opened = socket.array_open
  if (Object.keys(Opened).length > 0) {
      if (Opened[Object.keys(Opened)[0]].players < lobbysize - 1) {
          const Room = Object.keys(Opened)[0];
          join_lobby(socket, Room, Opened)
      } else if (Opened[Object.keys(Opened)[0]].players === lobbysize - 1) {
          const Room = Object.keys(Opened)[0];
          run_lobby(socket, Room, Opened, Playing, lobbysize)
      }
  } else {
    GAME_ID += 1;
      create_lobby(socket, GAME_ID, Opened);
  }
}

function run_lobby(socket, Room, Opened, Playing, lobbysize) {
  Opened[Room].players += 1;
  let usernames = [];
  Opened[Room].names.push(socket.id);
  for (let i = 0; i < lobbysize; i++) {
    usernames[i] = Players_name_by_socket_id[Opened[Room].names[i]];
  }
  Opened[Room].Turn = Opened[Room].names[Math.floor((Math.random() * lobbysize))];
  socket.join(Room);
  socketio.in(Room).emit('players_waiting', lobbysize);
  socketio.in(Room).emit('player_Names', Names);
  socketio.in(Room).emit("get_Players", Opened[Room].names);
  socketio.in(Room).emit("FirstTurn", Opened[Room].Turn);
  Playing[Room] = Object.assign({}, Opened[Room]);
  delete Opened[Room];
  socket.room = Room
  socketio.in(Room).emit("Map_Load", Playing[Room].board);
  Playing[Room].last_move_time = moment().format();
}


function create_lobby(socket:any, Room:string, Opened:any) {
  const map= JSON.parse(JSON.stringify(Maps[randomInteger(0, Maps.length - 1)]));
  Opened.set(Room,{
      number_of_players: 1,
      players: [socket.id],
      board: map,
      last_move_time: 0
  })
  socket.join(Room);
  socket.room = Room
  socket.emit('players_waiting', 1);
}

socketio.use(async function (socket: any, next) { 
  console.log(socket.handshake.query)
  if(socket.handshake.query.guest_name && typeof socket.handshake.query.guest_name === "string"){
    const username=socket.handshake.query.guest_name
    if(socket_id_by_username.get(username)===undefined){ // no players with this username online
      const users=await db_ops.activated_user.find_user_by_username(socket.handshake.query.guest_name) 
      if(users.length===0){//no players with this username are registered
        socket.username = socket.handshake.query.guest_name
        socket.guest=1
        return next()
      } 
    }
    const err = new Error("Username is already taken");
    return next(err);
  }else{
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
          const username=(socket.handshake as any).session.username
          if(socket_id_by_username.get(username)===undefined){
            socket.username = (socket.handshake as any).session.username
            socket_id_by_username.set(username,socket.id)
            return next()
          }
          
        })
      }
    });
  }

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
  socket.on("find_game", function (query: any) {
    if (query.pass) { //private game'
      let lobby_size;
      if (query?.gm === 1) {
        socket.classic = 1;
        if (query.duel) {
          lobby_size = 2
          socket.array_play = Playing_now_classic_private_duel
          socket.array_open = Opened_games_classic_private_duel
          socket.mode = "p_classic_pvp"
        } else {
          lobby_size = 4
          socket.array_play = Playing_now_classic_private
          socket.array_open = Opened_games_classic_private
          socket.mode = "p_classic"
        }
      } else if (query?.gm === 2) {
        socket.used_cells_for_bonus = {}
        socket.available_bonuses = {}
        socket.number_of_bonuses_to_use_in_this_turn = 2
        const random_bonus = bonuses[randomInteger(0, bonuses.length - 1)]
        socket.bonus[random_bonus] = 1;
        if (query.duel) {
          lobby_size = 2
          socket.array_play = Playing_now_private_duel
          socket.array_open = Opened_games_private_duel
          socket.mode = "p_modern_pvp"
        } else {
          lobby_size = 4
          socket.array_play = Playing_now_private
          socket.array_open = Opened_games_private
          socket.mode = "p_modern"
        }
      }

    } else {
      let lobby_size;
      if (query?.gm === 1) {
        socket.classic = 1;
        if (query.duel) {
          lobby_size = 2
          socket.array_play = Playing_now_classic_duel
          socket.array_open = Opened_games_classic_duel
          socket.mode = "m_classic_pvp"
        } else {
          lobby_size = 4
          socket.array_play = Playing_now_classic
          socket.array_open = Opened_games_classic
          socket.mode = "m_classic"
        }
      } else if (query?.gm === 2) {
        socket.used_cells_for_bonus = {}
        socket.available_bonuses = {}
        socket.number_of_bonuses_to_use_in_this_turn = 2
        const random_bonus = bonuses[randomInteger(0, bonuses.length - 1)]
        socket.bonus[random_bonus] = 1;
        if (query.duel) {
          lobby_size = 2
          socket.array_play = Playing_now_duel
          socket.array_open = Opened_games_duel
          socket.mode = "m_modern_pvp"
        } else {
          lobby_size = 4
          socket.array_play = Playing_now
          socket.array_open = Opened_games
          socket.mode = "m_modern"
        }
      }
    }
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