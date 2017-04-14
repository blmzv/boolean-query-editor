import React, { PropTypes, Component } from 'react';
import { Editor } from 'draft-js';
import { termStartIndex } from './lib';

export { normalizeSelectedIndex } from './lib';

function noop() {}

class QueryEditor extends Component {
  static propTypes = {
    editorState: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    onEscape: PropTypes.func,
    onUpArrow: PropTypes.func,
    onDownArrow: PropTypes.func,
    onQueryChange: PropTypes.func,
    handleReturn: PropTypes.func,
    handleQueryReturn: PropTypes.func,
    handlePastedText: PropTypes.func,
  };

  static defaultProps = {
    onChange: noop,
    onEscape: noop,
    onUpArrow: noop,
    onDownArrow: noop,
    onQueryChange: noop,
    handleReturn: noop,
    handleQueryReturn: noop,
    handlePastedText: noop,
  };

  queryState = null;

  focus = () => {
    this.ref.focus();
  };

  getTermRange = () => {
    const selection = window.getSelection();

    if (selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const textContent = range.startContainer.textContent;
    const start = termStartIndex(textContent);
    const end = range.startOffset;

    return {
      start,
      end,
      text: textContent.substring(start, end),
    }
  };

  getQueryState = () => {
    const textRange = this.getTermRange();

    if (textRange === null) {
      return null;
    }

    const tempRange = window.getSelection().getRangeAt(0).cloneRange();
    tempRange.setStart(tempRange.startContainer, textRange.start);
    const rangeRect = tempRange.getBoundingClientRect();

    this.queryState = {
      top: rangeRect.bottom,
      left: rangeRect.left,
      text: textRange.text,
      selectedIndex: 0,
    };

    return this.queryState;
  };

  onChange = (editorState) => {
    this.props.onChange(editorState);

    window.requestAnimationFrame(() => {
      this.props.onQueryChange(this.getQueryState());
    });
  };

  onEscape = (e) => {
    if (this.queryState === null) {
      this.props.onEscape(e);

      return 'not-handled';
    }

    e.preventDefault();
    this.queryState = null;
    this.props.onQueryChange(this.queryState);

    return 'handled';
  };

  onArrow = (e, originalEvent, step) => {
    if (this.queryState === null) {
      originalEvent(e);

      return 'handled';
    }

    e.preventDefault();
    this.queryState.selectedIndex += step;
    this.props.onQueryChange(this.queryState);

    return 'handled';
  };

  onUpArrow = (e) => {
    return this.onArrow(e, this.props.onUpArrow, -1);
  };

  onDownArrow = (e) => {
    return this.onArrow(e, this.props.onDownArrow, 1);
  };

  handleReturn = (e) => {
    if (this.queryState) {
      const { text, selectedIndex } = this.queryState;
      const content = this.props.editorState.getCurrentContent();
      const selection = content.getSelectionAfter();
      const entitySelection = selection.set(
        'anchorOffset', selection.getFocusOffset() - text.length
      );

      this.props.handleQueryReturn(text, selectedIndex, entitySelection);

      this.queryState = null;
      this.props.onQueryChange(this.queryState);

      return 'handled';
    }

    return 'not-handled';
  };

  handlePastedText = () => true;

  render() {
    const { editorState } = this.props;

    return (
      <Editor
        ref={ref => { this.ref = ref; }}
        editorState={editorState}
        onChange={this.onChange}
        onEscape={this.onEscape}
        onUpArrow={this.onUpArrow}
        onDownArrow={this.onDownArrow}
        handleReturn={this.handleReturn}
        handlePastedText={this.handlePastedText}
      />
    );
  }
}

export default QueryEditor;
