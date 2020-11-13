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
const username_by_socket_id=new Map()
const socket_id_by_username=new Map()
socket_id_by_username.set("Server",1)

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
  console.log("JOIN LOBBY")
  Opened.get(Room).number_of_players += 1;
  socket.join(Room);
  socketio.in(Room).emit('players_waiting', Opened.get(Room).number_of_players);
  Opened.get(Room).players.push(socket.id);
  socket.room = Room;
  console.log(Opened)
}

function matchmaking(socket: any, lobby_size: number) {
  const Playing = socket.array_play
  const Opened = socket.array_open

  if (Opened.size > 0) {
    const Room = Opened.keys().next().value
    if (Opened.get(Room).number_of_players < lobby_size - 1) {
      join_lobby(socket, Room, Opened)
    } else if (Opened.get(Room).number_of_players === lobby_size - 1) {
      run_lobby(socket, Room, Opened, Playing, lobby_size)
    }
  } else {
    GAME_ID += 1;
    create_lobby(socket, GAME_ID.toString(), Opened);
  }
}

function private_matchmaking(socket: any, Room: string, lobbysize: number) {
  const Playing = socket.array_play
  const Opened = socket.array_open
  if (Opened.get(Room) !== undefined) {
    if (Opened.get(Room).number_of_players < lobbysize - 1) {
      join_lobby(socket, Room, Opened)
    } else if (Opened.get(Room).number_of_players === lobbysize - 1) {
      run_lobby(socket, Room, Opened, Playing, lobbysize)
    }
  } else {
    create_lobby(socket, Room, Opened);
  }
}

function generate_players(usernames,socket_ids){
  const players=[]
  let figures = ["cross", "circle", "square", "triangle"]
  let colors = ["green", "blue", "light_blue", "orange"]
  for (let i=0;i<usernames.length;i++) {
    const color_idx = randomInteger(0, colors.length - 1)
    const color = colors[color_idx]
    colors.splice(color_idx, 1)
    const figure_idx = randomInteger(0, figures.length - 1)
    const figure = figures[figure_idx]
    figures.splice(figure_idx, 1)
    players.push({ username: usernames[i], socket_id:socket_ids[i], color: color, figure: figure })
  }
  return players
}

function run_lobby(socket: any, Room: string, Opened: any, Playing: any, lobby_size: number) {
  Opened.get(Room).number_of_players += 1;
  let usernames = [];
  Opened.get(Room).players.push(socket.id);
  for (let i = 0; i < lobby_size; i++) {
    usernames[i] = username_by_socket_id.get(Opened.get(Room).players[i]);
  }
  const current_player_idx=Math.floor((Math.random() * lobby_size))
  Opened.get(Room).Turn = Opened.get(Room).players[current_player_idx];
  socket.join(Room);
  console.log(usernames)
  const usernames_colors_figures=generate_players(usernames,Opened.get(Room).players)
  socketio.in(Room).emit('players_waiting', lobby_size);
  // socketio.in(Room).emit('player_usernames', usernames);
  socketio.in(Room).emit("get_usernames_colors_figures", usernames_colors_figures);
  // socketio.in(Room).emit("get_Players", Opened.get(Room).players);
  socketio.in(Room).emit("get_first_turn_player_idx", current_player_idx);
  Playing.set(Room, Opened.get(Room))
  Opened.delete(Room);
  socket.room = Room
  socketio.in(Room).emit("Map_Load", Playing.get(Room).board);
  Playing.get(Room).last_move_time = moment().format();
}

