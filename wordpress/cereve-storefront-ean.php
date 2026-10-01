<?php
/**
 * Plugin Name: Storefront EAN API
 * Description: Exposes published product EANs to the first-party headless storefront.
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'cereve/v1',
			'/ean/(?P<ean>[0-9]{8,14})',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => 'cereve_storefront_find_ean',
				'args'                => array(
					'ean' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			'cereve/v1',
			'/products/(?P<id>[0-9]+)/ean',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => 'cereve_storefront_product_ean',
				'args'                => array(
					'id' => array(
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}
);

/** Resolve an EAN through WooCommerce's indexed global unique ID lookup. */
function cereve_storefront_find_ean( WP_REST_Request $request ) {
	$ean        = (string) $request->get_param( 'ean' );
	$product_id = function_exists( 'wc_get_product_id_by_global_unique_id' )
		? wc_get_product_id_by_global_unique_id( $ean )
		: 0;

	if ( ! $product_id ) {
		return new WP_Error( 'product_ean_not_found', __( 'No product matches that EAN.', 'storefront-ean' ), array( 'status' => 404 ) );
	}

	$product = wc_get_product( $product_id );
	if ( ! $product || 'publish' !== get_post_status( $product->get_id() ) ) {
		return new WP_Error( 'product_ean_not_found', __( 'No product matches that EAN.', 'storefront-ean' ), array( 'status' => 404 ) );
	}

	return rest_ensure_response(
		array(
			'id'  => (int) $product->get_id(),
			'ean' => (string) $product->get_global_unique_id(),
		)
	);
}

/** Return the EAN for a published product only. */
function cereve_storefront_product_ean( WP_REST_Request $request ) {
	$product = wc_get_product( absint( $request->get_param( 'id' ) ) );
	if ( ! $product || 'publish' !== get_post_status( $product->get_id() ) ) {
		return new WP_Error( 'product_not_found', __( 'Product not found.', 'storefront-ean' ), array( 'status' => 404 ) );
	}

	return rest_ensure_response(
		array(
			'id'  => (int) $product->get_id(),
			'ean' => (string) $product->get_global_unique_id(),
		)
	);
}
