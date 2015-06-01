import data from '../util/data';
import registry from '../polyfill/registry';
import walkTree from '../util/walk-tree';

export default function (opts) {
  return function () {
    var elem = this;
    var info = data(elem, opts.id);

    if (info.detached) {
      return;
    }

    if (!elem.attachedCallback) {
      walkTree(elem.childNodes, function (elem) {
        registry.getForElement(elem).forEach(Ctor => Ctor.prototype.createdCallback.call(elem));
      }, function (elem) {
        return !data(elem, opts.id).attached;
      });
    }

    info.detached = true;
    if (opts.detached) {
      opts.detached(elem);
    }
    info.attached = false;
  };
}