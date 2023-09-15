import * as r from 'restructure'

export const OPCODE = r.uint8
export const MAC_ADDR = new r.Array(r.uint8, 6) // 48-bit
export const NICKNAME = new r.String(128)
export const ROOMNAME = new r.String(8)
export const PRODUCT_CODE = new r.String(9)
export const IP_ADDR = r.uint32

export const SceNetAdhocctlPacketBase = {
  opcode: OPCODE
}

export const OpHead = new r.Struct(SceNetAdhocctlPacketBase)
