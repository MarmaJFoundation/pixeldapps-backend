import { mapHeight, mapWidth } from "./core";

export function OutOfBounds(posX: number, posY: number): boolean {
    return posX < 0 || posY < 0 || posX >= mapWidth || posY >= mapHeight;
}

// export function write_data(buffer: number[], offset: number, value: number): number {
//     let pos: number = offset;
//     let val: number = value;
//     const sign: boolean = val < 0;
//     buffer[pos++] = sign ? 1 : 0;
//     if (sign) {
//         val *= -1;
//     }
//     do {
//         let current = (val & 0xFF);
//         if (val >= 0x80) {
//             current |= 0x80;
//         }
//         buffer[pos++] = current;
//         val >>= 7;
//     } while (val > 0);
//     return pos - offset;
// }

/*export function write_u8(buffer: number[], offset: number, value: number): number {
    buffer[offset + 0] = ((value >> 0) & 0xFF);
    return 1;
}

export function write_u16(buffer: number[], offset: number, value: number): number {
    buffer[offset + 0] = ((value >> 0) & 0xFF);
    buffer[offset + 1] = ((value >> 8) & 0xFF);
    return 2;
}

// export function write_u32(buffer: number[], offset: number, value: number): number {
//     buffer[offset + 0] = ((value >> 0) & 0xFF);
//     buffer[offset + 1] = ((value >> 8) & 0xFF);
//     buffer[offset + 2] = ((value >> 16) & 0xFF);
//     buffer[offset + 3] = ((value >> 24) & 0xFF);
//     return 4;
// }

export function write_u64(buffer: number[], offset: number, value: number): number {
    buffer[offset + 0] = ((value >> 0) & 0xFF);
    buffer[offset + 1] = ((value >> 8) & 0xFF);
    buffer[offset + 2] = ((value >> 16) & 0xFF);
    buffer[offset + 3] = ((value >> 24) & 0xFF);
    buffer[offset + 4] = ((value >> 32) & 0xFF);
    buffer[offset + 5] = ((value >> 40) & 0xFF);
    buffer[offset + 6] = ((value >> 48) & 0xFF);
    buffer[offset + 7] = ((value >> 56) & 0xFF);
    return 8;
}*/