import Component from '@ember/component';
import { inject as service } from '@ember/service';
import opentype from 'opentype.js';

const readFileAsBase64 = async file =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject();

      return;
    }

    const reader = new FileReader();

    reader.addEventListener('error', reject, false);
    reader.addEventListener(
      'load',
      () => {
        const dataString = reader.result;
        const parts = dataString.split(',');
        const base64 = parts[1];

        resolve(base64);
      },
      false
    );

    reader.readAsDataURL(file);
  });

const getFontInfo = async file =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject();

      return;
    }

    const reader = new FileReader();

    reader.addEventListener('error', reject, false);
    reader.addEventListener(
      'load',
      () => {
        const font = opentype.parse(reader.result);

        resolve(font);
      },
      false
    );

    reader.readAsArrayBuffer(file);
  });

export default Component.extend({
  mobileconfig: service(),

  actions: {
    async onFileChange(files) {
      await Promise.all(
        [...files].map(async file => {
          const data = await readFileAsBase64(file);
          const info = await getFontInfo(file);

          this.mobileconfig.addFont(data, {
            lastModified: file.lastModified,
            filename: file.name,
            size: file.size,
            name: info.names.fullName.en || file.name,
            designer: info.names.designer.en || 'Unknown',
            version: info.names.version.en || '0.0',
          });
        })
      );
    },
  },
});
