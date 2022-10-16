/**
 * External dependencies
 */
import { assign } from 'lodash';
import Select from 'react-select';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Disabled, Notice } from '@wordpress/components';
import { Icon } from '@wordpress/icons';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import icons from './../../utils/icons';
import { InformationPopover } from './../../components';

/**
 * Add the Wp Fusion controls
 *
 * @since 1.7.0
 * @param {Object} props All the props passed to this function
 * @return {string}		 Return the rendered JSX
 */
export default function WPFusion( props ) {
	const { variables, enabledControls, controlSetAtts, setControlAtts } =
		props;
	const pluginActive = variables?.integrations?.wp_fusion?.active ?? false;
	const controlActive = enabledControls.some(
		( control ) => control.settingSlug === 'wp_fusion' && control?.isActive
	);

	if ( ! controlActive || ! pluginActive ) {
		return null;
	}

	const hasUserRoles =
		controlSetAtts?.controls.hasOwnProperty( 'userRole' ) ?? false;
	const userRoles =
		controlSetAtts?.controls?.userRole?.visibilityByRole ?? 'public';
	const availableTags = variables?.integrations?.wp_fusion?.tags ?? [];

	// Concert array of tag value to array of tag objects with values and labels.
	const convertTags = ( tags ) => {
		const selectedTags = availableTags.filter( ( tag ) =>
			tags.includes( tag.value )
		);
		return selectedTags;
	};

	const wpFusion = controlSetAtts?.controls?.wpFusion ?? {};
	const tagsAny = convertTags( wpFusion?.tagsAny ?? [] );
	const tagsAll = convertTags( wpFusion?.tagsAll ?? [] );
	const tagsNot = convertTags( wpFusion?.tagsNot ?? [] );

	const handleOnChange = ( attribute, tags ) => {
		const newTags = [];

		if ( tags.length !== 0 ) {
			tags.forEach( ( tag ) => {
				newTags.push( tag.value );
			} );
		}

		setControlAtts(
			'wpFusion',
			assign( { ...wpFusion }, { [ attribute ]: newTags } )
		);
	};

	let anyAllFields = (
		<>
			<div className="visibility-control wp-fusion__tags-any">
				<div className="visibility-control__label">
					{ __( 'Required Tags (Any)', 'block-visibility' ) }
				</div>
				<Select
					className="block-visibility__react-select"
					classNamePrefix="react-select"
					options={ availableTags }
					value={ tagsAny }
					placeholder={ __( 'Select Tag…', 'block-visibility' ) }
					onChange={ ( value ) => handleOnChange( 'tagsAny', value ) }
					isMulti
				/>
				<div className="visibility-control__help">
					{ __(
						'Only visible to logged-in users with at least one of the selected tags.',
						'block-visibility'
					) }
				</div>
			</div>
			<div className="visibility-control wp-fusion__tags-all">
				<div className="visibility-control__label">
					{ __( 'Required Tags (All)', 'block-visibility' ) }
				</div>
				<Select
					className="block-visibility__react-select"
					classNamePrefix="react-select"
					options={ availableTags }
					value={ tagsAll }
					placeholder={ __( 'Select Tag…', 'block-visibility' ) }
					onChange={ ( value ) => handleOnChange( 'tagsAll', value ) }
					isMulti
				/>
				<div className="visibility-control__help">
					{ createInterpolateElement(
						__(
							'Only visible to logged-in users with <strong>all</strong> of the selected tags.',
							'block-visibility'
						),
						{
							strong: <strong />,
						}
					) }
				</div>
			</div>
		</>
	);

	if ( userRoles === 'public' || userRoles === 'logged-out' ) {
		anyAllFields = <Disabled>{ anyAllFields }</Disabled>;
	}

	let notField = (
		<div className="visibility-control wp-fusion__tags-not">
			<div className="visibility-control__label">
				{ __( 'Required Tags (Not)', 'block-visibility' ) }
			</div>
			<Select
				className="block-visibility__react-select"
				classNamePrefix="react-select"
				options={ availableTags }
				value={ tagsNot }
				placeholder={ __( 'Select Tag…', 'block-visibility' ) }
				onChange={ ( value ) => handleOnChange( 'tagsNot', value ) }
				isMulti
			/>
			<div className="visibility-control__help">
				{ __(
					'Hide from logged-in users with at least one of the selected tags.',
					'block-visibility'
				) }
			</div>
		</div>
	);

	if ( userRoles === 'logged-out' ) {
		notField = <Disabled>{ notField }</Disabled>;
	}

	return (
		<div className="control-panel-item wp-fusion-control">
			<h3 className="control-panel-item__header has-icon">
				<Icon icon={ icons.wpFusion } />
				<span>{ __( 'WP Fusion', 'block-visibility' ) }</span>
				<InformationPopover
					message={ __(
						'The WP Fusion control allows you to configure block visibility based on WP Fusion tags.',
						'block-visibility'
					) }
					subMessage={ __(
						'Note that the available fields depend on the User Role control settings. If the User Role control is disabled, only the Required Tags (Not) field will be available.',
						'block-visibility'
					) }
					link="https://www.blockvisibilitywp.com/knowledge-base/how-to-use-the-wp-fusion-control/?bv_query=learn_more&utm_source=plugin&utm_medium=settings&utm_campaign=plugin_referrals"
					position="bottom center"
				/>
			</h3>
			<div className="control-panel-item__fields">
				{ anyAllFields }
				{ notField }
			</div>
			{ ! hasUserRoles && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'The WP Fusion control works best in coordination with the User Role control, which has been disabled. To re-enable, click the eye icon in the Controls Toolbar above.',
						'block-visibility'
					) }
				</Notice>
			) }
		</div>
	);
}
