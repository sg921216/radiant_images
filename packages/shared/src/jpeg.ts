import { imageHeader } from './imageHeader';

// ITU T.81, Annexes B/C/F/G: https://www.w3.org/Graphics/JPEG/itu-t81.pdf
// Validate 8-bit sequential/progressive Huffman JPEG scans without IDCT or RGB allocation.
// Progressive refinement needs only coefficient significance (one bit/coefficient), not
// coefficient values. Cloudflare still performs the full pixel decode and re-encode.
// Unsupported encodings fail closed; the owner can export a standard JPEG or PNG.
function invalid(): never {
  throw new Error('Invalid or unsupported JPEG.');
}
interface Huffman {
  maximum: Int32Array;
  offset: Int32Array;
  values: Uint8Array;
}
interface Component {
  id: number;
  h: number;
  v: number;
  quantization: number;
  columns: number;
  rows: number;
  stride: number;
  significance: Uint32Array;
  approximation: Int8Array;
}
class Entropy {
  private bits = 0;
  private value = 0;
  constructor(
    private readonly bytes: Uint8Array,
    public position: number,
  ) {}
  read(count: number): number {
    while (this.bits < count) {
      if (this.position >= this.bytes.length) invalid();
      const byte = this.bytes[this.position++]!;
      if (byte === 255 && this.bytes[this.position++] !== 0) invalid();
      this.value = (this.value << 8) | byte;
      this.bits += 8;
    }
    this.bits -= count;
    return (this.value >>> this.bits) & ((1 << count) - 1);
  }
  symbol(table: Huffman | undefined): number {
    if (!table) invalid();
    let code = 0;
    for (let length = 1; length <= 16; length++) {
      code = (code << 1) | this.read(1);
      if (table.maximum[length]! >= code)
        return table.values[code + table.offset[length]!] ?? invalid();
    }
    return invalid();
  }
  align() {
    // Encoders pad the final entropy byte with ones; accepting zero fill can hide a
    // missing block when the shortest Huffman code is zero.
    if ((this.value & ((1 << this.bits) - 1)) !== (1 << this.bits) - 1) invalid();
    this.bits = 0;
  }
  marker(): number {
    this.align();
    if (this.bytes[this.position++] !== 255) invalid();
    while (this.bytes[this.position] === 255) this.position++;
    const code = this.bytes[this.position++];
    if (code === undefined || code === 0) invalid();
    return code;
  }
}

