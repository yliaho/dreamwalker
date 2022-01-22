export enum Endianness {
  LE,
  BE,
}

export function isNaiveBinaryReader(
  value: unknown
): value is NaiveBinaryReader {
  if (value instanceof NaiveBinaryReader) {
    return true;
  }

  return false;
}

export class NaiveBinaryReader {
  private dataView: DataView;
  /** Position in bytes */
  private position = 0;

  constructor(private readonly buffer: ArrayBuffer) {
    this.dataView = new DataView(this.buffer);
  }

  public getLength() {
    return this.buffer.byteLength;
  }

  public getPosition() {
    return this.position;
  }

  public jumpPosition(newPosition: number) {
    return (this.position = newPosition);
  }

  public advancePosition(bytes: number) {
    return this.jumpPosition(this.position + bytes);
  }

  // Unsigned methods

  public readUInt8() {
    const value = this.dataView.getUint8(this.position);
    this.advancePosition(1);

    return value;
  }

  public readUInt16(endianness: Endianness = Endianness.LE) {
    const value =
      endianness === Endianness.LE
        ? this.dataView.getUint16(this.position, true)
        : this.dataView.getUint16(this.position);
    this.advancePosition(2);

    return value;
  }

  public readUInt32(endianness: Endianness = Endianness.LE) {
    const value =
      endianness === Endianness.LE
        ? this.dataView.getUint32(this.position, true)
        : this.dataView.getUint32(this.position);
    this.advancePosition(4);

    return value;
  }

  // Signed methods

  public readInt8() {
    const value = this.dataView.getInt8(this.position);
    this.advancePosition(1);

    return value;
  }

  public readInt16(endianness: Endianness = Endianness.LE) {
    const value =
      endianness === Endianness.LE
        ? this.dataView.getInt16(this.position, true)
        : this.dataView.getInt16(this.position);
    this.advancePosition(2);

    return value;
  }

  public readInt32(endianness: Endianness = Endianness.LE) {
    const value =
      endianness === Endianness.LE
        ? this.dataView.getInt32(this.position, true)
        : this.dataView.getInt32(this.position);
    this.advancePosition(4);

    return value;
  }

  public read(buffer: Uint8Array, index: number, count: number) {
    for (let i = index; i < count; i++) {
      buffer[i] = this.readUInt8();
    }
  }
}
