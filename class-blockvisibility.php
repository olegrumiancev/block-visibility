<?php
/**
 * Plugin Name:         Block Visibility
 * Plugin URI:          http://www.outermost.co/
 * Description:         Block-based visibility control for WordPress
 * Version:             0.1.0
 * Requires at least:   5.4
 * Requires PHP:        5.6
 * Author:              Nick Diego
 * Author URI:          https://www.nickdiego.com
 * License:             GPLv2
 * License URI:         https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * Text Domain:         block-visibility
 * Domain Path:         /languages
 *
 * @package block-visibility
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'BLOCKVISIBILITY_VERSION', '0.1.0' );
define( 'BLOCKVISIBILITY_PLUGIN_FILE', __FILE__ );
define( 'BLOCKVISIBILITY_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'BLOCKVISIBILITY_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'BLOCKVISIBILITY_PLUGIN_BASE', plugin_basename( __FILE__ ) );
define( 'BLOCKVISIBILITY_REVIEW_URL', 'https://wordpress.org/support/plugin/block-visibility/reviews/?filter=5' );
define( 'BLOCKVISIBILITY_SUPPORT_URL', 'https://wordpress.org/support/plugin/block-visibility/' );
define( 'BLOCKVISIBILITY_SETTINGS_URL', admin_url( 'options-general.php?page=block-visibility-settings' ) );

if ( ! class_exists( 'BlockVisibility' ) ) {
	/**
	 * Main Block Visibility Class.
	 *
	 * @since 1.0.0
	 */
	final class BlockVisibility {
		/**
		 * Return singleton instance of the Block Visibility plugin.
		 *
		 * @since 1.0.0
		 * @return self
		 */
		public static function factory() {
			static $instance = false;

			if ( ! $instance ) {
				$instance = new self();
				$instance->init();
				$instance->includes();
			}
			return $instance;
		}

		/**
		 * Cloning instances of the class is forbidden.
		 *
		 * @since 1.0.0
		 * @return void
		 */
		public function __clone() {
			_doing_it_wrong(
				__FUNCTION__,
				esc_html__( 'Something went wrong.', 'block-visibility' ),
				'1.0'
			);
		}

		/**
		 * Unserializing instances of the class is forbidden.
		 *
		 * @since 1.0.0
		 * @return void
		 */
		public function __wakeup() {
			_doing_it_wrong(
				__FUNCTION__,
				esc_html__( 'Something went wrong.', 'block-visibility' ),
				'1.0'
			);
		}

		/**
		 * Include required files.
		 *
		 * @since 1.0.0
		 * @return void
		 */
		public function includes() {

			// Needs to be included at all times due to show_in_rest.
			require_once BLOCKVISIBILITY_PLUGIN_DIR . 'includes/register-settings.php';

			// Only include in the admin.
			if ( is_admin() || ( defined( 'WP_CLI' ) && WP_CLI ) ) {
				require_once BLOCKVISIBILITY_PLUGIN_DIR . 'includes/admin/editor.php';
				require_once BLOCKVISIBILITY_PLUGIN_DIR . 'includes/admin/settings.php';
				require_once BLOCKVISIBILITY_PLUGIN_DIR . 'includes/admin/plugin-action-links.php';

				// Utility functions.
				require_once BLOCKVISIBILITY_PLUGIN_DIR . 'includes/utils/get-asset-file.php';
				require_once BLOCKVISIBILITY_PLUGIN_DIR . 'includes/utils/get-user-roles.php';
			}

			// Only include on the frontend.
			if ( ! is_admin() ) {
				require_once BLOCKVISIBILITY_PLUGIN_DIR . 'includes/frontend/render-block.php';
			}
		}

		/**
		 * Load required actions.
		 *
		 * @since 1.0.0
		 * @return void
		 */
		public function init() {
			add_action( 'plugins_loaded', array( $this, 'load_textdomain' ), 99 );
			add_action( 'enqueue_block_editor_assets', array( $this, 'block_localization' ) );

			add_action( 'wp_loaded', array( $this, 'add_attributes_to_registered_blocks' ), 100 );
		}

		/**
		 * Adds the `hasCustomCSS` and `customCSS` attributes to all blocks, to
		 * avoid `Invalid parameter(s): attributes` error in Gutenberg.
		 *
		 * Reference: https://github.com/WordPress/gutenberg/issues/16850
		 *
		 * @hooked wp_loaded, 100
		 */
		public function add_attributes_to_registered_blocks() {

			$registered_blocks = WP_Block_Type_Registry::get_instance()->get_all_registered();

			foreach ( $registered_blocks as $name => $block ) {
				$block->attributes['blockVisibility'] = array(
					'type'       => 'object',
					'properties' => array(
						'hideBlock'        => array(
							'type' => 'boolean',
						),
						'visibilityByRole' => array(
							'type' => 'string',
						),
						'restrictedRoles'  => array(
							'type'  => 'array',
							'items' => array(
								'type' => 'string',
							),
						),
					),
					'default'    => array(
						'hideBlock'        => false,
						'visibilityByRole' => 'all',
						'restrictedRoles'  => array(),
					),
				);
			}
		}

		/**
		 * Loads the plugin language files.
		 *
		 * @since 1.0.0
		 * @return void
		 */
		public function load_textdomain() {
			load_plugin_textdomain(
				'block-visibility',
				false,
				basename( BLOCKVISIBILITY_PLUGIN_DIR ) . '/languages'
			);
		}

		/**
		 * Enqueue localization data for our blocks.
		 * TODO: fix script identifier
		 * TODO: figure out how to load translators for the settings js
		 *
		 * @since 2.0.0
		 * @return void
		 */
		public function block_localization() {
			if ( function_exists( 'wp_set_script_translations' ) ) {
				wp_set_script_translations(
					'block-visibility-editor-scripts',
					'block-visibility',
					BLOCKVISIBILITY_PLUGIN_DIR . '/languages'
				);

				wp_set_script_translations(
					'block-visibility-setting-scripts',
					'block-visibility',
					BLOCKVISIBILITY_PLUGIN_DIR . '/languages'
				);
			}
		}
	}
}

/**
 * The main function for that returns the Block Visibility class
 *
 * @since 1.0.0
 * @return object|BlockVisibility
 */
function blockvisibility_load_plugin() {
	return BlockVisibility::factory();
}

// Get the plugin running. Load on plugins_loaded action to avoid issue on multisite.
if ( function_exists( 'is_multisite' ) && is_multisite() ) {
	add_action( 'plugins_loaded', 'blockvisibility_load_plugin', 90 );
} else {
	blockvisibility_load_plugin();
}