export function assertJpegComplete(bytes: Uint8Array): void {
  const header = imageHeader(bytes);
  if (header.mime !== 'image/jpeg') invalid();
  let position = 2;
  const u16 = (at: number) => ((bytes[at] ?? 0) << 8) | (bytes[at + 1] ?? 0);
  const dc: (Huffman | undefined)[] = [],
    ac: (Huffman | undefined)[] = [];
  const quantization = new Set<number>();
  const components: Component[] = [];
  let progressive = false,
    columns = 0,
    rows = 0,
    restartInterval = 0,
    scans = 0;
  let allocated = 0,
    work = 0;
  while (position < bytes.length) {
    if (bytes[position++] !== 255) invalid();
    while (bytes[position] === 255) position++;
    const marker = bytes[position++]!;
    if (marker === 217) {
      if (!scans || components.some((c) => c.approximation[0] === -1) || position !== bytes.length)
        invalid();
      return;
    }
    if (position + 2 > bytes.length) invalid();
    const length = u16(position),
      end = position + length;
    if (length < 2 || end > bytes.length) invalid();
    position += 2;
    if (marker === 219) {
      while (position < end) {
        const table = bytes[position++]!,
          precision = table >> 4,
          id = table & 15;
        if (precision > 1 || id > 3 || position + 64 * (precision + 1) > end) invalid();
        for (let i = 0; i < 64; i++) {
          if ((precision ? u16(position) : bytes[position]) === 0) invalid();
          position += precision + 1;
        }
        quantization.add(id);
      }
    } else if (marker === 196) {
      while (position < end) {
        const kind = bytes[position++]!,
          id = kind & 15;
        if (kind >> 4 > 1 || id > 3 || position + 16 > end) invalid();
        const counts = bytes.subarray(position, position + 16);
        position += 16;
        const total = counts.reduce((sum, count) => sum + count, 0);
        if (!total || total > 256 || position + total > end) invalid();
        const table: Huffman = {
          maximum: new Int32Array(17).fill(-1),
          offset: new Int32Array(17),
          values: bytes.subarray(position, position + total),
        };
        position += total;
        let code = 0,
          index = 0;
        for (let size = 1; size <= 16; size++) {
          const count = counts[size - 1]!;
          // An all-ones code is forbidden, reserving entropy padding unambiguously.
          if (code + count >= 1 << size) invalid();
          if (count) {
            table.maximum[size] = code + count - 1;
            table.offset[size] = index - code;
          }
          code = (code + count) << 1;
          index += count;
        }
        (kind >> 4 ? ac : dc)[id] = table;
      }
    } else if ([192, 193, 194].includes(marker)) {
      if (components.length || position + 6 > end || bytes[position++] !== 8) invalid();
      const height = u16(position),
        width = u16(position + 2),
        count = bytes[position + 4]!;
      position += 5;
      if (
        height !== header.height ||
        width !== header.width ||
        count < 1 ||
        count > 4 ||
        position + count * 3 !== end
      )
        invalid();
      progressive = marker === 194;
      for (let i = 0; i < count; i++) {
        const id = bytes[position++]!,
          sampling = bytes[position++]!,
          q = bytes[position++]!;
        const h = sampling >> 4,
          v = sampling & 15;
        if (!h || !v || h > 4 || v > 4 || q > 3 || components.some((c) => c.id === id)) invalid();
        components.push({
          id,
          h,
          v,
          quantization: q,
          columns: 0,
          rows: 0,
          stride: 0,
          significance: new Uint32Array(0),
          approximation: new Int8Array(64).fill(-1),
        });
      }
      if (components.reduce((sum, c) => sum + c.h * c.v, 0) > 10) invalid();
      const maxH = Math.max(...components.map((c) => c.h)),
        maxV = Math.max(...components.map((c) => c.v));
      columns = Math.ceil(width / (8 * maxH));
      rows = Math.ceil(height / (8 * maxV));
      for (const c of components) {
        c.columns = Math.ceil((width * c.h) / (8 * maxH));
        c.rows = Math.ceil((height * c.v) / (8 * maxV));
        c.stride = columns * c.h;
        if (progressive) {
          const words = c.stride * rows * c.v * 2;
          allocated += words * 4;
          if (allocated > 24 * 1024 * 1024) invalid();
          c.significance = new Uint32Array(words);
        }
      }
    } else if (marker === 221) {
      if (length !== 4) invalid();
      restartInterval = u16(position);
      position = end;
    } else if (marker === 218) {
      if (!components.length || ++scans > 256 || position >= end) invalid();
      const count = bytes[position++]!;
      if (!count || count > components.length || position + count * 2 + 3 !== end) invalid();
      const selected: { c: Component; dc: Huffman | undefined; ac: Huffman | undefined }[] = [];
      for (let i = 0; i < count; i++) {
        const id = bytes[position++]!,
          tables = bytes[position++]!;
        const c = components.find((candidate) => candidate.id === id);
        if (
          !c ||
          !quantization.has(c.quantization) ||
          selected.some((s) => s.c === c) ||
          tables >> 4 > 3 ||
          (tables & 15) > 3
        )
          invalid();
        selected.push({ c, dc: dc[tables >> 4], ac: ac[tables & 15] });
      }
      const start = bytes[position++]!,
        last = bytes[position++]!,
        approximation = bytes[position++]!;
      const previous = approximation >> 4,
        next = approximation & 15;
      if (!progressive) {
        if (start !== 0 || last !== 63 || approximation !== 0) invalid();
      } else if (
        start > last ||
        last > 63 ||
        (start === 0 ? last !== 0 : count !== 1) ||
        next > 13 ||
        (previous !== 0 && previous !== next + 1)
      )
        invalid();
      for (const { c } of selected) {
        if (start > 0 && c.approximation[0] === -1) invalid();
        for (let k = start; k <= last; k++)
          if (previous === 0 ? c.approximation[k] !== -1 : c.approximation[k] !== previous)
            invalid();
      }
      const entropy = new Entropy(bytes, position);
      const units = count === 1 ? selected[0]!.c.columns * selected[0]!.c.rows : columns * rows;
      // Bounding the total coefficient visits prevents hostile progressive scan scripts
      // from turning a small file into unlimited work. Ordinary scans are far below this.
      const blocks =
        count === 1 ? units : units * selected.reduce((sum, s) => sum + s.c.h * s.c.v, 0);
      work += blocks * (last - start + 1);
      if (work > 1_500_000_000) invalid();
      let eob = 0,
        expectedRestart = 0;
      const block = (selectedComponent: (typeof selected)[number], index: number) => {
        const { c } = selectedComponent;
        const present = (k: number) =>
          Boolean(c.significance[index * 2 + (k >>> 5)]! & (1 << (k & 31)));
        const mark = (k: number) => {
          const word = index * 2 + (k >>> 5);
          c.significance[word] = c.significance[word]! | (1 << (k & 31));
        };
        if (!progressive || start === 0) {
          if (previous) entropy.read(1);
          else {
            const size = entropy.symbol(selectedComponent.dc);
            if (size > 11) invalid();
            entropy.read(size);
          }
          if (progressive) return;
          for (let k = 1; k <= 63;) {
            const symbol = entropy.symbol(selectedComponent.ac),
              run = symbol >> 4,
              size = symbol & 15;
            if (!size) {
              if (run === 0) return;
              if (run !== 15 || (k += 16) > 64) invalid();
            } else {
              k += run;
              if (size > 10 || k > 63) invalid();
              entropy.read(size);
              k++;
            }
          }
        } else if (!previous) {
          if (eob) {
            eob--;
            return;
          }
          for (let k = start; k <= last;) {
            const symbol = entropy.symbol(selectedComponent.ac),
              run = symbol >> 4,
              size = symbol & 15;
            if (!size) {
              if (run < 15) {
                eob = (1 << run) + entropy.read(run) - 1;
                return;
              }
              if ((k += 16) > last + 1) invalid();
            } else {
              k += run;
              if (size > 10 || k > last) invalid();
              entropy.read(size);
              mark(k++);
            }
          }
        } else {
          let k = start;
          if (!eob) {
            while (k <= last) {
              const symbol = entropy.symbol(selectedComponent.ac),
                size = symbol & 15;
              let zeros = symbol >> 4;
              if (size) {
                if (size !== 1) invalid();
                entropy.read(1);
              } else if (zeros < 15) {
                eob = (1 << zeros) + entropy.read(zeros);
                break;
              } else zeros = 16;
              while (k <= last) {
                if (present(k)) entropy.read(1);
                else if (zeros === 0) break;
                else zeros--;
                k++;
                if (!size && zeros === 0) break;
              }
              if (zeros) invalid();
              if (size) {
                if (k > last) invalid();
                mark(k++);
              }
            }
          }
          if (eob) {
            for (; k <= last; k++) if (present(k)) entropy.read(1);
            eob--;
          }
        }
      };
      for (let unit = 0; unit < units; unit++) {
        if (count === 1) {
          const s = selected[0]!;
          block(s, Math.floor(unit / s.c.columns) * s.c.stride + (unit % s.c.columns));
        } else {
          const row = Math.floor(unit / columns),
            column = unit % columns;
          for (const s of selected)
            for (let y = 0; y < s.c.v; y++)
              for (let x = 0; x < s.c.h; x++)
                block(s, (row * s.c.v + y) * s.c.stride + column * s.c.h + x);
        }
        if (restartInterval && (unit + 1) % restartInterval === 0 && unit + 1 < units) {
          if (eob || entropy.marker() !== 208 + expectedRestart) invalid();
          expectedRestart = (expectedRestart + 1) % 8;
        }
      }
      if (eob) invalid();
      entropy.align();
      position = entropy.position;
      for (const { c } of selected) for (let k = start; k <= last; k++) c.approximation[k] = next;
      continue;
    } else if ((marker >= 224 && marker <= 239) || marker === 254) {
      position = end;
    } else invalid();
    if (position !== end) invalid();
  }
  invalid();
}
