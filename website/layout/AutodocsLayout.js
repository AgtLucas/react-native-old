/**
 * @providesModule AutodocsLayout
 * @jsx React.DOM
 */

var DocsSidebar = require('DocsSidebar');
var H = require('Header');
var Header = require('Header');
var Marked = require('Marked');
var React = require('React');
var Site = require('Site');
var slugify = require('slugify');


var ComponentDoc = React.createClass({
  renderType: function(type) {
    if (type.name === 'enum') {
      if (typeof type.value === 'string') {
        return type.value;
      }
      return 'enum(' + type.value.map((v => v.value)).join(', ') + ')';
    }

    if (type.name === 'shape') {
      return '{' + Object.keys(type.value).map((key => key + ': ' + this.renderType(type.value[key]))).join(', ') + '}';
    }

    if (type.name === 'arrayOf') {
      return '[' + this.renderType(type.value) + ']';
    }

    if (type.name === 'instanceOf') {
      return type.value;
    }

    if (type.name === 'custom') {
      return type.raw;
    }

    return type.name;
  },

  renderProp: function(name, prop) {
    return (
      <div className="prop" key={name}>
        <Header level={4} className="propTitle" toSlug={name}>
          {name}
          {' '}
          {prop.type && <span className="propType">
            {this.renderType(prop.type)}
          </span>}
        </Header>
        {prop.description && <Marked>{prop.description}</Marked>}
      </div>
    );
  },

  renderCompose: function(name) {
    return (
      <div className="prop" key={name}>
        <Header level={4} className="propTitle" toSlug={name}>
          <a href={slugify(name) + '.html#proptypes'}>{name} props...</a>
        </Header>
      </div>
    );
  },

  renderProps: function(props, composes) {
    return (
      <div className="props">
        {(composes || []).map((name) =>
          this.renderCompose(name)
        )}
        {Object.keys(props).sort().map((name) =>
          this.renderProp(name, props[name])
        )}
      </div>
    );
  },

  render: function() {
    var content = this.props.content;
    return (
      <div>
        <Marked>
          {content.description}
        </Marked>
        <H level={3}>Props</H>
        {this.renderProps(content.props, content.composes)}
      </div>
    );
  }
});

var APIDoc = React.createClass({
  removeCommentsFromDocblock: function(docblock) {
    return docblock
      .trim('\n ')
      .replace(/^\/\*+/, '')
      .replace(/\*\/$/, '')
      .split('\n')
      .map(function(line) {
        return line.trim().replace(/^\* */, '');
      })
      .join('\n');
  },

  renderTypehintRec: function(typehint) {
    if (typehint.type === 'simple') {
      return typehint.value;
    }

    if (typehint.type === 'generic') {
      return this.renderTypehintRec(typehint.value[0]) + '<' + this.renderTypehintRec(typehint.value[1]) + '>';
    }

    return JSON.stringify(typehint);

  },

  renderTypehint: function(typehint) {
    try {
      var typehint = JSON.parse(typehint);
    } catch(e) {
      return typehint;
    }

    return this.renderTypehintRec(typehint);
  },

  renderMethod: function(method) {
    return (
      <div className="prop" key={method.name}>
        <Header level={4} className="propTitle" toSlug={method.name}>
          {method.modifiers.length && <span className="propType">
            {method.modifiers.join(' ') + ' '}
          </span>}
          {method.name}(
          <span className="propType">
            {method.params
              .map((param) => {
                var res = param.name;
                if (param.typehint) {
                  res += ': ' + this.renderTypehint(param.typehint);
                }
                return res;
              })
              .join(', ')}
          </span>
          )
        </Header>
        {method.docblock && <Marked>
          {this.removeCommentsFromDocblock(method.docblock)}
        </Marked>}
      </div>
    );
  },


  renderMethods: function(methods) {
    return (
      <div className="props">
        {methods.map(this.renderMethod)}
      </div>
    );
  },

  render: function() {
    var content = this.props.content;
    if (!content.methods) {
      return <div>Error</div>;
    }
    return (
      <div>
        <Marked>
          {this.removeCommentsFromDocblock(content.docblock)}
        </Marked>
        <H level={3}>Methods</H>
        {this.renderMethods(content.methods)}
      </div>
    );
  }
});

var Autodocs = React.createClass({
  render: function() {
    var metadata = this.props.metadata;
    var content = JSON.parse(this.props.children);
    return (
      <Site section="docs">
        <section className="content wrap documentationContent">
          <DocsSidebar metadata={metadata} />
          <div className="inner-content">
            <a id="content" />
            <h1>{metadata.title}</h1>
            {content.type === 'component' ?
              <ComponentDoc content={content} /> :
              <APIDoc content={content} />}
            <Marked>
              {content.fullDescription}
            </Marked>
            <div className="docs-prevnext">
              {metadata.previous && <a className="docs-prev" href={metadata.previous + '.html#content'}>&larr; Prev</a>}
              {metadata.next && <a className="docs-next" href={metadata.next + '.html#content'}>Next &rarr;</a>}
            </div>
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = Autodocs;