function create_lobby(socket: any, Room: string, Opened: any) {
  const map = JSON.parse(JSON.stringify(Maps[randomInteger(0, Maps.length - 1)]));
  Opened.set(Room, {
    number_of_players: 1,
    players: [socket.id],
    board: map,
    last_move_time: 0
  })
  socket.join(Room);
  socket.room = Room
  socket.emit('players_waiting', 1);
}
function Move_transition(socket:any) {
  const Playing = socket.array_play
  Playing.get(socket.room).last_move_time = moment().format();
  const player_idx = Playing.get(socket.room).players.indexOf(Playing.get(socket.room).Turn);
  if (player_idx + 1 === Playing.get(socket.room).players.length) {
    Playing.get(socket.room).Turn = Playing.get(socket.room).players[0]
  } else {
    Playing.get(socket.room).Turn = Playing.get(socket.room).players[player_idx + 1];
  }
}
socketio.use(async function (socket: any, next) {
  console.log(socket.handshake.query)
  if (socket.handshake.query.guest_username && typeof socket.handshake.query.guest_username === "string") {
    const username = socket.handshake.query.guest_username
    if (socket_id_by_username.get(username) === undefined) { // no players with this username online
      const users = await db_ops.activated_user.find_user_by_username(socket.handshake.query.guest_username)
      if (users.length === 0) {//no players with this username are registered
        socket_id_by_username.set(username, socket.id)
        username_by_socket_id.set(socket.id,username)
        socket.username = socket.handshake.query.guest_username
        socket.guest = 1
        return next()
      }
    }
    const err = new Error("Username is already taken");
    return next(err);
  } else {
    cookieParser((socket.handshake as any), ({} as any), function (err: any) {
      if (err) {
        err = new Error("Can't parse cookie");
        return next(err);
      }
      if ((socket.handshake as any).signedCookies.session) {
        ses_midleware((socket.handshake as any), ({} as any), function (err: any) {
          if (err) {
            err = new Error("ses_midleware_error");
            return next(err);
          }
          if ((socket.handshake as any).session.username === undefined) {
            err = new Error("not authed");
            return next(err);
          }
          const username = (socket.handshake as any).session.username
          if (socket_id_by_username.get(username) === undefined) {
            socket.username = (socket.handshake as any).session.username
            socket_id_by_username.set(username, socket.id)
            username_by_socket_id.set(socket.id,username)
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
  // socket.join("fqwf",function(){
  //   console.log(socket.rooms)
  // })
  console.log(socket.username)
  console.log(socket.handshake.address);
 
 
  socket.on('send_message', function(message:any) {
    if(socket.room){
      socketio.in(socket.room).emit('message_received', socket.username, message);
    }
});
  socket.on("find_game", function (query: any) {
    if(!query){
      return
    }
    if (query?.pass && typeof query?.pass==="string" ) { //private game'
      let lobby_size: number;
      if (query?.gm === 1 || query?.gm === 2) {
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
        } else {
          socket.used_cells_for_bonus = {}
          socket.available_bonuses = {}
          socket.number_of_bonuses_to_use_in_this_turn = 2
          const random_bonus = bonuses[randomInteger(0, bonuses.length - 1)]
          socket.available_bonuses[random_bonus] = 1;
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
        private_matchmaking(socket,query.pass, lobby_size)
      }
    } else {
      let lobby_size: number;
      if (query?.gm === 1 || query?.gm === 2) {
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
        } else {
          socket.used_cells_for_bonus = {}
          socket.available_bonuses = {}
          socket.number_of_bonuses_to_use_in_this_turn = 2
          const random_bonus = bonuses[randomInteger(0, bonuses.length - 1)]
          socket.available_bonuses[random_bonus] = 1;
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
        matchmaking(socket, lobby_size)
      }
    }
  })

socket.on('disconnect', function() {
  socket_id_by_username.delete(socket.username)
  username_by_socket_id.delete(socket.id)
  console.log('Got disconnect!');
  if (socket.room === undefined) {
      return
  }
  const Playing = socket.array_play
  const Opened = socket.array_open
  socketio.in(socket.room).emit('message_received', "Server", socket.username + " disconnected");
  if (Playing.get(socket.room) !== undefined) {
      if(!socket.guest){
        //db_lost(socket.username)
      }
      if (Playing.get(socket.room).Turn === socket.id) {
          Move_transition(socket);
          console.log("After_leave ", Playing.get(socket.room).Turn);
      }
      Playing.get(socket.room).players.splice(Playing.get(socket.room).players.indexOf(socket.id), 1);
      Playing.get(socket.room).number_of_players -= 1;
      if (Playing.get(socket.room).number_of_players === 0) {
          Playing.delete(socket.room)
          return;
      };
      const player_idx = Playing.get(socket.room).players.indexOf(socket.id);
      socketio.in(socket.room).emit('player_left', player_idx);
  };
  if ((Opened.get(socket.room) !== undefined) && (Opened.get(socket.room).players.indexOf(socket.id) > -1)) {
      Opened.get(socket.room).players.splice(Opened.get(socket.room).players.indexOf(socket.id), 1);
      Opened.get(socket.room).number_of_players -= 1;
      socketio.in(socket.room).emit('players_waiting', Opened.get(socket.room).number_of_players);
  }
  socket.room = undefined;
});

  socket.on('Make_Move', function (row:any, column:any) {
    const Playing = socket.array_play
    if ((socket.room !== undefined) &&
      (Playing.get(socket.room) !== undefined) &&
      (Playing.get(socket.room).Turn === socket.id) &&
      (Number.isInteger(column) === true) &&
      (Number.isInteger(row) === true) &&
      (column >= 0) &&
      (column <= 20) &&
      (row >= 0) &&
      (row <= 20) &&
      ((Playing.get(socket.room).board[row][column] === 0) || (Playing.get(socket.room).board[row][column] === "Mine"))) {
      if (socket.classic != 1) {
        socket.number_of_bonuses_to_use_in_this_turn = 2;
      }
      if (Playing.get(socket.room).board[row][column] === "Mine") {
        console.log("MINE")
        socketio.in(socket.room).emit("Fake_on_move", row, column, socket.id);
        Playing.get(socket.room).board[row][column] = 0;
        Move_transition(socket);
        socketio.in(socket.room).emit('message_received', "Server", socket.username + " vzorvan na mine");
        return
      }
      Playing.get(socket.room).board[row][column] = socket.id;
      console.log(socket.id + "Made a move at " + row + " " + column); //numberofturn=индекс ходящего в массиве игрков
      Move_transition(socket)
      const player_idx = socket.array_play.get(socket.room).players.indexOf(socket.id);
      socketio.in(socket.room).emit("On_move", row, column, player_idx);
    }
  });
  socket.on('MoveTimeUp', function () {
    const Playing = socket.array_play
    if ((socket.room !== undefined) &&
      (Playing.get(socket.room) !== undefined)) {
      const Turn = Playing.get(socket.room).Turn
      if (moment().diff(Playing.get(socket.room).last_move_time, 'milliseconds') >= 45000) {
        console.log(socketio.sockets.connected[Turn].afk)
        if (socketio.sockets.connected[Turn].afk === 1) {
          socketio.sockets.connected[Turn].disconnect(true)
          return
        }
        socketio.sockets.connected[Turn].afk += 1;
        Move_transition(socket);
        socketio.in(socket.room).emit("PlayerTimeUp");
      }
    }
  });

  socket.on('use_bonus', function (row:number, column:number, name_of_bonus:string) {
    const Playing = socket.array_play
    console.log(Playing.get(socket.room))
    if ((socket.room !== undefined) &&
      (Playing.get(socket.room)!== undefined) &&
      (socket.id === Playing.get(socket.room).Turn) &&
      (socket.available_bonuses[name_of_bonus] !== undefined) &&
      (socket.available_bonuses[name_of_bonus] > 0) &&
      (socket.number_of_bonuses_to_use_in_this_turn > 0)
    ) {
      let succes = false;
      console.log("bonus used", name_of_bonus);
      console.log(Playing.get(socket.room).board[row][column]);
      switch (name_of_bonus) {
        case "set_block":
          if (Playing.get(socket.room).board[row][column] === null) {
            Playing.get(socket.room).board[row][column] = "Obstacle";
            succes = true;
          }
          break;

        case "mine":
          if (Playing.get(socket.room).board[row][column] === null) {
            Playing.get(socket.room).board[row][column] = "Mine";
            succes = true;
          }
          break;

        case "destroy_block":
          if (Playing.get(socket.room).board[row][column] === "Obstacle") {
            Playing.get(socket.room).board[row][column] = null;
            succes = true;
          }
          break;
        case "destroy_player_figure":
          if ((Playing.get(socket.room).board[row][column] !== null) &&
            (Playing.get(socket.room).board[row][column] !== "Obstacle")
          ) {
            Playing.get(socket.room).board[row][column] = null;
            succes = true;
          }
          break;
        case "enemy_figure_transform":
          if ((Playing.get(socket.room).board[row][column] !== null) &&
            (Playing.get(socket.room).board[row][column] !== "Obstacle") &&
            (Playing.get(socket.room).board[row][column] !== socket.id)
          ) {
            Playing.get(socket.room).board[row][column] = socket.id;
            succes = true;
          }
          break;
      }
      if (succes) {
        socket.number_of_bonuses_to_use_in_this_turn -= 1;
        socket.available_bonuses[name_of_bonus] -= 1;
        if (name_of_bonus === "mine") {
          return;
        }
        socketio.in(socket.room).emit('bonus_used', name_of_bonus, row, column, socket.id);
      }
    }
  });
  socket.on('win_detected', function (row:number, column:number) {
    const Playing = socket.array_play
    if (socket.room === undefined || Playing.get(socket.room) === undefined) {
      return
    }
    let figures_to_win = 7;
    if (socket.classic === 1) {
      figures_to_win = 5
    }
    const winner_socket_id=Playing.get(socket.room).board[row][column]
    const Directions = get_directions(Playing.get(socket.room).board, row, column,figures_to_win)
    // console.log(Directions)
    for (let i = 0; i < 4; i++) {
      const res = check_directions(Directions[i], i,figures_to_win)
      if (res) {
        const win_rows = res[0]
        const win_columns = res[1]
        // console.log(win_rows)
        // console.log(win_columns)
        console.log("win DETECTED");
        handle_win(socket,win_rows,win_columns,winner_socket_id)
        return true
      }
    }
  })
})

function get_directions(Board:any, x:number, y:number,figures_to_win:number) {
  const Directions = [[],[],[],[]];
  const Rows=21
  const Columns=21
  let dir0=-1
  let dir1=-1
  let dir2=-1
  let dir3=-1
  for (let i = -(figures_to_win-1); i < figures_to_win; i++) {
      if (x + i >= 0 && x + i <= Rows - 1) {
          if(dir0===-1){dir0=[x+i,y]}
          Directions[0].push(Board[x + i][y])
          if (y + i >= 0 && y + i <= Columns - 1) {
              if(dir2===-1){dir2=[x+i,y+i]}
              Directions[2].push(Board[x + i][y + i])
          }
      }
      if (y + i >= 0 && y + i <= Columns - 1) {
          if(dir1===-1){dir1=[x,y+i]}
          Directions[1].push(Board[x][y + i])
          if (x - i >= 0 && x - i <= Rows - 1) {
              if(dir3===-1){dir3=[x-i,y+i]}
              Directions[3].push(Board[x - i][y + i])
          }
      }
  }
  Directions[0].push(dir0)
  Directions[1].push(dir1)
  Directions[2].push(dir2)
  Directions[3].push(dir3)
  return Directions
}
function check_directions(arr,i,figures_to_win:number) {
  const vector=get_vector(i)
  const reference_point=arr[arr.length-1]
  const comp_func=(figures_to_win===5)?check5:check7
  for (let i = 0; i < arr.length - (figures_to_win+1); i++) {
      if (arr[i] !== 0) {
          if (comp_func(arr,i)) {
              const win_rows=[]
              const win_columns=[]
              for(let k=i;k<=i+(figures_to_win-1);k++){
                win_rows.push(reference_point[0]+k*vector[0])
                win_columns.push(reference_point[1]+k*vector[1])
              }
              return [win_rows,win_columns]
          }
      }

  }
  return false
}
function check5(arr:number[],i:number){
  return arr[i] === arr[i + 1] && arr[i] === arr[i + 2] && arr[i] === arr[i + 3] && arr[i] === arr[i + 4]
}
function check7(arr:number[],i:number){
  return arr[i] === arr[i + 1] && arr[i] === arr[i + 2] && arr[i] === arr[i + 3] && arr[i] === arr[i + 4]  && arr[i] === arr[i + 5]  && arr[i] === arr[i + 6] 
}
function get_vector(i){
  switch(i){
      case 0:
          return [1,0]
      case 1:
          return [0,1]
      case 2:
          return [1,1]
      case 3:
          return [-1,1]
  }
}
function handle_win(socket:any,win_rows:any,win_columns:any,winner_socket_id:any){
  const winner_index = socket.array_play.get(socket.room).players.indexOf(winner_socket_id);
  socketio.in(socket.room).emit('win_detected', win_rows, win_columns,winner_index);
  const number_of_players = socket.array_play.get(socket.room).number_of_players
  const Losers=[]
  for (let i = 0; i < number_of_players; i++) {
      if (i != winner_index) {
        Losers.push(username_by_socket_id.get(socket.array_play.get(socket.room).players[i]));
      }
  }
  console.log(Losers)
  socketio.in(socket.room).emit('message_received', "Server", socket.username + " won the game");
  socket.array_play.delete(socket.room)
}