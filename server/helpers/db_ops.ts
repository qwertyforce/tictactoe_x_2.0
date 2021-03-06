import {MongoClient} from 'mongodb'
import crypto from "crypto"
import config from '../../config/config'
const url = config.mongodb_url;
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};
const db_main = 'TicTacToeX';
const client = new MongoClient(url, options);
client.connect(function(err) {
    if (err) {
        console.log(err)
    } else {
        console.log("Connected successfully to db server");
    }
});
client.db(db_main).listCollections({
    name: "not_activated_users"
}).toArray().then(function(items) {
    if (items.length === 0) {
        client.db(db_main).collection("not_activated_users").createIndex({
            "createdAt": 1
        }, {
            expireAfterSeconds: 86400
        });
    }
});

client.db(db_main).listCollections({
    name: "password_recovery"
}).toArray().then(function(items) {
    if (items.length === 0) {
        client.db(db_main).collection("password_recovery").createIndex({
            "createdAt": 1
        }, {
            expireAfterSeconds: 86400
        });
    }
});

async function findDocuments(collection_name:string, selector:Record<string,unknown>) {
    const collection = client.db(db_main).collection(collection_name);
    // collection.find(selector).project({_id:0}).explain((_err,exp)=>console.log(exp))
    const result = collection.find(selector).project({_id:0}).toArray()
    return result
}
async function removeDocument(collection_name:string, selector:Record<string,unknown>) {
    const collection = client.db(db_main).collection(collection_name);
    collection.deleteOne(selector)
}

async function insertDocuments(collection_name:string, documents:Array<any>) {
    const collection = client.db(db_main).collection(collection_name);
    collection.insertMany(documents)
    // const result = await collection.insertMany(documents);
    // return result
}
async function updateDocument(collection_name:string,selector:Record<string,unknown>,update:Record<string,unknown>) {
  const collection = client.db(db_main).collection(collection_name);
  collection.updateOne(selector, { $set: update })
  //const result= await collection.updateOne(selector, { $set: update })
 // console.log(result)
}
// async function addToArrayInDocument(collection_name:string,selector:Record<string,unknown>,update:Record<string,unknown>) {
//     const collection = client.db(db_main).collection(collection_name);
//     const result = collection.updateOne(selector, { $push: update })
//     return result
// }

async function generate_id() {
    const id = new Promise((resolve, reject) => {
        crypto.randomBytes(32, async function(ex, buffer) {
            if (ex) {
                reject("error");
            }
            const id = buffer.toString("base64").replace(/\/|=|[+]/g, '')
            const users = await find_user_by_id(id) //check if id exists
            if (users.length === 0) {
                resolve(id);
            } else {
                const id_1 = await generate_id()
                resolve(id_1)
            }
        });
    });
    return id;
}

////////////////////////////////////////GAME_OPS
async function set_game_result_by_username(username:string,game_mode:string,result:string):Promise<void> {
    let query=""
    switch (game_mode) {
        case "p_classic_duel":
            query = "private_stats.classic_duel"
            break;
        case "p_classic":
            query = "private_stats.classic"
            break;
        case "p_modern_duel":
            query = "private_stats.modern_duel"
            break;
        case "p_modern":
            query = "private_stats.modern"
            break;
        case "m_classic_duel":
            query = "matchmaking_stats.classic_duel"
            break;
        case "m_classic":
            query = "matchmaking_stats.classic"
            break;
        case "m_modern_duel":
            query = "matchmaking_stats.modern_duel"
            break;
        case "m_modern":
            query = "matchmaking_stats.modern"
            break;

    }
    switch(result){
        case "won":
            query+=".wins"
            break;
        case "lost":
            query+=".losses"
            break;
        case "draw":
            query+=".draws"
            break;   
    }
    console.log(username)
    console.log(query)
    let query_obj={[query]:1}
    if (game_mode.includes("m_")) {
        query_obj["matchmaking_games"]=1
        if(result==="won"){
            query_obj["matchmaking_wins"]=1
        }
    }
    const collection = client.db(db_main).collection("users");
    collection.updateOne({username:username}, { $inc: query_obj })
}

async function get_leaderboard() {
    const collection = client.db(db_main).collection("users");
    const top_users = collection.aggregate([
        {$match: {username:{$ne:""}}},
        {$project:{_id:0,username:1,matchmaking_games:1,matchmaking_wins:1}},
        { $sort: { "matchmaking_wins": -1 } },
        { $limit: 10 },
    ])
    return top_users.toArray()
}
////////////////////////////////////////PASSWORD RECOVERY
async function update_user_password_by_id(id:string,password:string):Promise<void> {
    updateDocument("users", {id: id},{password:password})
}

async function delete_password_recovery_token(token:string):Promise<void> {
    removeDocument("password_recovery", {
        token: token
    })
}

