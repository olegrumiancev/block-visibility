/**
 * External dependencies
 */
import { assign } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter, applyFilters } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import VisibilityInspectorControls from './editor/inspector-controls';

/**
 * Add the visibility setting sttribute to selected blocks.
 *
 * @since 1.0.0
 * @param {Object}  settings All settings associated with a block type.
 * @return {Object} settings The updated array of settings.
 */
function blockVisibilityAttributes( settings ) {
	// This is a global variable added to the page via PHP
	const fullControlMode = blockVisibilityFullControlMode; // eslint-disable-line
	let visibilityAttributes = {
		blockVisibility: {
			type: 'object',
			properties: {
				hideBlock: {
					type: 'boolean',
				},
				visibilityByRole: {
					type: 'string',
				},
				restrictedRoles: {
					type: 'array',
				},
			},
			default: {
				hideBlock: false,
				visibilityByRole: 'all',
				restrictedRoles: [],
			},
		},
	};
	visibilityAttributes = applyFilters(
		'blockVisibility.visibilityAttributes',
		visibilityAttributes
	);

	// We don't want to enable visibility for blocks that cannot be added via
	// the inserter of is a child block. This excludes blocks such as reusable
	// blocks, individual column block, etc. But if we are in Full Control Mode
	// add settings to every block
	if (
		fullControlMode ||
		( hasBlockSupport( settings, 'inserter', true ) &&
			! settings.hasOwnProperty( 'parent' ) )
	) {
		settings.attributes = assign(
			settings.attributes,
			visibilityAttributes
		);
	}
	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'block-visibility/attributes',
	blockVisibilityAttributes
);

/**
 * Filter the block edit object and add visibility controls to selected blocks.
 */
const blockVisibilityInspectorControls = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			return (
				<>
					<BlockEdit { ...props } />
					<VisibilityInspectorControls { ...props } />
				</>
			);
		};
	},
	'blockVisibilityInspectorControls'
);

addFilter(
	'editor.BlockEdit',
	'block-visibility/inspector-controls',
	blockVisibilityInspectorControls,
	100 // We want Visibility to appear rigth above Advanced controls
);
