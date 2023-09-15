import { v4 as uuid, v3 as uuidns } from 'uuid'
import alasql from 'alasql'
import { sortBy } from 'lodash-es'

// create tables
alasql('CREATE TABLE users (id string primary key, nickname string, mac json, ip int)')
alasql('CREATE TABLE user_game (user_id string primary key, sku string)')
alasql('CREATE TABLE rooms (id string primary key, name string, sku string)')
alasql('CREATE TABLE user_room (user_id string primary key, room_id string, joined_at int)')

export const getRooms = alasql.compile('SELECT * FROM rooms WHERE sku = ?')

export const getGames = alasql.compile('SELECT sku, COUNT(id) as room_count FROM rooms GROUP BY sku')

export function addUser ({
  mac, ip, nickname, game
}) {
  const id = uuid()
  alasql('INSERT INTO users VALUES ?', [{
    id, nickname, mac, ip
  }])
  alasql('INSERT INTO user_game VALUES ?', [{ user_id: id, sku: game }])

  return getUser([id])
}

export const getUser = alasql.compile(`
    SELECT users.*, room_id, sku as game
    FROM users
    JOIN user_game g ON g.user_id = id
    LEFT JOIN user_room r ON r.user_id = id
    WHERE users.id = ?
    LIMIT 1
`)

export async function getRoom (id) {
  return alasql('SELECT * FROM rooms WHERE id = ? LIMIT 1', [id])
}

export function addToRoom ({ name, game, userId }) {
  const gameId = uuidns(game, '798d9c90-68b1-4bbe-a10b-ff5d97507f80')
  const id = uuidns(name, gameId)

  const now = Date.now()

  // add user to room
  try {
    alasql('INSERT INTO rooms VALUES ?', [{ id, name, sku: game }])
  } catch (reason) {
    if (!reason.message.includes('already exists')) {
      console.error(reason)
      throw reason
    }
  }

  alasql('INSERT INTO user_room VALUES ?', [{ user_id: userId, room_id: id, joined_at: now }])

  return {
    id,
    name,
    sku: game
  }
}

const usersInRoom = alasql.compile('SELECT * FROM user_room WHERE room_id = ?')
export function getUsersInRoom (roomId) {
  const res = usersInRoom([roomId])

  const [founder] = sortBy(res, ['joined_at'])
  return {
    users: res,
    founder: founder?.user_id
  }
}

export function logoutUser (userId) {
  // remove user from Users
  // if user was in room, notify other users of disconnect

  const [user] = getUser([userId])

  alasql('DELETE FROM user_room WHERE user_id = ?', [userId])
  alasql('DELETE FROM user_game WHERE user_id = ?', [userId])
  alasql('DELETE FROM users WHERE id = ?', [userId])

  return user
}
