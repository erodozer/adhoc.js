import * as r from 'restructure'
import { SceNetAdhocctlPacketBase } from './packets.js'

export const OP_PING = 0

export default [
  {
    opcode: 0,
    auth: false,
    schema: new r.Struct({
      ...SceNetAdhocctlPacketBase
    }),
    async handler (msg, _session, socket) {
      // console.log('PING received');
    }
  }
]
