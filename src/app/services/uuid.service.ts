import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UuidService {

  constructor() { }

  // implementation taken from https://www.fiznool.com/blog/2014/11/16/short-id-generation-in-javascript/
  generateUUID(prefix) {
    const ALPHABET = '23456789ABDEGJKMNPQRVWXYZ'
    const ID_LENGTH = 8

    let rtn = ''
    for (let i = 0; i < ID_LENGTH; i++) {
      rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length))
    }
    return prefix + rtn
  }
}
