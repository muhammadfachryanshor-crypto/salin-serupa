/**
 * ESC/POS Binary Protocol Generator for Thermal Bluetooth Printers (58mm & 80mm)
 * Universal driver support: Goojprt, Panda, Xprinter, RPP02N, Zjiang, Eppos, Iware, etc.
 */

export type PaperSize = '58mm' | '80mm';

export class EscPosBuilder {
  private buffer: number[] = [];
  private maxColumns: number;

  constructor(paperSize: PaperSize = '58mm') {
    this.maxColumns = paperSize === '80mm' ? 48 : 32;
    this.init();
  }

  /** Reset/Initialize printer hardware state */
  init(): this {
    this.buffer.push(0x1B, 0x40); // ESC @
    return this;
  }

  /** Text Alignment: left, center, right */
  align(alignment: 'left' | 'center' | 'right'): this {
    const val = alignment === 'center' ? 0x01 : alignment === 'right' ? 0x02 : 0x00;
    this.buffer.push(0x1B, 0x61, val); // ESC a n
    return this;
  }

  /** Bold text on/off */
  bold(enable: boolean = true): this {
    this.buffer.push(0x1B, 0x45, enable ? 0x01 : 0x00); // ESC E n
    return this;
  }

  /** Underline text on/off */
  underline(enable: boolean = true): this {
    this.buffer.push(0x1B, 0x2D, enable ? 0x01 : 0x00); // ESC - n
    return this;
  }

  /** Inverted text (white on black background) */
  invert(enable: boolean = true): this {
    this.buffer.push(0x1D, 0x42, enable ? 0x01 : 0x00); // GS B n
    return this;
  }

  /** Text scaling / size */
  size(mode: 'normal' | 'double-w' | 'double-h' | 'double'): this {
    let val = 0x00;
    if (mode === 'double-w') val = 0x10;
    else if (mode === 'double-h') val = 0x01;
    else if (mode === 'double') val = 0x11;
    this.buffer.push(0x1D, 0x21, val); // GS ! n
    return this;
  }

  /** Write raw string to buffer (ASCII / CodePage 437 compatible) */
  text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      let code = str.charCodeAt(i);
      // Replace non-ASCII / Unicode special chars with safe ASCII equivalents
      if (code > 127) {
        code = 0x20; // fallback space
      }
      this.buffer.push(code);
    }
    return this;
  }

  /** Write line with newline */
  line(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0A); // LF
    return this;
  }

  /** Line feed / empty rows */
  feed(lines: number = 1): this {
    this.buffer.push(0x1B, 0x64, Math.max(1, Math.min(10, lines))); // ESC d n
    return this;
  }

  /** Full or partial paper cut */
  cut(): this {
    this.feed(3);
    this.buffer.push(0x1D, 0x56, 0x41, 0x10); // GS V A 16 (feed & partial cut)
    return this;
  }

  /** Open connected cash drawer / laci kasir (Pin 2 / Pin 5 pulse) */
  openCashDrawer(): this {
    this.buffer.push(0x1B, 0x70, 0x00, 0x19, 0xFA); // ESC p 0 25 250
    return this;
  }

  /** Horizontal divider line */
  divider(char: string = '-'): this {
    const fill = char.charAt(0) || '-';
    this.line(fill.repeat(this.maxColumns));
    return this;
  }

  /** Double column justify: left-aligned title, right-aligned value */
  twoColumns(left: string, right: string): this {
    const leftLen = left.length;
    const rightLen = right.length;
    const spaceNeeded = this.maxColumns - (leftLen + rightLen);

    if (spaceNeeded >= 1) {
      this.line(left + ' '.repeat(spaceNeeded) + right);
    } else {
      // If too long, truncate left or wrap
      const maxLeft = Math.max(4, this.maxColumns - rightLen - 1);
      const truncatedLeft = left.slice(0, maxLeft);
      const remainingSpaces = Math.max(1, this.maxColumns - (truncatedLeft.length + rightLen));
      this.line(truncatedLeft + ' '.repeat(remainingSpaces) + right);
    }
    return this;
  }

  /** Export compiled binary buffer */
  getBuffer(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
