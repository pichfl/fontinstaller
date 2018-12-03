import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { lt } from '@ember/object/computed';

export default Controller.extend({
  mobileconfig: service(),

  installDisabled: lt('mobileconfig.fontsAsArray.length', 1),

  actions: {
    remove(font) {
      this.mobileconfig.removeFont(font);
    },

    install() {
      const name = window.prompt('', this.mobileconfig.displayName);

      if (name === null) {
        return;
      }

      this.mobileconfig.install(name);
    },
  },
});
