import {
  bufferReadBoolean,
  bufferReadNumber,
  bufferReadSignedNumber,
  bufferWriteBoolean,
  bufferWriteNumber,
  bufferWriteSignedNumber,
  uint8,
  uint8Sum,
} from '../utilities';
import { bx } from '@hertzg/bx';

describe('Utilities', () => {
  describe('uint8', () => {
    it('should limit the value to 8 bits', () => {
      expect(uint8(-0)).toStrictEqual(0);
      expect(uint8(-0xff)).toStrictEqual(1);
      expect(uint8(0)).toStrictEqual(0);
      expect(uint8(0xff)).toStrictEqual(0xff);
      expect(uint8(0x1000)).toStrictEqual(0);
      expect(uint8(0xff00)).toStrictEqual(0);
      expect(uint8(0xfff0)).toStrictEqual(0xf0);
      expect(uint8(0xff0f)).toStrictEqual(0x0f);
    });
  });

  describe('uint8Sum', () => {
    it('should perform 8 bit arithmetic summation', () => {
      expect(uint8Sum(0, 0)).toStrictEqual(0);
      expect(uint8Sum(0xff, 0)).toStrictEqual(0xff);
      expect(uint8Sum(0x0, 0xff)).toStrictEqual(0xff);
      expect(uint8Sum(0xff, 0x01)).toStrictEqual(0);
      expect(uint8Sum(0xf0, 0x0f)).toStrictEqual(0xff);
      expect(uint8Sum(1, 0xff)).toStrictEqual(0);
      expect(uint8Sum(0xff, 1)).toStrictEqual(0);
      expect(uint8Sum(0xff, 0xff)).toStrictEqual(0xfe);
      expect(uint8Sum(0xffffff, 0xffffff)).toStrictEqual(0xfe);
      expect(uint8Sum(0x0102ff, 0x0102ff)).toStrictEqual(0xfe);
    });
  });

  describe('buffer(Read|Write)Boolean', () => {
    it('should treat any non zero value as true', () => {
      expect(bufferReadBoolean(bx('00'))).toBe(false);
      expect(bufferReadBoolean(bx('0001'))).toBe(false);
      expect(bufferReadBoolean(bx('0001'), 1)).toBe(true);
      expect(bufferReadBoolean(bx('01'))).toBe(true);
      expect(bufferReadBoolean(bx('05'))).toBe(true);
      expect(bufferReadBoolean(bx('00ff'), 1)).toBe(true);
      expect(bufferReadBoolean(bx('00ff00'), 1)).toBe(true);
    });

    it('should always write boolean as 00 or 01', () => {
      const assertWrite = (
        value: boolean,
        expected: Buffer,
        offset?: number
      ) => {
        const buffer = Buffer.alloc(1 + (offset || 0));
        bufferWriteBoolean(buffer, value, offset);
        expect(buffer).toStrictEqual(expected);
      };

      assertWrite(false, bx('00'));
      assertWrite(true, bx('01'));
      assertWrite(false, bx('0000'), 1);
      assertWrite(true, bx('000001'), 2);
    });
  });

  describe('buffer(Read|Write)Number', () => {
    it('should treat bytes as 16 bit big-endian unsigned integer', () => {
      expect(bufferReadNumber(bx('0000'))).toBe(0);
      expect(bufferReadNumber(bx('0001'))).toBe(1);
      expect(bufferReadNumber(bx('000001'), 1)).toBe(1);
      expect(bufferReadNumber(bx('00ff'))).toBe(255);
      expect(bufferReadNumber(bx('ff00'))).toBe(65280);
      expect(bufferReadNumber(bx('00ff00'), 1)).toBe(65280);
    });

    it('should always write number as 16 bit big-endian unsigned integer', () => {
      const assertWrite = (
        value: number,
        expected: Buffer,
        offset?: number
      ) => {
        const buffer = Buffer.alloc(2 + (offset || 0));
        bufferWriteNumber(buffer, value, offset);
        expect(buffer).toStrictEqual(expected);
      };

      /* Note: NaN case is undefined */

      assertWrite(0, bx('0000'));
      assertWrite(1, bx('0001'));
      assertWrite(1, bx('000001'), 1);
      assertWrite(255, bx('00ff'));
      assertWrite(65280, bx('ff00'));
      assertWrite(65280, bx('00ff00'), 1);
      assertWrite(65280, bx('0000ff00'), 2);

      assertWrite(-0, bx('0000'));
      assertWrite(-1, bx('0001'));
      assertWrite(-1, bx('000001'), 1);
      assertWrite(-255, bx('00ff'));
      assertWrite(-65280, bx('ff00'));
      assertWrite(-65280, bx('00ff00'), 1);
      assertWrite(-65280, bx('0000ff00'), 2);
    });
  });

  describe('buffer(Read|Write)SignedNumber', () => {
    it('should treat bytes as boolean (positive or negative) followed by 16 bit big-endian unsigned integers', () => {
      expect(bufferReadSignedNumber(bx('000000'))).toBe(0);
      expect(bufferReadSignedNumber(bx('000001'))).toBe(1);
      expect(bufferReadSignedNumber(bx('00000001'), 1)).toBe(1);
      expect(bufferReadSignedNumber(bx('0000ff'))).toBe(255);
      expect(bufferReadSignedNumber(bx('00ff00'))).toBe(65280);
      expect(bufferReadSignedNumber(bx('0000ff00'), 1)).toBe(65280);

      expect(bufferReadSignedNumber(bx('010000'))).toBe(-0);
      expect(bufferReadSignedNumber(bx('010001'))).toBe(-1);
      expect(bufferReadSignedNumber(bx('00010001'), 1)).toBe(-1);
      expect(bufferReadSignedNumber(bx('0100ff'))).toBe(-255);
      expect(bufferReadSignedNumber(bx('01ff00'))).toBe(-65280);
      expect(bufferReadSignedNumber(bx('0001ff00'), 1)).toBe(-65280);

      expect(bufferReadSignedNumber(bx('020000'))).toBe(-0);
      expect(bufferReadSignedNumber(bx('090001'))).toBe(-1);
      expect(bufferReadSignedNumber(bx('00fa0001'), 1)).toBe(-1);
      expect(bufferReadSignedNumber(bx('f000ff'))).toBe(-255);
      expect(bufferReadSignedNumber(bx('eeff00'))).toBe(-65280);
      expect(bufferReadSignedNumber(bx('0002ff00'), 1)).toBe(-65280);
    });

    it('should always write number as boolean (positive or negative) + 16 bit big-endian unsigned integer', () => {
      const assertWrite = (
        value: number,
        expected: Buffer,
        offset?: number
      ) => {
        const buffer = Buffer.alloc(3 + (offset || 0));
        bufferWriteSignedNumber(buffer, value, offset);
        expect(buffer).toStrictEqual(expected);
      };

      /* Note: NaN case is undefined */

      assertWrite(0, bx('000000'));
      assertWrite(1, bx('000001'));
      assertWrite(1, bx('00000001'), 1);
      assertWrite(255, bx('0000ff'));
      assertWrite(65280, bx('00ff00'));
      assertWrite(65280, bx('0000ff00'), 1);
      assertWrite(65280, bx('000000ff00'), 2);

      assertWrite(-0, bx('000000')); // Note: no signed zeros
      assertWrite(-1, bx('010001'));
      assertWrite(-1, bx('00010001'), 1);
      assertWrite(-255, bx('0100ff'));
      assertWrite(-65280, bx('01ff00'));
      assertWrite(-65280, bx('0001ff00'), 1);
      assertWrite(-65280, bx('000001ff00'), 2);
    });
  });
});
