import crypto from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-cbc';
const ENCODING = 'hex';
const IV_LENGTH = 16;

export class CryptoUtil {
  private static readonly secret = config.security.cryptoSecret;

  static encrypt(text: string): string {
    if (!text) return text;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(this.secret), iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString(ENCODING) + ':' + encrypted.toString(ENCODING);
  }

  static decrypt(text: string): string {
    if (!text) return text;

    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, ENCODING);
    const encryptedText = Buffer.from(textParts.join(':'), ENCODING);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(this.secret), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  }
}