async function save_password_recovery_token(token:string, user_id:string):Promise<void> {
    insertDocuments("password_recovery", [{
        "createdAt": new Date(),
        token: token,
        user_id: user_id,
    }])
}

async function find_user_id_by_password_recovery_token(token:string) {
    const user = findDocuments("password_recovery", {
        token: token
    })
    return user
}
//////////////////////////////////////////

//////////////////////////////////////////ACTIVATED USER

async function find_user_by_email(email:string) {
    const user = findDocuments("users", {
        email: email
    })
    return user
}

async function find_user_by_oauth_id(oauth_id:string) {
    const user = findDocuments("users", {
        oauth_id: oauth_id
    })
    return user
}

 async function find_user_by_id(id:string) {
    const user = findDocuments("users", {
        id: id
    })
    return user
}

async function create_new_user_activated(email:string, pass:string) {
    const id=await generate_id()
    insertDocuments("users", [{
        email: email,
        id: id,
        password: pass,
        matchmaking_wins:0,
        matchmaking_games:0,
        private_stats:{
            classic:{wins:0,losses:0,draws:0},
            classic_duel:{wins:0,losses:0,draws:0},
            modern:{wins:0,losses:0,draws:0},
            modern_duel:{wins:0,losses:0,draws:0}
        },
        matchmaking_stats:{
            classic:{wins:0,losses:0,draws:0},
            classic_duel:{wins:0,losses:0,draws:0},
            modern:{wins:0,losses:0,draws:0},
            modern_duel:{wins:0,losses:0,draws:0}
        },
        username:"",
        activated: true
    }])
}


async function create_new_user_activated_github(oauth_id:string) {
    const id=await generate_id()
    insertDocuments("users", [{
        oauth_id: oauth_id,
        id: id,
        matchmaking_wins:0,
        matchmaking_games:0,
        private_stats:{
            classic:{wins:0,losses:0,draws:0},
            classic_duel:{wins:0,losses:0,draws:0},
            modern:{wins:0,losses:0,draws:0},
            modern_duel:{wins:0,losses:0,draws:0}
        },
        matchmaking_stats:{
            classic:{wins:0,losses:0,draws:0},
            classic_duel:{wins:0,losses:0,draws:0},
            modern:{wins:0,losses:0,draws:0},
            modern_duel:{wins:0,losses:0,draws:0}
        },
        username:"",
        activated: true
    }])
    return id
}

async function create_new_user_activated_google(oauth_id:string,email:string) {
    const id=await generate_id()
    insertDocuments("users", [{
        oauth_id: oauth_id,
        email_google:email,
        id: id,
        matchmaking_wins:0,
        matchmaking_games:0,
        private_stats:{
            classic:{wins:0,losses:0,draws:0},
            classic_duel:{wins:0,losses:0,draws:0},
            modern:{wins:0,losses:0,draws:0},
            modern_duel:{wins:0,losses:0,draws:0}
        },
        matchmaking_stats:{
            classic:{wins:0,losses:0,draws:0},
            classic_duel:{wins:0,losses:0,draws:0},
            modern:{wins:0,losses:0,draws:0},
            modern_duel:{wins:0,losses:0,draws:0}
        },
        username:"",
        activated: true
    }])
    return id
}

async function find_user_by_username(username:string) {
    const user = findDocuments("users", {
        username: username
    })
    return user
}
async function set_username(id:string,username:string) {
    updateDocument("users", {id: id},{username:username})
}
/////////////////////////////////////////////////////////


//////////////////////////////////////////NOT ACTIVATED USER
async function find_not_activated_user_by_token(token:string) {
    const user = findDocuments("not_activated_users", {
        token: token
    })
    return user
}

async function delete_not_activated_user_by_token(token:string) {
    removeDocument("not_activated_users", {
        token: token
    })
}

async function create_new_user_not_activated(email:string, pass:string, token:string) {
    insertDocuments("not_activated_users", [{
        "createdAt": new Date(),
        email: email,
        token: token,
        password: pass,
        activated: false
    }])
}
/////////////////////////////////////////////////////////

export default {
    game_ops:{
        set_game_result_by_username,
        get_leaderboard
    },
    password_recovery:{
        update_user_password_by_id,
        delete_password_recovery_token,
        save_password_recovery_token,
        find_user_id_by_password_recovery_token
    },
    activated_user:{
        find_user_by_email,
        find_user_by_oauth_id,
        find_user_by_username,
        set_username,
        find_user_by_id,
        create_new_user_activated,
        create_new_user_activated_github,
        create_new_user_activated_google,
    },
    not_activated_user:{
        find_not_activated_user_by_token,
        delete_not_activated_user_by_token,
        create_new_user_not_activated
    }
}