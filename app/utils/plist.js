export class PlistInteger {
  constructor(value) {
    this.value = value;
  }

  valueOf() {
    return this.value;
  }
}

export class PlistData {
  constructor(value) {
    this.value = value;
  }

  valueOf() {
    if (this.value.length < 53) {
      return [this.value];
    }

    return this.value.match(/.{52}/g);
  }
}

export default null;
