import Service from '@ember/service';
import { computed } from '@ember/object';
import { PlistInteger, PlistData } from 'fontinstaller/utils/plist';
import saveAs from 'file-saver';

const uuid = () => {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4))))
      .toString(16)
      .toUpperCase()
  );
};

const toPlist = data => {
  const parse = (payload, indent = 0) => {
    const tabs = '\t'.repeat(indent);

    if (payload === null) {
      return '';
    }

    if (payload instanceof PlistInteger) {
      return `${tabs}<integer>${payload.valueOf()}</integer>`;
    }

    if (payload instanceof PlistData) {
      return `${tabs}<data>\n${tabs}${payload.valueOf().join(`\n${tabs}`)}\n${tabs}</data>`;
    }

    if (typeof payload === 'string') {
      return `${tabs}<string>${payload}</string>`;
    }

    if (typeof payload === 'boolean') {
      return `${tabs}${payload ? '<true/>' : '<false/>'}`;
    }

    if (typeof payload === 'object' && Array.isArray(payload)) {
      return `${tabs}<array>\n${payload
        .map(entry => parse(entry, indent + 1))
        .join('\n')}\n${tabs}</array>`;
    }

    if (typeof payload === 'object') {
      return `${tabs}<dict>\n${Object.entries(payload)
        .map(([key, value]) => {
          if (value === null) {
            return '';
          }

          return `${tabs}\t<key>${key}</key>\n${parse(value, indent + 1)}`;
        })
        .join('\n')}\n${tabs}</dict>`;
    }

    throw new Error(
      `Type "${typeof payload}" at level ${indent} not implemented. Value: "${payload}"`
    );
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
${parse(data)}
</plist>`;
};

export default Service.extend({
  fonts: null,

  mimeType: `application/x-apple-aspen-config`,
  extension: `.mobileconfig`,
  description: 'Created using https://fontinstaller.app',
  organization: 'Font Installer by @pichfl',
  identifier: 'app.fontinstaller.fonts',
  message: null,
  _displayName: '',

  displayName: computed('fonts', {
    get() {
      return this._displayName || this.fonts.size === 1
        ? 'One font file'
        : `${this.fonts.size} font files`;
    },
    set(_, value) {
      return this.set('_displayName', value);
    },
  }),

  fontsAsArray: computed('fonts', function() {
    return [...this.fonts.entries()].map(([key, value]) => Object.assign({}, value, { data: key }));
  }),

  data: computed(
    'fonts',
    'message',
    'description',
    'displayName',
    'identifier',
    'organization',
    function() {
      const id = uuid();

      return {
        ConsentText: this.message
          ? {
              default: this.message,
            }
          : null,
        PayloadDescription: this.description,
        PayloadDisplayName: this.displayName,
        PayloadIdentifier: `${this.identifier}.${id}`,
        PayloadOrganization: this.organization,
        PayloadRemovalDisallowed: false,
        PayloadType: 'Configuration',
        PayloadUUID: id,
        PayloadVersion: new PlistInteger(1),
        PayloadContent: [...this.fonts.entries()].map(([data, meta]) => {
          const PayloadUUID = uuid();

          return {
            Font: new PlistData(data),
            Name: meta.name,
            PayloadDescription: 'Configured font settings',
            PayloadDisplayName: 'Fonts',
            PayloadIdentifier: `com.apple.font.${PayloadUUID}`,
            PayloadType: 'com.apple.font',
            PayloadUUID,
            PayloadVersion: new PlistInteger(1),
          };
        }),
      };
    }
  ),

  init() {
    this._super(...arguments);

    this.set('fonts', new Map());
  },

  addFont(data, meta) {
    this.fonts.set(data, meta);
    this.notifyPropertyChange('fonts');
  },

  removeFont(font) {
    if (this.fonts.has(font.data)) {
      this.fonts.delete(font.data);
      this.notifyPropertyChange('fonts');
    }
  },

  install(name) {
    this.set('displayName', name);

    const data = toPlist(this.data);

    const blob = new Blob([data], {
      type: this.mimeType,
    });

    saveAs(blob, `${`fonts-${new Date().toISOString()}`}${this.extension}`);

    this.set('_displayName', '');
  },
});
