define(['src/skate'], function (skate) {
  'use strict';

  describe('Templates', function () {
    it('should not replacing existing content if there is no template', function () {
      skate('my-element', {});

      document.body.innerHTML = '<my-element>my content</my-element>';

      var el = document.querySelector('my-element');
      skate.init(el);
      el.innerHTML.should.equal('my content');
    });

    it('should allow a string', function () {
      var El = skate('my-element', {
        template: 'my template'
      });

      var el = new El();
      el.innerHTML.should.equal('my template');
    });

    it('should retain template element order', function () {
      var El = skate('my-element', {
        template: '<one></one><two></two><three></three>'
      });

      var el = new El();
      el.innerHTML.should.equal('<one></one><two></two><three></three>');
    });

    it('should allow a function that is assumed that it will do the templating', function () {
      var El = skate('my-element', {
        template: function (element) {
          element.innerHTML = 'my template';
        }
      });

      var el = new El();
      el.innerHTML.should.equal('my template');
    });

    it('should add the content to the first matched content element with the content passed to the main element', function () {
      skate('my-element', {
        template: '<span data-skate-content=""></span>'
      });

      document.body.innerHTML = '<my-element>my content</my-element>';

      var el = document.querySelector('my-element');
      skate.init(el);
      el.innerHTML.should.equal('<span data-skate-content="">my content</span>');
    });

    it('should allow first children of the main element to be selected by the content element', function () {
      skate('my-element', {
        template: '<span data-skate-content="some descendant"></span>'
      });

      document.body.innerHTML = '<my-element><some><descendant></descendant></some></my-element>';

      var el = document.querySelector('my-element');
      skate.init(el);
      el.innerHTML.should.equal('<span data-skate-content="some descendant"></span>');
    });

    describe('default content', function () {
      var main;
      var $main;

      beforeEach(function () {
        skate('my-element', {
          template: '<span data-skate-content>default content</span>'
        });

        document.body.innerHTML = '<my-element>initial content</my-element>';

        main = skate.init(document.querySelector('my-element'));
        $main = skate.template.html.wrap(skate.init(main));
      });

      it('should initialise with custom content', function () {
        expect($main.innerHTML).to.equal('initial content');
      });

      it('should insert the default content if no content is found', function () {
        $main.innerHTML = '';

        // Because default content is not exposed.
        expect($main.innerHTML).to.equal('');

        // However, we must ensure that it does properly restore the default
        // content.
        expect(main.childNodes[0].innerHTML).to.equal('default content');
      });

      it('should remove the default content if content is inserted', function () {
        // Clear to restore the default content.
        $main.innerHTML = '';

        // Now when we append a child, it should remove the default content.
        $main.appendChild(document.createElement('span'));
        expect($main.innerHTML).to.equal('<span></span>');
      });
    });

    describe('wrapper methods', function () {
      var element;
      var $element;

      function expectTemplate(one, two, any) {
        expect(element.innerHTML).to.equal(
          '<span data-skate-content="one">' + (one || '') + '</span>' +
          '<span data-skate-content="two, three">' + (two || '') + '</span>' +
          '<span data-skate-content="">' + (any || '') + '</span>' +
          '<span>dummy</span>'
        );
      }

      beforeEach(function () {
        skate('my-element', {
          template: '' +
            '<span data-skate-content="one"></span>' +
            '<span data-skate-content="two, three"></span>' +
            '<span data-skate-content=""></span>' +
            '<span>dummy</span>'
        });

        document.body.innerHTML = '<my-element><one></one><two></two></my-element>';

        element = skate.init(document.querySelector('my-element'));
        $element = skate.template.html.wrap(element);
      });

      it('should allow calling of inherited methods and properties', function () {
        $element.setAttribute('testing', 'testing');
        expect($element.attributes.testing.value).to.equal('testing');
      });

      it('should return the first child', function () {
        expect($element.firstChild.tagName).to.equal('ONE');
      });

      it('should return the last child', function () {
        expect($element.lastChild.tagName).to.equal('TWO');
      });

      it('should return the nodes as a flat list to represent the light DOM', function () {
        expect($element.childNodes.length).to.equal(2);
        expect($element.childNodes[0].tagName).to.equal('ONE');
        expect($element.childNodes[1].tagName).to.equal('TWO');
      });

      it('should insert the element at the correct index in the light DOM: 0', function () {
        $element.insertBefore(document.createElement('three'), $element.childNodes[0]);
        expectTemplate('<one></one>', '<three></three><two></two>');
      });

      it('should insert the element at the correct index in the light DOM: 1', function () {
        $element.insertBefore(document.createElement('three'), $element.childNodes[1]);
        expectTemplate('<one></one>', '<three></three><two></two>');
      });

      it('should insert the element at the correct index in the light DOM: 2', function () {
        $element.insertBefore(document.createElement('three'), $element.childNodes[2]);
        expectTemplate('<one></one>', '<two></two><three></three>');
      });

      it('should throw an error if inserting before a node that does not exist', function () {
        expect(function () {
          $element.insertBefore(document.createElement('three'), document.createElement('notindom'));
        }).to.throw('DOMException 8: The node before which the new node is to be inserted is not a child of this node.');
      });

      it('should allow getting html', function () {
        expect($element.innerHTML).to.equal('<one></one><two></two>');
      });

      it('should allow setting html', function () {
        $element.innerHTML = '<one></one><two></two>';
        expectTemplate('<one></one>', '<two></two>');
      });

      it('should allow getting textContent', function () {
        $element.childNodes[0].textContent = 'testing';
        $element.childNodes[1].textContent = 'testing';
        expectTemplate('<one>testing</one>', '<two>testing</two>');
      });

      it('should allow setting textContent', function () {
        $element.textContent = 'testing';
        expectTemplate('', '', 'testing');
      });

      describe('insertAdjacentHTML', function () {
        var container;

        // An element must have a parent ot use "beforebegin" and "afterend".
        beforeEach(function () {
          container = document.createElement('div');
          container.appendChild(element);
          element.childNodes[0].setAttribute('data-skate-content', '');
        });

        it('beforebegin', function () {
          $element.insertAdjacentHTML('beforebegin', '<three></three>');
          expect(element.previousSibling.tagName).to.equal('THREE');
        });

        it('afterbegin', function () {
          $element.insertAdjacentHTML('afterbegin', '<three></three>');
          expect($element.firstChild.tagName).to.equal('THREE');
        });

        it('beforeend', function () {
          $element.insertAdjacentHTML('beforeend', '<three></three>');
          expect($element.childNodes[1].tagName).to.equal('THREE');
        });

        it('afterend', function () {
          $element.insertAdjacentHTML('afterend', '<three></three>');
          expect(element.nextSibling.tagName).to.equal('THREE');
        });
      });

      describe('removeChild', function () {
        it('should remove the specified child', function () {
          $element.removeChild($element.firstChild);
          $element.removeChild($element.lastChild);
          expectTemplate('', '');
        });
      });

      describe('replaceChild', function () {
        it('should remplace the specified child', function () {
          $element.replaceChild(document.createElement('three'), $element.lastChild);
          expectTemplate('<one></one>', '<three></three>');
        });
      });
    });
  });
});
