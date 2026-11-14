import createComponentFactory from '@suid/base/createComponentFactory';
import { styled } from '@suid/material/styles';
import clsx from '../clsx';
import { DragBarTypeMap } from './DragBarProps';
import { getDragBarUtilityClass } from './dragBarClasses';

const $ = createComponentFactory<DragBarTypeMap>()({
  name: 'MuiDragBar',
  selfPropNames: ['children', 'classes'],
  utilityClass: getDragBarUtilityClass,
  slotClasses: () => ({
    root: ['root'],
    handle: ['handle'],
  }),
});

const DragBarRoot = styled('div', {
  name: 'MuiDragBar',
  slot: 'Root',
  overridesResolver: (_, styles) => styles.root,
})(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: 32,
  flexShrink: 0,
  userSelect: 'none',
}));

const DragBarHandle = styled('div', {
  name: 'MuiDragBar',
  slot: 'Handle',
  overridesResolver: (_, styles) => styles.handle,
})(({ theme }) => ({
  width: 30,
  height: 6,
  borderRadius: 3,
  backgroundColor: theme.palette.divider,
}));

/**
 * A presentational drag handle for bottom sheets.
 */
const DragBar = $.component(function DragBar({ allProps, props, classes, otherProps }) {
  return (
    <DragBarRoot
      {...otherProps}
      as={otherProps.component}
      class={clsx(classes.root, otherProps.class)}
      ownerState={allProps}
    >
      {props.children ?? <DragBarHandle class={classes.handle} ownerState={allProps} />}
    </DragBarRoot>
  );
});

export default DragBar;
