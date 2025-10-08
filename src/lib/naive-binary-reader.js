export var Endianness;
(function (Endianness) {
    Endianness[Endianness["LE"] = 0] = "LE";
    Endianness[Endianness["BE"] = 1] = "BE";
})(Endianness || (Endianness = {}));
export function isNaiveBinaryReader(value) {
    if (value instanceof NaiveBinaryReader) {
        return true;
    }
    return false;
}
export class NaiveBinaryReader {
    buffer;
    dataView;
    /** Position in bytes */
    position = 0;
    constructor(buffer) {
        this.buffer = buffer;
        this.dataView = new DataView(this.buffer);
    }
    getLength() {
        return this.buffer.byteLength;
    }
    getPosition() {
        return this.position;
    }
    jumpPosition(newPosition) {
        return (this.position = newPosition);
    }
    advancePosition(bytes) {
        return this.jumpPosition(this.position + bytes);
    }
    // Unsigned methods
    readUInt8() {
        const value = this.dataView.getUint8(this.position);
        this.advancePosition(1);
        return value;
    }
    readUInt16(endianness = Endianness.LE) {
        const value = endianness === Endianness.LE
            ? this.dataView.getUint16(this.position, true)
            : this.dataView.getUint16(this.position);
        this.advancePosition(2);
        return value;
    }
    readUInt32(endianness = Endianness.LE) {
        const value = endianness === Endianness.LE
            ? this.dataView.getUint32(this.position, true)
            : this.dataView.getUint32(this.position);
        this.advancePosition(4);
        return value;
    }
    // Signed methods
    readInt8() {
        const value = this.dataView.getInt8(this.position);
        this.advancePosition(1);
        return value;
    }
    readInt16(endianness = Endianness.LE) {
        const value = endianness === Endianness.LE
            ? this.dataView.getInt16(this.position, true)
            : this.dataView.getInt16(this.position);
        this.advancePosition(2);
        return value;
    }
    readInt32(endianness = Endianness.LE) {
        const value = endianness === Endianness.LE
            ? this.dataView.getInt32(this.position, true)
            : this.dataView.getInt32(this.position);
        this.advancePosition(4);
        return value;
    }
    read(buffer, index, count) {
        for (let i = index; i < count; i++) {
            buffer[i] = this.readUInt8();
        }
    }
}
//# sourceMappingURL=naive-binary-reader.js.map