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

		register_rest_route(
			'cereve/v1',
			'/products/catalog-meta',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => 'cereve_storefront_catalog_meta',
				'args'                => array(
					'ids' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			'cereve/v1',
			'/products/catalog-counts',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => '__return_true',
				'callback'            => 'cereve_storefront_catalog_counts',
			)
		);
	}
);

/** Restrict Store API catalogue results to the active suppliers and products with an image. */
add_filter(
	'rest_request_before_callbacks',
	static function ( $response, $handler, WP_REST_Request $request ) {
		unset( $handler );
		if ( '/wc/store/v1/products' === untrailingslashit( $request->get_route() ) ) {
			$GLOBALS['cereve_storefront_product_collection_request'] = true;
		}
		return $response;
	},
	10,
	3
);

add_action(
	'pre_get_posts',
	static function ( WP_Query $query ): void {
		if ( empty( $GLOBALS['cereve_storefront_product_collection_request'] ) || ! in_array( 'product', (array) $query->get( 'post_type' ), true ) ) {
			return;
		}

		$meta_query   = (array) $query->get( 'meta_query' );
		$meta_query[] = array(
			'key'     => '_sillage_vendor',
			'value'   => array( 'beautyfort', 'bts' ),
			'compare' => 'IN',
		);
		$meta_query[] = array(
			'key'     => '_external_thumbnail_url',
			'value'   => '',
			'compare' => '!=',
		);
		$query->set( 'meta_query', $meta_query );
	},
	20
);

/** Return supplier and destination-country metadata for a batch of published product IDs. */
function cereve_storefront_catalog_meta( WP_REST_Request $request ) {
	$ids = array_slice( array_unique( array_filter( array_map( 'absint', explode( ',', (string) $request->get_param( 'ids' ) ) ) ) ), 0, 100 );
	$out = array();
	foreach ( $ids as $id ) {
		if ( 'publish' !== get_post_status( $id ) || 'product' !== get_post_type( $id ) ) {
			continue;
		}
		$vendor = strtolower( (string) get_post_meta( $id, '_sillage_vendor', true ) );
		$image_url = get_post_meta( $id, '_external_thumbnail_url', true );
		if ( ! in_array( $vendor, array( 'beautyfort', 'bts' ), true ) || ! is_string( $image_url ) || '' === trim( $image_url ) ) {
			continue;
		}
		$raw       = get_post_meta( $id, '_sillage_ship_countries', true );
		$countries = is_string( $raw ) ? json_decode( $raw, true ) : array();
		$out[ (string) $id ] = array(
			'vendor'    => $vendor,
			'countries' => is_array( $countries ) ? array_values( array_filter( array_map( 'strtoupper', $countries ), 'is_string' ) ) : array(),
		);
	}
	$country_names = function_exists( 'WC' ) && WC()->countries ? WC()->countries->get_allowed_countries() : array();
	return rest_ensure_response( array( 'products' => $out, 'countries' => $country_names ) );
}

/** Count only in-stock, image-bearing products from the active supplier feeds. */
function cereve_storefront_catalog_counts() {
	global $wpdb;
	$cached = wp_cache_get( 'active_product_category_counts', 'cereve_storefront' );
	if ( false !== $cached ) {
		return rest_ensure_response( $cached );
	}

	$lookup = $wpdb->prefix . 'wc_product_meta_lookup';
	$rows   = $wpdb->get_results(
		"SELECT tt.term_id, COUNT(DISTINCT p.ID) AS product_count
		FROM {$wpdb->term_taxonomy} tt
		INNER JOIN {$wpdb->term_relationships} tr ON tr.term_taxonomy_id = tt.term_taxonomy_id
		INNER JOIN {$wpdb->posts} p ON p.ID = tr.object_id AND p.post_type = 'product' AND p.post_status = 'publish'
		INNER JOIN {$wpdb->postmeta} vendor ON vendor.post_id = p.ID AND vendor.meta_key = '_sillage_vendor' AND vendor.meta_value IN ('beautyfort', 'bts')
		INNER JOIN {$wpdb->postmeta} image ON image.post_id = p.ID AND image.meta_key = '_external_thumbnail_url' AND image.meta_value <> ''
		INNER JOIN {$lookup} lookup ON lookup.product_id = p.ID AND lookup.stock_status = 'instock'
		WHERE tt.taxonomy = 'product_cat'
		GROUP BY tt.term_id",
		ARRAY_A
	);
	$counts = array();
	foreach ( (array) $rows as $row ) {
		$counts[ (string) $row['term_id'] ] = (int) $row['product_count'];
	}
	wp_cache_set( 'active_product_category_counts', $counts, 'cereve_storefront', 300 );
	return rest_ensure_response( $counts );
}

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
